import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

const ALLOWED_STATUS = ["unpaid", "deposited", "paid", "refunded"];

// PUT: đổi trạng thái thanh toán
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã giao dịch không hợp lệ." }, { status: 400 });
  }

  try {
    const body = await request.json();
    if (!ALLOWED_STATUS.includes(body.status)) {
      return NextResponse.json({ message: "Trạng thái thanh toán không hợp lệ." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db
      .collection("payments")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status: body.status, updatedAt: new Date() } });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy giao dịch này." }, { status: 404 });
    }

    await logAction({ actorId: admin.userId, action: `Đã đổi trạng thái thanh toán thành ${body.status}`, target: id });

    return NextResponse.json({ message: "Đã cập nhật trạng thái thanh toán." });
  } catch (error) {
    console.error("Lỗi cập nhật thanh toán:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
