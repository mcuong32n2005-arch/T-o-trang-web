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
    return NextResponse.json({ message: "Mã dịch vụ không hợp lệ." }, { status: 400 });
  }

  try {
    const body = await request.json();
    delete body._id;
    delete body.id;

    const db = await getDb();
    const result = await db
      .collection("services")
      .updateOne({ _id: new ObjectId(id) }, { $set: { ...body, updatedAt: new Date() } });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy dịch vụ này." }, { status: 404 });
    }

    await logAction({ actorId: admin.userId, action: "Đã cập nhật dịch vụ", target: id });

    return NextResponse.json({ message: "Đã cập nhật dịch vụ." });
  } catch (error) {
    console.error("Lỗi cập nhật dịch vụ:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã dịch vụ không hợp lệ." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const result = await db.collection("services").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy dịch vụ để xoá." }, { status: 404 });
    }

    await logAction({ actorId: admin.userId, action: "Đã xoá dịch vụ", target: id });

    return NextResponse.json({ message: "Đã xoá dịch vụ." });
  } catch (error) {
    console.error("Lỗi xoá dịch vụ:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
