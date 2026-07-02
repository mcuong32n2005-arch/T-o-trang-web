import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/requireAdmin";

// PUT: đánh dấu tất cả thông báo của khách hàng hiện tại là đã đọc
// (gọi khi khách mở dropdown chuông thông báo).
export async function PUT() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
    }

    try {
        const db = await getDb();
        await db.collection("notifications").updateMany(
            { recipientId: session.userId, isRead: false },
            { $set: { isRead: true } }
        );
        return NextResponse.json({ message: "Đã đánh dấu tất cả là đã đọc." });
    } catch (error) {
        console.error("Lỗi đánh dấu thông báo:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}
