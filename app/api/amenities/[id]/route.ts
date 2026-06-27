import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã tiện ích không hợp lệ." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const result = await db.collection("amenities").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy tiện ích để xoá." }, { status: 404 });
    }

    await logAction({ actorId: admin.userId, action: "Đã xoá tiện ích", target: id });

    return NextResponse.json({ message: "Đã xoá tiện ích." });
  } catch (error) {
    console.error("Lỗi xoá tiện ích:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
