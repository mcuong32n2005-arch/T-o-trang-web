import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

// PUT: duyệt / đánh dấu spam / trả lời review
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã đánh giá không hợp lệ." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.isApproved === "boolean") update.isApproved = body.isApproved;
    if (typeof body.isSpam === "boolean") update.isSpam = body.isSpam;
    if (typeof body.reply === "string") update.reply = body.reply;

    const db = await getDb();
    const result = await db.collection("reviews").updateOne({ _id: new ObjectId(id) }, { $set: update });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy đánh giá này." }, { status: 404 });
    }

    await logAction({ actorId: admin.userId, action: "Đã cập nhật đánh giá", target: id });

    return NextResponse.json({ message: "Đã cập nhật đánh giá." });
  } catch (error) {
    console.error("Lỗi cập nhật đánh giá:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// DELETE: xoá review xấu/spam
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã đánh giá không hợp lệ." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const result = await db.collection("reviews").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy đánh giá để xoá." }, { status: 404 });
    }

    await logAction({ actorId: admin.userId, action: "Đã xoá đánh giá", target: id });

    return NextResponse.json({ message: "Đã xoá đánh giá." });
  } catch (error) {
    console.error("Lỗi xoá đánh giá:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
