import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/requireAdmin";

// GET: khách hàng lấy danh sách thông báo của CHÍNH MÌNH (recipientId = userId hiện tại).
// Không trả về thông báo nội bộ dùng chung của admin (recipientId rỗng/null).
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
    }

    const db = await getDb();
    const notifications = await db
        .collection("notifications")
        .find({ recipientId: session.userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .toArray();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json(
        {
          data: notifications.map((n) => ({ ...n, id: n._id.toString(), _id: undefined })),
          unreadCount,
        },
        {
          headers: {
            // Số lượng chưa đọc phụ thuộc vào từng người dùng — không cache theo URL.
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
    );
  } catch (error) {
    console.error("Lỗi lấy thông báo:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
