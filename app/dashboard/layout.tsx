"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "",
    items: [{ href: "/dashboard", label: "📊 Tổng quan" }],
  },
  {
    title: "Vận hành",
    items: [
      { href: "/dashboard/homestays", label: "🏘️ Homestay" },
      { href: "/dashboard/rooms", label: "🏠 Phòng" },
      { href: "/dashboard/bookings", label: "📅 Booking" },
      { href: "/dashboard/customers", label: "👥 Khách hàng" },
    ],
  },
  {
    title: "Kinh doanh",
    items: [
      { href: "/dashboard/payments", label: "💳 Thanh toán" },
      { href: "/dashboard/services", label: "🧰 Dịch vụ" },
      { href: "/dashboard/coupons", label: "🏷️ Mã giảm giá" },
      { href: "/dashboard/reports", label: "📈 Báo cáo" },
    ],
  },
  {
    title: "Nội dung",
    items: [
      { href: "/dashboard/reviews", label: "⭐ Đánh giá" },
      { href: "/dashboard/media", label: "🖼️ Hình ảnh" },
      { href: "/dashboard/amenities", label: "🧩 Tiện ích" },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { href: "/dashboard/users", label: "🔐 Người dùng" },
      { href: "/dashboard/permissions", label: "🛡️ Phân quyền" },
      { href: "/dashboard/notifications", label: "🔔 Thông báo" },
      { href: "/dashboard/contacts", label: "✉️ Liên hệ" },
      { href: "/dashboard/logs", label: "🗒️ Nhật ký" },
      { href: "/dashboard/settings", label: "⚙️ Cài đặt" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  const sidebarContent = (
    <>
      <div className="text-lg font-black tracking-wider uppercase border-b border-teal-700 pb-4">
        BẢO AN HOMESTAY
      </div>
      <nav className="space-y-5 flex-1 overflow-y-auto pr-1">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.title && (
              <p className="text-[10px] font-bold text-teal-300/70 uppercase tracking-widest px-4 pt-2">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                    isActive ? "bg-teal-900 text-white" : "hover:bg-teal-700/50 text-gray-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <Button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-xl transition-all w-full"
      >
        Đăng xuất
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar quản trị — desktop */}
      <aside className="hidden lg:flex w-64 bg-teal-800 text-white p-6 space-y-6 flex-col sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Sidebar quản trị — mobile (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-teal-800 text-white p-6 space-y-6 flex flex-col overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* Topbar mobile */}
        <div className="lg:hidden bg-teal-800 text-white p-4 flex items-center justify-between sticky top-0 z-30">
          <span className="font-black uppercase tracking-wider text-sm">BẢO AN HOMESTAY</span>
          <button onClick={() => setMobileOpen(true)} className="text-xl">
            ☰
          </button>
        </div>

        <main className="flex-1 p-6 lg:p-10 space-y-6">{children}</main>
      </div>
    </div>
  );
}
