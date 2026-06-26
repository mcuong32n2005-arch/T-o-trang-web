"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "📊 Tổng quan" },
  { href: "/dashboard/rooms", label: "🏠 Quản lý phòng" },
  { href: "/dashboard/customers", label: "👥 Khách hàng" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  // Đăng xuất bằng Clerk, sau đó quay về trang chủ
  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  return (
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar quản trị */}
        <aside className="w-64 bg-teal-800 text-white p-6 space-y-6 flex flex-col">
          <div className="text-lg font-black tracking-wider uppercase border-b border-teal-700 pb-4">
            BẢO AN HOMESTAY
          </div>
          <nav className="space-y-2 flex-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                  <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`block py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                          isActive ? "bg-teal-900 text-white" : "hover:bg-teal-700/50 text-gray-200"
                      }`}
                  >
                    {item.label}
                  </Link>
              );
            })}
          </nav>
          <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-xl transition-all w-full"
          >
            Đăng xuất
          </Button>
        </aside>

        {/* Nội dung chính bên phải, mỗi trang con tự render phần này */}
        <main className="flex-1 p-10 space-y-6">{children}</main>
      </div>
  );
}