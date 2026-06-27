import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

// GET: lấy danh sách thông báo nội bộ cho admin (mới nhất trước)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const db = await getDb();
    const notifications = await db
      .collection("notifications")
      .find()
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      data: notifications.map((n) => ({ ...n, id: n._id.toString(), _id: undefined })),
    });
  } catch (error) {
    console.error("Lỗi lấy thông báo:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// PUT: đánh dấu tất cả thông báo đã đọc
export async function PUT() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const db = await getDb();
    await db.collection("notifications").updateMany({ isRead: false }, { $set: { isRead: true } });
    return NextResponse.json({ message: "Đã đánh dấu tất cả là đã đọc." });
  } catch (error) {
    console.error("Lỗi cập nhật thông báo:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
