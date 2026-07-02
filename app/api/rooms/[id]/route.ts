import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { normalizeRoomStatus } from "@/lib/roomStatus";

// GET: lấy thông tin chi tiết 1 phòng theo id — để công khai vì trang chi tiết phòng (khách xem) cũng cần gọi API này
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã phòng không hợp lệ." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const room = await db.collection("rooms").findOne({ _id: new ObjectId(id) });

    if (!room) {
      return NextResponse.json({ message: "Không tìm thấy phòng này." }, { status: 404 });
    }

    return NextResponse.json({
      data: { ...room, id: room._id.toString(), _id: undefined },
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin phòng:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// PUT: cập nhật thông tin phòng đã có
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
        { message: "Bạn cần đăng nhập với quyền admin để thực hiện việc này." },
        { status: 401 }
    );
  }

  // Next.js 15+: params là Promise, phải await trước khi dùng .id
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã phòng không hợp lệ." }, { status: 400 });
  }

  try {
    const body = await request.json();
    // Không cho phép sửa trực tiếp _id / id qua dữ liệu gửi lên
    delete body._id;
    delete body.id;

    // Nếu admin có đổi ô "Trạng thái" trong form sửa phòng, chuẩn hoá về
    // "available" | "occupied" (hoặc giữ nguyên nếu là trạng thái tuỳ chỉnh như
    // "Bảo trì") — để khớp với badge "Hết phòng" ở trang khách hàng và logic tự
    // đồng bộ theo booking (confirm/check-in/check-out) đã làm ở route booking.
    if (body.status !== undefined) {
      body.status = normalizeRoomStatus(body.status);
    }

    const db = await getDb();
    const result = await db.collection("rooms").updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...body, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy phòng này." }, { status: 404 });
    }

    return NextResponse.json({ message: "Đã cập nhật phòng." });
  } catch (error) {
    console.error("Lỗi cập nhật phòng:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// DELETE: xoá phòng
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
        { message: "Bạn cần đăng nhập với quyền admin để thực hiện việc này." },
        { status: 401 }
    );
  }

  // Next.js 15+: params là Promise, phải await trước khi dùng .id
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã phòng không hợp lệ." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const result = await db.collection("rooms").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy phòng này." }, { status: 404 });
    }

    return NextResponse.json({ message: "Đã xoá phòng." });
  } catch (error) {
    console.error("Lỗi xoá phòng:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
