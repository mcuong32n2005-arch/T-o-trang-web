import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

// GET: lấy danh sách coupon
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const db = await getDb();
    const coupons = await db.collection("coupons").find().sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      data: coupons.map((c) => ({ ...c, id: c._id.toString(), _id: undefined })),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách coupon:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// POST: tạo mã giảm giá mới
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.code || !body.value || !body.expiresAt) {
      return NextResponse.json({ message: "Vui lòng nhập đầy đủ Mã, Giá trị giảm và Ngày hết hạn." }, { status: 400 });
    }

    const db = await getDb();

    const existing = await db.collection("coupons").findOne({ code: body.code.toUpperCase() });
    if (existing) {
      return NextResponse.json({ message: "Mã giảm giá này đã tồn tại." }, { status: 400 });
    }

    const result = await db.collection("coupons").insertOne({
      code: body.code.toUpperCase(),
      type: body.type === "fixed" ? "fixed" : "percent",
      value: Number(body.value),
      expiresAt: new Date(body.expiresAt),
      usageLimit: Number(body.usageLimit) || 0,
      usedCount: 0,
      isActive: true,
      createdAt: new Date(),
    });

    await logAction({ actorId: admin.userId, action: "Đã tạo mã giảm giá", target: body.code });

    return NextResponse.json({ message: "Đã tạo mã giảm giá.", id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error("Lỗi tạo coupon:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
