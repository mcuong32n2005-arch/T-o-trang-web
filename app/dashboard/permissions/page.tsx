import React from "react";

const FEATURES = [
  { name: "Dashboard", admin: true, manager: true, staff: true },
  { name: "Quản lý phòng", admin: true, manager: true, staff: true },
  { name: "Quản lý Homestay", admin: true, manager: true, staff: false },
  { name: "Quản lý Booking", admin: true, manager: true, staff: true },
  { name: "Quản lý khách hàng", admin: true, manager: true, staff: true },
  { name: "Quản lý người dùng", admin: true, manager: false, staff: false },
  { name: "Quản lý thanh toán", admin: true, manager: true, staff: true },
  { name: "Quản lý dịch vụ", admin: true, manager: true, staff: false },
  { name: "Quản lý đánh giá", admin: true, manager: true, staff: false },
  { name: "Quản lý hình ảnh", admin: true, manager: true, staff: false },
  { name: "Quản lý tiện ích", admin: true, manager: true, staff: false },
  { name: "Mã giảm giá", admin: true, manager: true, staff: false },
  { name: "Báo cáo", admin: true, manager: true, staff: false },
  { name: "Thông báo", admin: true, manager: true, staff: true },
  { name: "Liên hệ", admin: true, manager: true, staff: true },
  { name: "Nhật ký hệ thống", admin: true, manager: false, staff: false },
  { name: "Cài đặt hệ thống", admin: true, manager: false, staff: false },
];

function Check({ value }: { value: boolean }) {
  return value ? (
    <span className="text-emerald-600 font-bold">✅</span>
  ) : (
    <span className="text-gray-300 font-bold">❌</span>
  );
}

export default function AdminPermissionsPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-gray-200 pb-5">
        <h1 className="text-xl font-bold text-gray-800">Phân quyền hệ thống</h1>
        <p className="text-xs text-gray-500">
          Ma trận quyền truy cập theo vai trò. Vai trò của từng người dùng được quản lý tại{" "}
          <a href="/dashboard/users" className="text-teal-700 font-bold hover:underline">
            Quản lý người dùng
          </a>
          .
        </p>
      </header>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">Chức năng</th>
              <th className="text-center px-5 py-3">Admin</th>
              <th className="text-center px-5 py-3">Manager</th>
              <th className="text-center px-5 py-3">Staff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {FEATURES.map((f) => (
              <tr key={f.name} className="hover:bg-gray-50/60 transition">
                <td className="px-5 py-3 font-medium text-gray-700">{f.name}</td>
                <td className="px-5 py-3 text-center">
                  <Check value={f.admin} />
                </td>
                <td className="px-5 py-3 text-center">
                  <Check value={f.manager} />
                </td>
                <td className="px-5 py-3 text-center">
                  <Check value={f.staff} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-400">
        Ghi chú: vai trò <strong>Customer</strong> không có quyền truy cập khu vực quản trị này.
      </p>
    </div>
  );
}
