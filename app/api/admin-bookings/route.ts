import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

// GET: admin lấy TẤT CẢ booking trong hệ thống (khác với /api/bookings dành cho khách
// chỉ trả về booking của chính họ). Hỗ trợ filter qua query string.
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { message: "Bạn cần đăng nhập với quyền admin để xem dữ liệu này." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const db = await getDb();
    const bookings = await db.collection("bookings").find(filter).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      data: bookings.map((b) => ({ ...b, id: b._id.toString(), _id: undefined })),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách booking (admin):", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
