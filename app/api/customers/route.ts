import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

// GET: lấy danh sách khách hàng
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { message: "Bạn cần đăng nhập với quyền admin để xem dữ liệu này." },
      { status: 401 }
    );
  }

  try {
    const db = await getDb();
    const customers = await db.collection("customers").find().sort({ createdAt: -1 }).toArray();

    const data = customers.map((c) => ({
      ...c,
      id: c._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Lỗi lấy danh sách khách hàng:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// POST: thêm khách hàng mới
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

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { message: "Vui lòng nhập đầy đủ Họ tên và Số điện thoại khách hàng." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("customers").insertOne({
      name: body.name,
      phone: body.phone,
      email: body.email || "",
      address: body.address || "",
      status: body.status || "Khách mới",
      note: body.note || "",
      isLocked: false,
      createdAt: new Date(),
    });

    await logAction({ actorId: admin.userId, action: "Đã thêm khách hàng", target: body.name });

    return NextResponse.json(
      { message: "Đã thêm khách hàng.", id: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi thêm khách hàng:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
