"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SIDEBAR_ITEMS = [
    { icon: "user", label: "Thông tin tài khoản", href: "/account/profile" },
    { icon: "transaction", label: "Thông tin giao dịch", href: "/account/transactions" },
    { icon: "reward", label: "Điểm thưởng và ưu đãi", href: "/account/rewards" },
    { icon: "heart", label: "Phòng yêu thích", href: "/account/favorites" },
    { icon: "booking", label: "Quản lý đặt phòng", href: "/account/bookings" },
];

function SidebarIcon({ type }: { type: string }) {
    const common = "w-5 h-5";
    switch (type) {
        case "user":
            return (
                <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11a3 3 0 100-6 3 3 0 000 6zM6.168 18.849A4 4 0 0110 16h4a4 4 0 013.834 2.855" />
                </svg>
            );
        case "transaction":
            return (
                <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h5M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                </svg>
            );
        case "reward":
            return (
                <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8a4 4 0 118 0M5 8h14l-1 11a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8z" />
                </svg>
            );
        case "heart":
            return (
                <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                </svg>
            );
        case "booking":
            return (
                <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m-9 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        default:
            return null;
    }
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-white text-gray-900 antialiased">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <Link href="/booking" className="text-2xl font-black text-green-600 tracking-tight">Bảo An Homestay</Link>
                    <Link href="/booking" className="text-xs font-semibold text-gray-500 hover:text-green-600 transition flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                        Quay lại
                    </Link>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex gap-8">
                {/* Sidebar */}
                <aside className="w-64 shrink-0 hidden md:block">
                    <nav className="border border-gray-200 rounded-2xl overflow-hidden">
                        {SIDEBAR_ITEMS.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3.5 text-sm border-b border-gray-100 last:border-b-0 transition ${
                                        active
                                            ? "text-green-700 font-semibold bg-green-50"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    <SidebarIcon type={item.icon} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Nội dung trang con */}
                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    );
}
