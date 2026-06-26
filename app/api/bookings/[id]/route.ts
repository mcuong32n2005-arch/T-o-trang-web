import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/requireAdmin";

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

        return NextResponse.json({ message: "Huỷ đơn đặt phòng thành công." });
    } catch (error) {
        console.error("Lỗi huỷ booking:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}
