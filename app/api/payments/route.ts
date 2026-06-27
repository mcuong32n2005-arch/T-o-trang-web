import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

// GET: lấy danh sách giao dịch thanh toán
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const db = await getDb();
    const payments = await db.collection("payments").find().sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      data: payments.map((p) => ({ ...p, id: p._id.toString(), _id: undefined })),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách thanh toán:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// POST: ghi nhận 1 giao dịch thanh toán cho 1 booking
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.bookingId || !body.guestName || body.totalAmount === undefined) {
      return NextResponse.json({ message: "Vui lòng nhập đầy đủ thông tin thanh toán." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("payments").insertOne({
      bookingId: body.bookingId,
      guestName: body.guestName,
      roomAmount: Number(body.roomAmount) || 0,
      serviceAmount: Number(body.serviceAmount) || 0,
      tax: Number(body.tax) || 0,
      discount: Number(body.discount) || 0,
      totalAmount: Number(body.totalAmount),
      status: body.status || "unpaid",
      method: body.method || "",
      createdAt: new Date(),
    });

    await logAction({ actorId: admin.userId, action: "Đã ghi nhận thanh toán", target: body.guestName });

    return NextResponse.json(
      { message: "Đã ghi nhận giao dịch thanh toán.", id: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi tạo thanh toán:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
