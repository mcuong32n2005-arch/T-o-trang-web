import { redirect } from "next/navigation";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

async function getStats() {
  const db = await getDb();

  const totalRooms = await db.collection("rooms").countDocuments();
  const availableRooms = await db.collection("rooms").countDocuments({
    status: { $in: ["available", "AVAILABLE", "Sẵn sàng"] },
  });
  const totalCustomers = await db.collection("customers").countDocuments();

  return { totalRooms, availableRooms, totalCustomers };
}

export default async function DashboardOverviewPage() {
  // Middleware đã chặn /dashboard ở tầng route nếu không phải admin,
  // kiểm tra lại ở đây để có lớp bảo vệ thứ hai (defense in depth).
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/sign-in");
  }

  const { totalRooms, availableRooms, totalCustomers } = await getStats();

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng số phòng</p>
            <p className="text-2xl font-black text-gray-800 mt-2">{totalRooms} phòng</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phòng đang trống</p>
            <p className="text-2xl font-black text-teal-700 mt-2">{availableRooms} phòng</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng khách hàng</p>
            <p className="text-2xl font-black text-emerald-600 mt-2">{totalCustomers} khách</p>
          </div>
        </div>
      </div>
  );
}
