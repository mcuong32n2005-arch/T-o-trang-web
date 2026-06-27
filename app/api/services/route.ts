import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

// GET: lấy danh sách dịch vụ — công khai vì khách cũng cần xem khi đặt thêm dịch vụ
export async function GET() {
  try {
    const db = await getDb();
    const services = await db.collection("services").find().sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      data: services.map((s) => ({ ...s, id: s._id.toString(), _id: undefined })),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách dịch vụ:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// POST: thêm dịch vụ mới
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.name || body.price === undefined) {
      return NextResponse.json({ message: "Vui lòng nhập đầy đủ Tên dịch vụ và Giá." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("services").insertOne({
      name: body.name,
      price: Number(body.price),
      unit: body.unit || "lần",
      description: body.description || "",
      isActive: true,
      createdAt: new Date(),
    });

    await logAction({ actorId: admin.userId, action: "Đã thêm dịch vụ", target: body.name });

    return NextResponse.json({ message: "Đã thêm dịch vụ.", id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error("Lỗi thêm dịch vụ:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
