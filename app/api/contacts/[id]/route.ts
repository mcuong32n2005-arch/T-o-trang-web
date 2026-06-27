import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã liên hệ không hợp lệ." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.reply === "string") update.reply = body.reply;
    if (typeof body.isResolved === "boolean") update.isResolved = body.isResolved;

    const db = await getDb();
    const result = await db.collection("contacts").updateOne({ _id: new ObjectId(id) }, { $set: update });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy liên hệ này." }, { status: 404 });
    }

    await logAction({ actorId: admin.userId, action: "Đã trả lời/cập nhật liên hệ", target: id });

    return NextResponse.json({ message: "Đã cập nhật." });
  } catch (error) {
    console.error("Lỗi cập nhật liên hệ:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
