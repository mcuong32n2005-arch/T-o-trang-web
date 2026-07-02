// Đích: app/api/bookings/[id]/route.ts (thay thế file cũ)
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/requireAdmin";
import { createNotification } from "@/lib/adminLog";
import { ROOM_STATUS, AUTO_MANAGED_ROOM_STATUSES } from "@/lib/roomStatus";

// Tính lại trạng thái phòng dựa trên các booking hiện có — giữ đồng bộ với logic
// tương tự ở app/api/dashboard/bookings/[id]/route.ts: đang có booking "checked-in"
// -> Đang ở; còn booking "confirmed" -> Đã đặt; không còn booking nào giữ phòng -> Trống.
async function syncRoomStatus(db: Awaited<ReturnType<typeof getDb>>, roomId?: string) {
    if (!roomId || !ObjectId.isValid(roomId)) return;

    try {
        const room = await db.collection("rooms").findOne({ _id: new ObjectId(roomId) });
        if (!room) return;
        if (!AUTO_MANAGED_ROOM_STATUSES.includes(room.status)) return;

        const hasCheckedIn = await db.collection("bookings").findOne({ roomId, status: "checked-in" });
        const hasConfirmed = hasCheckedIn
            ? null
            : await db.collection("bookings").findOne({ roomId, status: "confirmed" });

        const newStatus = hasCheckedIn ? ROOM_STATUS.OCCUPIED : hasConfirmed ? ROOM_STATUS.BOOKED : ROOM_STATUS.AVAILABLE;

        if (room.status !== newStatus) {
            await db.collection("rooms").updateOne(
                { _id: new ObjectId(roomId) },
                { $set: { status: newStatus, updatedAt: new Date() } }
            );
        }
    } catch (error) {
        console.error("Lỗi đồng bộ trạng thái phòng:", error);
    }
}

// PUT: Huỷ đơn đặt phòng
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: "Bạn cần đăng nhập để thực hiện thao tác này." }, { status: 401 });
    }

    try {
        const { id } = await params;
        const db = await getDb();

        // Tìm booking — đối chiếu theo userId của Clerk thay cho username cũ
        const booking = await db.collection("bookings").findOne({
            _id: new ObjectId(id),
            bookedBy: session.userId,
        });

        if (!booking) {
            return NextResponse.json({ message: "Đơn đặt phòng không tồn tại hoặc không thuộc về bạn." }, { status: 404 });
        }

        // Kiểm tra trạng thái
        if (booking.status === "cancelled") {
            return NextResponse.json({ message: "Đơn đặt phòng đã được huỷ trước đó." }, { status: 400 });
        }

        if (booking.status === "confirmed") {
            return NextResponse.json({ message: "Đơn đặt phòng đã được xác nhận, không thể huỷ." }, { status: 400 });
        }

        // Cập nhật trạng thái huỷ
        await db.collection("bookings").updateOne(
            { _id: new ObjectId(id) },
            { $set: { status: "cancelled", cancelledAt: new Date() } }
        );

        // Báo cho admin biết khách vừa tự huỷ đơn, để admin không cần tự soi từng đơn.
        await createNotification({
            type: "cancel_booking",
            message: `Khách ${booking.guestName} đã tự huỷ đơn đặt phòng ${booking.roomName || ""} (${booking.roomCode || ""}).`,
            relatedId: id,
        });

        // Huỷ đơn có thể vừa giải phóng phòng (nếu trước đó phòng đang bị coi là hết
        // phòng vì đơn này) -> tính lại trạng thái phòng ngay để khách tiếp theo thấy đúng.
        await syncRoomStatus(db, booking.roomId);

        return NextResponse.json({ message: "Huỷ đơn đặt phòng thành công." });
    } catch (error) {
        console.error("Lỗi huỷ booking:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}
