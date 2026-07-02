// PUT: đánh dấu 1 thông báo là đã đọc (dùng nếu muốn đánh dấu từng thông báo riêng lẻ)
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/requireAdmin";

export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Mã thông báo không hợp lệ." }, { status: 400 });
    }

    try {
        const db = await getDb();
        const result = await db.collection("notifications").updateOne(
            { _id: new ObjectId(id), recipientId: session.userId },
            { $set: { isRead: true } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ message: "Không tìm thấy thông báo này." }, { status: 404 });
        }

        return NextResponse.json({ message: "Đã đánh dấu đã đọc." });
    } catch (error) {
        console.error("Lỗi đánh dấu thông báo:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}
