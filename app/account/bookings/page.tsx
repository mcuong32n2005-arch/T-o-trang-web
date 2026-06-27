"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Booking {
    id: string;
    roomId: string;
    roomName?: string;
    roomCode?: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalPrice: number;
    pricePerNight: number;
    guestName: string;
    guestPhone: string;
    guestNote?: string;
    bookedBy: string;
    status: "pending" | "confirmed" | "cancelled";
    createdAt: string;
}

const STATUS_LABEL: Record<Booking["status"], { label: string; className: string }> = {
    pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700" },
    confirmed: { label: "Đã xác nhận", className: "bg-emerald-50 text-emerald-700" },
    cancelled: { label: "Đã huỷ", className: "bg-red-50 text-red-600" },
};

function formatDateTime(value: string) {
    if (!value) return "";
    const d = new Date(value);
    return d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const loadBookings = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/bookings");
            if (res.status === 401) {
                // Đổi từ /dashboard/bookings (cũ) sang /account/bookings vì khu vực
                // /dashboard giờ chỉ dành cho admin.
                window.location.href = "/login?redirect=/account/bookings";
                return;
            }
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Không thể tải danh sách đặt phòng.");
                return;
            }
            setBookings(data.data || []);
        } catch (err) {
            console.error("Lỗi tải bookings:", err);
            setError("Lỗi hệ thống, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const handleCancel = async (id: string) => {
        if (!window.confirm("Bạn chắc chắn muốn huỷ đơn đặt phòng này?")) return;
        setCancellingId(id);
        try {
            const res = await fetch(`/api/bookings/${id}`, { method: "PUT" });
            const data = await res.json();
            if (!res.ok) {
                alert(data.message || "Không thể huỷ đơn đặt phòng.");
                return;
            }
            setBookings((prev) =>
                prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
            );
        } catch (err) {
            console.error("Lỗi huỷ booking:", err);
            alert("Lỗi hệ thống, vui lòng thử lại.");
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900">Đơn đặt phòng của tôi</h1>

            {loading && (
                <p className="text-sm text-gray-400">Đang tải danh sách đặt phòng...</p>
            )}

            {!loading && error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
            )}

            {!loading && !error && bookings.length === 0 && (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                    <p className="text-sm text-gray-400 mb-3">Bạn chưa có đơn đặt phòng nào.</p>
                    <Link href="/" className="text-sm font-semibold text-green-600 hover:underline">
                        Tìm phòng ngay →
                    </Link>
                </div>
            )}

            {!loading && !error && bookings.length > 0 && (
                <div className="space-y-4">
                    {bookings.map((b) => {
                        const status = STATUS_LABEL[b.status] || STATUS_LABEL.pending;
                        const canCancel = b.status === "pending";
                        return (
                            <div key={b.id} className="border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-sm text-gray-900">
                                            {b.roomName || "Phòng"} {b.roomCode ? `(${b.roomCode})` : ""}
                                        </h3>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${status.className}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Nhận: {formatDateTime(b.checkIn)} — Trả: {formatDateTime(b.checkOut)} ({b.nights} đêm)
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Khách: {b.guestName} · {b.guestPhone}
                                    </p>
                                    {b.guestNote && (
                                        <p className="text-xs text-gray-400">Ghi chú: {b.guestNote}</p>
                                    )}
                                    <p className="text-sm font-semibold text-green-600 mt-1">
                                        {b.totalPrice.toLocaleString("vi-VN")}đ
                                    </p>
                                </div>

                                {canCancel && (
                                    <button
                                        onClick={() => handleCancel(b.id)}
                                        disabled={cancellingId === b.id}
                                        className="shrink-0 text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-50 px-4 py-2 rounded-lg transition"
                                    >
                                        {cancellingId === b.id ? "Đang huỷ..." : "Huỷ đơn"}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
