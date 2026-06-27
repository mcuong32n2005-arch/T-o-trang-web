import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

// GET: chi tiết 1 homestay — công khai vì trang chi tiết homestay (khách xem) cũng cần
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã homestay không hợp lệ." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const homestay = await db.collection("homestays").findOne({ _id: new ObjectId(id) });
    if (!homestay) {
      return NextResponse.json({ message: "Không tìm thấy homestay này." }, { status: 404 });
    }

    // Lấy kèm danh sách phòng thuộc homestay này
    const rooms = await db.collection("rooms").find({ property: id }).toArray();

    return NextResponse.json({
      data: {
        ...homestay,
        id: homestay._id.toString(),
        _id: undefined,
        rooms: rooms.map((r) => ({ ...r, id: r._id.toString(), _id: undefined })),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết homestay:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// PUT: cập nhật homestay (bao gồm ẩn/hiện qua field isHidden)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã homestay không hợp lệ." }, { status: 400 });
  }

  try {
    const body = await request.json();
    delete body._id;
    delete body.id;
    delete body.rooms;

    const db = await getDb();
    const result = await db.collection("homestays").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...body, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy homestay này." }, { status: 404 });
    }

    await logAction({
      actorId: admin.userId,
      action: "Đã cập nhật Homestay",
      target: id,
    });

    return NextResponse.json({ message: "Đã cập nhật homestay." });
  } catch (error) {
    console.error("Lỗi cập nhật homestay:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// DELETE: xoá homestay — chặn nếu vẫn còn phòng thuộc homestay này
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Mã homestay không hợp lệ." }, { status: 400 });
  }

  try {
    const db = await getDb();

    const roomCount = await db.collection("rooms").countDocuments({ property: id });
    if (roomCount > 0) {
      return NextResponse.json(
        { message: `Không thể xoá: homestay này còn ${roomCount} phòng. Hãy xoá hoặc chuyển phòng trước.` },
        { status: 400 }
      );
    }

    const result = await db.collection("homestays").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Không tìm thấy homestay để xoá." }, { status: 404 });
    }

    await logAction({
      actorId: admin.userId,
      action: "Đã xoá Homestay",
      target: id,
    });

    return NextResponse.json({ message: "Đã xoá homestay." });
  } catch (error) {
    console.error("Lỗi xoá homestay:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
