import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

// GET: lấy danh sách homestay — công khai vì trang chủ cũng cần hiển thị
export async function GET() {
  try {
    const db = await getDb();
    const homestays = await db.collection("homestays").find().sort({ createdAt: -1 }).toArray();

    const data = homestays.map((h) => ({
      ...h,
      id: h._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Lỗi lấy danh sách homestay:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// POST: tạo homestay mới — chỉ admin
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { message: "Bạn cần đăng nhập với quyền admin để thực hiện việc này." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    if (!body.name || !body.address) {
      return NextResponse.json(
        { message: "Vui lòng nhập đầy đủ Tên và Địa chỉ homestay." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("homestays").insertOne({
      name: body.name,
      description: body.description || "",
      address: body.address,
      area: Number(body.area) || 0,
      maxGuests: Number(body.maxGuests) || 1,
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      ownerName: body.ownerName || "",
      images: Array.isArray(body.images) ? body.images : [],
      videos: Array.isArray(body.videos) ? body.videos : [],
      model3dUrl: body.model3dUrl || "",
      isHidden: false,
      createdAt: new Date(),
    });

    await logAction({
      actorId: admin.userId,
      action: "Đã thêm Homestay",
      target: body.name,
    });

    return NextResponse.json(
      { message: "Đã tạo homestay mới.", id: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi tạo homestay:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
