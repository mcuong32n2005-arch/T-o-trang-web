import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

// GET: admin lấy danh sách liên hệ/góp ý/khiếu nại
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const db = await getDb();
    const messages = await db.collection("contacts").find().sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      data: messages.map((m) => ({ ...m, id: m._id.toString(), _id: undefined })),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách liên hệ:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// POST: khách gửi liên hệ / góp ý / khiếu nại — không cần đăng nhập
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.content) {
      return NextResponse.json({ message: "Vui lòng nhập đầy đủ Họ tên và Nội dung." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("contacts").insertOne({
      type: ["contact", "feedback", "complaint"].includes(body.type) ? body.type : "contact",
      name: body.name,
      email: body.email || "",
      phone: body.phone || "",
      content: body.content,
      reply: "",
      isResolved: false,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "Đã gửi liên hệ, chúng tôi sẽ phản hồi sớm nhất.", id: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi gửi liên hệ:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
