import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

// PUT: cập nhật thông tin khách hàng
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
        { message: "Bạn cần đăng nhập với quyền admin." },
        { status: 401 }
    );
  }

  const { id } = await params;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
        { message: "Mã khách hàng không hợp lệ." },
        { status: 400 }
    );
  }

  try {
    const body = await request.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
          { message: "Vui lòng nhập đầy đủ Họ tên và Số điện thoại." },
          { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("customers").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name: body.name,
            phone: body.phone,
            email: body.email || "",
            address: body.address || "",
            status: body.status || "Khách mới",
            note: body.note || "",
            updatedAt: new Date(),
          },
        }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
          { message: "Không tìm thấy khách hàng." },
          { status: 404 }
      );
    }

    return NextResponse.json({ message: "Đã cập nhật khách hàng." });
  } catch (error) {
    console.error("Lỗi cập nhật khách hàng:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// DELETE: xoá khách hàng
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
        { message: "Bạn cần đăng nhập với quyền admin." },
        { status: 401 }
    );
  }

  const { id } = await params;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
        { message: "Mã khách hàng không hợp lệ." },
        { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const result = await db
        .collection("customers")
        .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
          { message: "Không tìm thấy khách hàng để xoá." },
          { status: 404 }
      );
    }

    return NextResponse.json({ message: "Đã xoá khách hàng." });
  } catch (error) {
    console.error("Lỗi xoá khách hàng:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}