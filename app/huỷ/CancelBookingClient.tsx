"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Booking {
    _id: string;
    roomName: string;
    roomCode: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalPrice: number;
    guestName: string;
    status: string;
    createdAt: string;
}

const USER_MENU_ITEMS = [
    { icon: "💳", label: "Thông tin giao dịch", href: "/booking/transactions" },
    { icon: "🎁", label: "Điểm thưởng và ưu đãi", href: "/booking/rewards" },
    { icon: "🤍", label: "Phòng yêu thích", href: "/booking/favorites" },
    { icon: "📋", label: "Quản lý đặt phòng", href: "/booking/my-bookings" },
    { icon: "💰", label: "Gói trả trước", href: "/booking/prepaid" },
];

export default function CancelBookingClient() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await fetch("/api/bookings");
            const data = await res.json();
            if (res.ok) {
                setBookings(data.data || []);
            } else {
                setAlert({ type: "error", message: data.message || "Không thể tải danh sách đặt phòng." });
            }
        } catch {
            setAlert({ type: "error", message: "Không kết nối được máy chủ." });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId: string) => {
        if (!confirm("Bạn có chắc chắn muốn huỷ đơn đặt phòng này?")) return;

        setCancelLoading(bookingId);
        try {
            const res = await fetch(`/api/bookings/${bookingId}`, {
                method: "PUT",
            });
            const data = await res.json();
            if (res.ok) {
                setAlert({ type: "success", message: data.message });
                setBookings((prev) =>
                    prev.map((b) =>
                        b._id === bookingId ? { ...b, status: "cancelled" } : b
                    )
                );
            } else {
                setAlert({ type: "error", message: data.message || "Huỷ thất bại." });
            }
        } catch {
            setAlert({ type: "error", message: "Không kết nối được máy chủ." });
        } finally {
            setCancelLoading(null);
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            {/* HEADER */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
                    <Link href="/" className="text-lg font-black text-teal-700 tracking-wider">
                        BẢO AN HOMESTAY
                    </Link>
                    <div className="flex items-center gap-2">
                        <button className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen((v) => !v)}
                                className={`flex items-center gap-2 border rounded-full pl-2 pr-3 py-1.5 transition ${menuOpen ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                            >
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <div className="w-7 h-7 bg-teal-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                                    </svg>
                                </div>
                            </button>
                            {menuOpen && (
                                <div className="absolute top-16 right-4 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                                    {USER_MENU_ITEMS.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                                        >
                                            <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-base">{item.icon}</span>
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    ))}
                                    <div className="border-t border-gray-100 mt-2 pt-2">
                                        <button
                                            onClick={() => { setMenuOpen(false); handleLogout(); }}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition w-full"
                                        >
                                            <span className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-base">🚪</span>
                                            <span className="font-medium">Đăng xuất</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ALERT */}
            {alert && (
                <div className={`p-4 mx-4 mt-4 rounded-lg text-center text-sm font-medium ${alert.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {alert.message}
                </div>
            )}

            {/* MAIN CONTENT */}
            <main className="max-w-7xl mx-auto py-8 px-4 md:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-gray-800">Quản lý đặt phòng</h1>
                    <p className="text-gray-500 text-sm mt-1">Xem và huỷ các đơn đặt phòng của bạn</p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-400">Đang tải...</div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        Bạn chưa có đơn đặt phòng nào.
                        <br />
                        <Link href="/booking" className="text-teal-600 font-medium hover:underline mt-2 inline-block">
                            Đặt phòng ngay
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((b) => (
                            <div
                                key={b._id}
                                className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-800">{b.roomName}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === "cancelled" ? "bg-gray-200 text-gray-600" : b.status === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                                            {b.status === "cancelled" ? "Đã huỷ" : b.status === "confirmed" ? "Đã xác nhận" : "Đang chờ"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-1">Mã phòng: {b.roomCode}</p>
                                    <p className="text-sm text-gray-600 mb-1">Khách: {b.guestName}</p>
                                    <div className="text-xs text-gray-500 space-x-3">
                                        <span>Nhận: {new Date(b.checkIn).toLocaleDateString("vi-VN")}</span>
                                        <span>Trả: {new Date(b.checkOut).toLocaleDateString("vi-VN")}</span>
                                        <span>{b.nights} đêm</span>
                                    </div>
                                    <p className="text-sm font-bold text-teal-600 mt-1">
                                        {b.totalPrice?.toLocaleString("vi-VN")}đ
                                    </p>
                                </div>
                                {b.status !== "cancelled" && b.status !== "confirmed" && (
                                    <button
                                        onClick={() => handleCancel(b._id)}
                                        disabled={cancelLoading === b._id}
                                        className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold text-xs px-4 py-2 rounded-lg transition shrink-0"
                                    >
                                        {cancelLoading === b._id ? "Đang huỷ..." : "Huỷ đơn"}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}