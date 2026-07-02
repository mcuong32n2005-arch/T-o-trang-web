import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { normalizeRoomStatus, ROOM_STATUS } from "@/lib/roomStatus";

// GET: lấy danh sách phòng — để công khai vì trang chủ (khách xem phòng) cũng cần gọi API này
export async function GET() {
  try {
    const db = await getDb();
    const rooms = await db.collection("rooms").find().sort({ createdAt: -1 }).toArray();

    const data = rooms.map((r) => ({
      ...r,
      id: r._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Lỗi lấy danh sách phòng:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// POST: tạo phòng mới — chỉ admin đã đăng nhập được phép
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

    if (!body.code || !body.name || !body.price) {
      return NextResponse.json(
          { message: "Vui lòng nhập đầy đủ Mã phòng, Số phòng và Giá phòng." },
          { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("rooms").insertOne({
      code: body.code,
      name: body.name,
      description: body.description || "",
      floor: Number(body.floor) || 1,
      sqm: Number(body.sqm) || 0,
      bedroomCount: Number(body.bedroomCount) || 1,
      bedCount: Number(body.bedCount) || 1,
      bathroomCount: Number(body.bathroomCount) || 1,
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      // Chuẩn hoá về "available" | "occupied" | giữ nguyên nếu là trạng thái tuỳ
      // chỉnh khác (vd "Bảo trì") — để mọi nơi đọc room.status (badge "Hết phòng"
      // ở trang khách hàng, logic đồng bộ theo booking) đều hiểu cùng 1 kiểu giá
      // trị, bất kể form nhập bằng nhãn tiếng Việt gì ("Trống", "Còn phòng"...).
      status: normalizeRoomStatus(body.status) || ROOM_STATUS.AVAILABLE,
      price: Number(body.price),
      roomType: body.roomType || { id: "type-" + Date.now(), name: "standard" },
      property: body.property,
      address: body.address,
      images: Array.isArray(body.images) ? body.images : [],
      createdAt: new Date(),
    });

    return NextResponse.json(
        { message: "Đã tạo phòng mới.", id: result.insertedId.toString() },
        { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi tạo phòng:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
