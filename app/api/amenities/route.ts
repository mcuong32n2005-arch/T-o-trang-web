import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

// GET: lấy danh sách tiện ích — công khai để form thêm homestay/phòng cũng dùng được
export async function GET() {
  try {
    const db = await getDb();
    const amenities = await db.collection("amenities").find().sort({ name: 1 }).toArray();

    return NextResponse.json({
      data: amenities.map((a) => ({ ...a, id: a._id.toString(), _id: undefined })),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách tiện ích:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// POST: thêm tiện ích mới
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ message: "Vui lòng nhập tên tiện ích." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("amenities").insertOne({
      name: body.name,
      icon: body.icon || "✅",
      createdAt: new Date(),
    });

    await logAction({ actorId: admin.userId, action: "Đã thêm tiện ích", target: body.name });

    return NextResponse.json({ message: "Đã thêm tiện ích.", id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error("Lỗi thêm tiện ích:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
