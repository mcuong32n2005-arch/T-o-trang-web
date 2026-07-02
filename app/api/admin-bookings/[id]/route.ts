// Đích: app/api/dashboard/bookings/[id]/route.ts (thay thế file cũ)
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction, createNotification } from "@/lib/adminLog";
import { ROOM_STATUS, AUTO_MANAGED_ROOM_STATUSES } from "@/lib/roomStatus";
import type { CustomerNotificationType } from "@/lib/types";

const ALLOWED_ACTIONS = ["confirm", "cancel", "check-in", "check-out"] as const;
type Action = (typeof ALLOWED_ACTIONS)[number];

const ACTION_TO_STATUS: Record<Action, string> = {
  confirm: "confirmed",
  cancel: "cancelled",
  "check-in": "checked-in",
  "check-out": "checked-out",
};

const ACTION_LOG_LABEL: Record<Action, string> = {
  confirm: "Đã xác nhận booking",
  cancel: "Đã hủy booking",
  "check-in": "Đã check-in booking",
  "check-out": "Đã check-out booking",
};

// Loại thông báo tương ứng sẽ gửi RIÊNG cho khách đã đặt đơn này (không phải cho admin).
const ACTION_TO_CUSTOMER_NOTIFICATION_TYPE: Record<Action, CustomerNotificationType> = {
  confirm: "booking_confirmed",
  cancel: "booking_cancelled",
  "check-in": "checked_in",
  "check-out": "checked_out",
};

// Các giá trị status coi là do HỆ THỐNG BOOKING tự quản lý (Trống / Đã đặt / Đang ở).
// Nếu phòng đang ở trạng thái admin tự tay đặt như "Đang vệ sinh" hoặc "Bảo trì" thì
// KHÔNG tự động ghi đè, tránh lỡ tay mở lại phòng chưa sẵn sàng đón khách.
// (Danh sách này định nghĩa DUY NHẤT ở lib/roomStatus.ts để khớp với API rooms.)

// Tính lại trạng thái phòng dựa trên các booking hiện có, rồi ghi vào collection
// "rooms" để trang khách hàng (badge "Hết phòng") và form sửa phòng luôn khớp với
// thực tế: đang có booking "checked-in" -> Đang ở; không có checked-in nhưng còn
// booking "confirmed" -> Đã đặt; không còn booking nào giữ phòng -> Trống.
//
// TỐI ƯU TỐC ĐỘ: gộp 2 lệnh tìm "checked-in" / "confirmed" thành 1 lệnh find()
// duy nhất (dùng $in), và chạy song song với lệnh đọc room bằng Promise.all —
// thay vì đợi tuần tự 3 lượt round-trip tới MongoDB Atlas như bản cũ (mỗi lượt
// có thể mất 700ms-1.5s nếu server ở xa cluster, cộng dồn gây PUT chậm 6-11s).
async function syncRoomStatus(db: Awaited<ReturnType<typeof getDb>>, roomId?: string) {
  if (!roomId || !ObjectId.isValid(roomId)) return;

  try {
    const roomObjectId = new ObjectId(roomId);

    const [room, occupyingBookings] = await Promise.all([
      db.collection("rooms").findOne({ _id: roomObjectId }, { projection: { status: 1 } }),
      db
          .collection("bookings")
          .find({ roomId, status: { $in: ["checked-in", "confirmed"] } }, { projection: { status: 1 } })
          .toArray(),
    ]);

    if (!room) return;
    if (!AUTO_MANAGED_ROOM_STATUSES.includes(room.status)) return; // đang vệ sinh/bảo trì -> bỏ qua

    const hasCheckedIn = occupyingBookings.some((b) => b.status === "checked-in");
    const hasConfirmed = occupyingBookings.some((b) => b.status === "confirmed");
    const newStatus = hasCheckedIn ? ROOM_STATUS.OCCUPIED : hasConfirmed ? ROOM_STATUS.BOOKED : ROOM_STATUS.AVAILABLE;

    if (room.status !== newStatus) {
      await db.collection("rooms").updateOne(
          { _id: roomObjectId },
          { $set: { status: newStatus, updatedAt: new Date() } }
      );
    }
  } catch (error) {
    console.error("Lỗi đồng bộ trạng thái phòng:", error);
  }
}

// Nội dung thông báo hiển thị cho khách — viết theo góc nhìn của khách, khác với
// ACTION_LOG_LABEL (viết theo góc nhìn nhật ký hệ thống của admin).
function buildCustomerMessage(action: Action, booking: { roomName?: string; roomCode?: string }) {
  const roomLabel = [booking.roomName, booking.roomCode ? `(${booking.roomCode})` : ""]
      .filter(Boolean)
      .join(" ")
      .trim();

  switch (action) {
    case "confirm":
      return `Đơn đặt phòng ${roomLabel} của bạn đã được xác nhận. Hẹn gặp bạn tại homestay!`;
    case "cancel":
      return `Đơn đặt phòng ${roomLabel} của bạn đã bị huỷ.`;
    case "check-in":
      return `Bạn đã check-in phòng ${roomLabel}. Chúc bạn có kỳ nghỉ vui vẻ!`;
    case "check-out":
      return `Bạn đã check-out phòng ${roomLabel}. Cảm ơn bạn đã sử dụng dịch vụ!`;
  }
}

// PUT: admin thực hiện hành động trên 1 booking — body: { action } hoặc { roomId, roomName, roomCode } để đổi phòng
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã booking không hợp lệ." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const db = await getDb();

    const booking = await db.collection("bookings").findOne({ _id: new ObjectId(id) });
    if (!booking) {
      return NextResponse.json({ message: "Không tìm thấy booking này." }, { status: 404 });
    }

    // Đổi phòng: body chứa roomId mới
    if (body.roomId && !body.action) {
      const oldRoomId = booking.roomId;

      // Bước ghi bookings PHẢI xong trước (các bước sau phụ thuộc vào roomId mới
      // đã lưu), nhưng logAction / thông báo / đồng bộ 2 phòng thì độc lập với
      // nhau -> chạy song song bằng Promise.all thay vì đợi tuần tự từng cái,
      // giảm đáng kể tổng thời gian round-trip tới MongoDB.
      await db.collection("bookings").updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              roomId: body.roomId,
              roomName: body.roomName || "",
              roomCode: body.roomCode || "",
              updatedAt: new Date(),
            },
          }
      );

      await Promise.all([
        logAction({ actorId: admin.userId, action: "Đã đổi phòng cho booking", target: id }),
        booking.bookedBy
            ? createNotification({
              type: "booking_confirmed",
              message: `Đơn đặt phòng của bạn đã được chuyển sang phòng ${body.roomName || ""} (${body.roomCode || ""}).`,
              relatedId: id,
              recipientId: booking.bookedBy,
            })
            : Promise.resolve(),
        // Đổi phòng có thể vừa giải phóng phòng cũ, vừa lấp đầy phòng mới ->
        // đồng bộ lại cả hai để danh sách phòng ngoài trang khách hàng đúng ngay.
        syncRoomStatus(db, oldRoomId),
        syncRoomStatus(db, body.roomId),
      ]);

      return NextResponse.json({ message: "Đã đổi phòng cho booking." });
    }

    const action = body.action as Action;
    if (!ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json({ message: "Hành động không hợp lệ." }, { status: 400 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ message: "Booking đã bị huỷ trước đó." }, { status: 400 });
    }

    await db.collection("bookings").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: ACTION_TO_STATUS[action], updatedAt: new Date() } }
    );

    // Ghi log, gửi thông báo (cho admin nếu huỷ, cho khách luôn), và đồng bộ lại
    // trạng thái phòng — 4 việc này ĐỘC LẬP với nhau (không cái nào cần đợi kết
    // quả của cái khác), nên chạy song song bằng Promise.all thay vì đợi tuần
    // tự từng cái. Đây chính là nguyên nhân khiến PUT trước đây mất 6-11 giây:
    // mỗi await tuần tự là 1 lượt round-trip riêng tới MongoDB Atlas.
    const tasks: Promise<unknown>[] = [
      logAction({
        actorId: admin.userId,
        action: ACTION_LOG_LABEL[action],
        target: `${booking.guestName} (${id})`,
      }),
      // Xác nhận / huỷ / check-in / check-out đều làm thay đổi việc phòng còn
      // trống hay không -> tính lại ngay để các trang khác (trang chủ, trang
      // booking) của khách hàng tiếp theo thấy đúng tình trạng phòng.
      syncRoomStatus(db, booking.roomId),
    ];

    // Thông báo nội bộ cho admin khi chính admin huỷ đơn (giữ nguyên hành vi cũ).
    if (action === "cancel") {
      tasks.push(
          createNotification({
            type: "cancel_booking",
            message: `Booking của ${booking.guestName} đã bị huỷ.`,
            relatedId: id,
          })
      );
    }

    // Thông báo RIÊNG cho khách hàng đã đặt đơn này, để họ thấy ngay trong tài khoản của mình
    // mà không cần admin nhắn tin thủ công.
    if (booking.bookedBy) {
      tasks.push(
          createNotification({
            type: ACTION_TO_CUSTOMER_NOTIFICATION_TYPE[action],
            message: buildCustomerMessage(action, { roomName: booking.roomName, roomCode: booking.roomCode }),
            relatedId: id,
            recipientId: booking.bookedBy,
          })
      );
    }

    await Promise.all(tasks);

    return NextResponse.json({ message: "Đã cập nhật trạng thái booking." });
  } catch (error) {
    console.error("Lỗi xử lý booking (admin):", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// DELETE: xoá booking đã huỷ
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã booking không hợp lệ." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const booking = await db.collection("bookings").findOne({ _id: new ObjectId(id) });

    if (!booking) {
      return NextResponse.json({ message: "Không tìm thấy booking này." }, { status: 404 });
    }

    if (booking.status !== "cancelled") {
      return NextResponse.json({ message: "Chỉ được xoá booking đã huỷ." }, { status: 400 });
    }

    await db.collection("bookings").deleteOne({ _id: new ObjectId(id) });
    await logAction({ actorId: admin.userId, action: "Đã xoá booking đã huỷ", target: id });

    return NextResponse.json({ message: "Đã xoá booking." });
  } catch (error) {
    console.error("Lỗi xoá booking:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
