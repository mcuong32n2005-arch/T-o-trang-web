import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

function getRangeStart(period: string): Date {
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === "year") {
    return new Date(now.getFullYear(), 0, 1);
  }
  // "day" mặc định: từ đầu ngày hôm nay
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET: báo cáo tổng hợp theo period=day|week|month|year
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    const rangeStart = getRangeStart(period);

    const db = await getDb();

    const [bookings, totalRooms, customersReturning] = await Promise.all([
      db.collection("bookings").find({ createdAt: { $gte: rangeStart } }).toArray(),
      db.collection("rooms").countDocuments(),
      db.collection("customers").countDocuments({ status: "Đã từng ở" }),
    ]);

    const confirmedBookings = bookings.filter((b) => b.status !== "cancelled");
    const revenue = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Phòng được đặt nhiều nhất
    const roomCount = new Map<string, { name: string; count: number }>();
    confirmedBookings.forEach((b) => {
      const key = b.roomId || b.roomName || "unknown";
      const entry = roomCount.get(key) || { name: b.roomName || "Không rõ", count: 0 };
      entry.count += 1;
      roomCount.set(key, entry);
    });
    const topRooms = Array.from(roomCount.values()).sort((a, b) => b.count - a.count).slice(0, 5);

    // Công suất phòng (số booking / tổng phòng) — chỉ số tham khảo, không phải tỷ lệ ngày-phòng chính xác
    const occupancyRate = totalRooms > 0 ? Math.round((confirmedBookings.length / totalRooms) * 100) : 0;

    return NextResponse.json({
      data: {
        period,
        revenue,
        totalBookings: bookings.length,
        confirmedBookings: confirmedBookings.length,
        cancelledBookings: bookings.length - confirmedBookings.length,
        occupancyRate,
        topRooms,
        customersReturning,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy báo cáo:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
