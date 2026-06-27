import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction, createNotification } from "@/lib/adminLog";

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
      await logAction({ actorId: admin.userId, action: "Đã đổi phòng cho booking", target: id });
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

    await logAction({
      actorId: admin.userId,
      action: ACTION_LOG_LABEL[action],
      target: `${booking.guestName} (${id})`,
    });

    if (action === "cancel") {
      await createNotification({
        type: "cancel_booking",
        message: `Booking của ${booking.guestName} đã bị huỷ.`,
        relatedId: id,
      });
    }

    return NextResponse.json({ message: "Đã cập nhật trạng thái booking." });
  } catch (error) {
    console.error("Lỗi xử lý booking (admin):", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
