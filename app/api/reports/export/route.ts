import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

function toCsvValue(v: unknown): string {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// GET: xuất danh sách booking trong khoảng thời gian ra file CSV (mở được trực tiếp bằng Excel)
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";

    const now = new Date();
    let rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === "week") {
      rangeStart = new Date(now);
      rangeStart.setDate(rangeStart.getDate() - 7);
    } else if (period === "year") {
      rangeStart = new Date(now.getFullYear(), 0, 1);
    } else if (period === "day") {
      rangeStart = new Date(now);
      rangeStart.setHours(0, 0, 0, 0);
    }

    const db = await getDb();
    const bookings = await db
      .collection("bookings")
      .find({ createdAt: { $gte: rangeStart } })
      .sort({ createdAt: -1 })
      .toArray();

    const headers = ["Mã booking", "Khách", "SĐT", "Phòng", "Check-in", "Check-out", "Số đêm", "Tổng tiền", "Trạng thái"];
    const rows = bookings.map((b) => [
      b._id.toString(),
      b.guestName,
      b.guestPhone,
      b.roomName || "",
      new Date(b.checkIn).toLocaleDateString("vi-VN"),
      new Date(b.checkOut).toLocaleDateString("vi-VN"),
      b.nights,
      b.totalPrice,
      b.status,
    ]);

    // Thêm BOM \uFEFF để Excel hiển thị đúng tiếng Việt có dấu
    const csv =
      "\uFEFF" +
      [headers, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bao-cao-${period}.csv"`,
      },
    });
  } catch (error) {
    console.error("Lỗi xuất báo cáo:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
