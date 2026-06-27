import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction, createNotification } from "@/lib/adminLog";

// GET: admin lấy tất cả review (kể cả chưa duyệt) để kiểm duyệt
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const db = await getDb();
    const reviews = await db.collection("reviews").find().sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      data: reviews.map((r) => ({ ...r, id: r._id.toString(), _id: undefined })),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách review:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// POST: khách gửi review mới (chưa duyệt, cần admin xét duyệt)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.customerName || !body.comment || !body.rating) {
      return NextResponse.json({ message: "Vui lòng nhập đầy đủ thông tin đánh giá." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("reviews").insertOne({
      roomId: body.roomId || "",
      homestayId: body.homestayId || "",
      customerName: body.customerName,
      rating: Math.min(5, Math.max(1, Number(body.rating))),
      comment: body.comment,
      reply: "",
      isApproved: false,
      isSpam: false,
      createdAt: new Date(),
    });

    await createNotification({
      type: "new_review",
      message: `${body.customerName} vừa gửi đánh giá mới.`,
      relatedId: result.insertedId.toString(),
    });

    return NextResponse.json(
      { message: "Đã gửi đánh giá, cảm ơn bạn! Đánh giá sẽ hiển thị sau khi được duyệt.", id: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi gửi đánh giá:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
