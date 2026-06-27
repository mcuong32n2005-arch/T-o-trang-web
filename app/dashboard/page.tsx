import { redirect } from "next/navigation";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import RevenueChart from "./RevenueChart";
import BookingChart from "./BookingChart";

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

async function getStats() {
  const db = await getDb();
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const monthStart = startOfMonth(now);

  const [
    totalRooms,
    availableRooms,
    totalCustomers,
    totalBookings,
    todayBookings,
    checkInSoon,
    checkOutSoon,
    confirmedBookingsAll,
    monthBookingsConfirmed,
    last7DaysBookings,
  ] = await Promise.all([
    db.collection("rooms").countDocuments(),
    db.collection("rooms").countDocuments({
      status: { $in: ["available", "AVAILABLE", "Sẵn sàng", "Trống"] },
    }),
    db.collection("customers").countDocuments(),
    db.collection("bookings").countDocuments(),
    db.collection("bookings").countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    }),
    // Booking sắp check-in trong 24h tới, chưa bị hủy
    db
      .collection("bookings")
      .find({
        checkIn: { $gte: now, $lt: addDays(now, 1) },
        status: { $ne: "cancelled" },
      })
      .sort({ checkIn: 1 })
      .limit(5)
      .toArray(),
    // Booking sắp check-out trong 24h tới
    db
      .collection("bookings")
      .find({
        checkOut: { $gte: now, $lt: addDays(now, 1) },
        status: { $ne: "cancelled" },
      })
      .sort({ checkOut: 1 })
      .limit(5)
      .toArray(),
    db.collection("bookings").find({ status: { $ne: "cancelled" } }).toArray(),
    db
      .collection("bookings")
      .find({
        createdAt: { $gte: monthStart },
        status: { $ne: "cancelled" },
      })
      .toArray(),
    db
      .collection("bookings")
      .find({
        createdAt: { $gte: addDays(today, -6), $lt: tomorrow },
      })
      .toArray(),
  ]);

  const revenueToday = confirmedBookingsAll
    .filter((b) => {
      const c = new Date(b.createdAt);
      return c >= today && c < tomorrow;
    })
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const revenueMonth = monthBookingsConfirmed.reduce(
    (sum, b) => sum + (b.totalPrice || 0),
    0
  );

  const occupancyRate =
    totalRooms > 0 ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100) : 0;

  // Doanh thu 7 ngày gần nhất, gom theo ngày để vẽ biểu đồ
  const revenueByDay: { date: string; revenue: number; bookings: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = addDays(today, -i);
    const dayEnd = addDays(dayStart, 1);
    const dayBookings = last7DaysBookings.filter((b) => {
      const c = new Date(b.createdAt);
      return c >= dayStart && c < dayEnd;
    });
    revenueByDay.push({
      date: dayStart.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      revenue: dayBookings
        .filter((b) => b.status !== "cancelled")
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      bookings: dayBookings.length,
    });
  }

  return {
    totalRooms,
    availableRooms,
    occupiedRooms: totalRooms - availableRooms,
    totalCustomers,
    totalBookings,
    todayBookings,
    revenueToday,
    revenueMonth,
    occupancyRate,
    checkInSoon: checkInSoon.map((b) => ({
      id: b._id.toString(),
      guestName: b.guestName,
      roomName: b.roomName,
      checkIn: b.checkIn,
    })),
    checkOutSoon: checkOutSoon.map((b) => ({
      id: b._id.toString(),
      guestName: b.guestName,
      roomName: b.roomName,
      checkOut: b.checkOut,
    })),
    revenueByDay,
  };
}

export default async function DashboardOverviewPage() {
  // Middleware đã chặn /dashboard ở tầng route nếu không phải admin,
  // kiểm tra lại ở đây để có lớp bảo vệ thứ hai (defense in depth).
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/sign-in");
  }

  const stats = await getStats();

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Trang Quản Trị Hệ Thống</h1>
          <p className="text-xs text-gray-500">
            Chào mừng bạn đã đăng nhập thành công vào hệ thống chuỗi chỗ nghỉ tại Thái Nguyên.
          </p>
        </div>
      </header>

      {/* Hàng chỉ số chính */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard label="Tổng số phòng" value={`${stats.totalRooms} phòng`} color="text-gray-800" />
        <StatCard label="Phòng đang trống" value={`${stats.availableRooms} phòng`} color="text-teal-700" />
        <StatCard label="Phòng đang dùng" value={`${stats.occupiedRooms} phòng`} color="text-amber-600" />
        <StatCard label="Tổng khách hàng" value={`${stats.totalCustomers} khách`} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard label="Tổng booking" value={`${stats.totalBookings}`} color="text-gray-800" />
        <StatCard label="Booking hôm nay" value={`${stats.todayBookings}`} color="text-sky-600" />
        <StatCard
          label="Doanh thu hôm nay"
          value={`${stats.revenueToday.toLocaleString("vi-VN")}đ`}
          color="text-green-600"
        />
        <StatCard label="Tỷ lệ lấp đầy" value={`${stats.occupancyRate}%`} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Doanh thu tháng này</p>
          <p className="text-3xl font-black text-green-700 mt-2">
            {stats.revenueMonth.toLocaleString("vi-VN")}đ
          </p>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Biểu đồ doanh thu 7 ngày qua
          </p>
          <RevenueChart data={stats.revenueByDay} />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Biểu đồ booking 7 ngày qua
          </p>
          <BookingChart data={stats.revenueByDay} />
        </div>
      </div>

      {/* Cảnh báo check-in / check-out sắp tới */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AlertList
          title="⚠ Booking sắp check-in (24h tới)"
          empty="Không có booking nào sắp check-in."
          items={stats.checkInSoon.map(
            (b) => `${b.guestName} — ${b.roomName || "Phòng"} — ${new Date(b.checkIn).toLocaleString("vi-VN")}`
          )}
        />
        <AlertList
          title="⚠ Booking sắp check-out (24h tới)"
          empty="Không có booking nào sắp check-out."
          items={stats.checkOutSoon.map(
            (b) => `${b.guestName} — ${b.roomName || "Phòng"} — ${new Date(b.checkOut).toLocaleString("vi-VN")}`
          )}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black mt-2 ${color}`}>{value}</p>
    </div>
  );
}

function AlertList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-gray-700 border-b border-gray-50 pb-2 last:border-0">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
