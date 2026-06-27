import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

// GET: lấy nhật ký hệ thống (chỉ admin, read-only — không có POST/PUT/DELETE
// vì log được ghi tự động bởi lib/adminLog.ts khi có thao tác)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const db = await getDb();
    const logs = await db.collection("logs").find().sort({ createdAt: -1 }).limit(200).toArray();

    return NextResponse.json({
      data: logs.map((l) => ({ ...l, id: l._id.toString(), _id: undefined })),
    });
  } catch (error) {
    console.error("Lỗi lấy nhật ký hệ thống:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
