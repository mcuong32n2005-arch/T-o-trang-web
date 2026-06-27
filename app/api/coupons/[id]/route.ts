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
    return NextResponse.json({ message: "Mã coupon không hợp lệ." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.isActive === "boolean") update.isActive = body.isActive;

    const db = await getDb();
    const result = await db.collection("coupons").updateOne({ _id: new ObjectId(id) }, { $set: update });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy mã giảm giá này." }, { status: 404 });
    }

    await logAction({ actorId: admin.userId, action: "Đã cập nhật mã giảm giá", target: id });

    return NextResponse.json({ message: "Đã cập nhật mã giảm giá." });
  } catch (error) {
    console.error("Lỗi cập nhật coupon:", error);
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
    return NextResponse.json({ message: "Mã coupon không hợp lệ." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const result = await db.collection("coupons").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy mã giảm giá để xoá." }, { status: 404 });
    }

    await logAction({ actorId: admin.userId, action: "Đã xoá mã giảm giá", target: id });

    return NextResponse.json({ message: "Đã xoá mã giảm giá." });
  } catch (error) {
    console.error("Lỗi xoá coupon:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
