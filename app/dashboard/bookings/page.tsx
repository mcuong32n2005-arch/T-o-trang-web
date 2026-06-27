"use client";

import React, { useEffect, useMemo, useState } from "react";

interface Booking {
  id: string;
  roomId: string;
  roomName?: string;
  roomCode?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  guestName: string;
  guestPhone: string;
  guestNote?: string;
  status: "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled";
  createdAt: string;
}

const STATUS_LABEL: Record<Booking["status"], { label: string; className: string }> = {
  pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Đã xác nhận", className: "bg-sky-50 text-sky-700" },
  "checked-in": { label: "Đang ở", className: "bg-emerald-50 text-emerald-700" },
  "checked-out": { label: "Đã trả phòng", className: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Đã huỷ", className: "bg-red-50 text-red-600" },
};

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "checked-in", label: "Đang ở" },
  { value: "checked-out", label: "Đã trả phòng" },
  { value: "cancelled", label: "Đã huỷ" },
];

function formatDateTime(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actingId, setActingId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");

  const loadBookings = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-bookings?status=${status}`);
      const data = await res.json();
      setBookings(data.data || []);
    } catch (error) {
      console.error("Lỗi tải booking:", error);
      alert("Không tải được danh sách booking.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const doAction = async (id: string, action: string) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không thể thực hiện hành động này.");
        return;
      }
      await loadBookings(filter);
    } catch (error) {
      console.error("Lỗi xử lý booking:", error);
      alert("Không thể kết nối tới máy chủ.");
    } finally {
      setActingId(null);
    }
  };

  // Nhóm booking theo ngày check-in để hiển thị dạng lịch đơn giản (tránh trùng lịch)
  const calendarGroups = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings
      .filter((b) => b.status !== "cancelled")
      .forEach((b) => {
        const key = new Date(b.checkIn).toLocaleDateString("vi-VN");
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(b);
      });
    return Array.from(map.entries()).sort(
      (a, b) => new Date(a[1][0].checkIn).getTime() - new Date(b[1][0].checkIn).getTime()
    );
  }, [bookings]);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quản lý Booking</h1>
          <p className="text-xs text-gray-500">Toàn bộ đơn đặt phòng trong hệ thống.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("list")}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
              view === "list" ? "bg-teal-700 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Danh sách
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
              view === "calendar" ? "bg-teal-700 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            📅 Lịch
          </button>
        </div>
      </header>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
              filter === f.value ? "bg-teal-700 text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Đang tải dữ liệu...</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">Không có booking nào phù hợp.</p>
      ) : view === "calendar" ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
          {calendarGroups.map(([date, items]) => (
            <div key={date} className="border-b border-gray-100 pb-3 last:border-0">
              <p className="text-xs font-bold text-teal-700 mb-2">📅 {date}</p>
              <div className="space-y-1.5">
                {items.map((b) => (
                  <div key={b.id} className="text-xs text-gray-600 flex justify-between">
                    <span>
                      {b.guestName} — {b.roomName || "Phòng"} ({b.roomCode || "—"})
                    </span>
                    <span className={`font-bold px-2 rounded ${STATUS_LABEL[b.status].className}`}>
                      {STATUS_LABEL[b.status].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const status = STATUS_LABEL[b.status] || STATUS_LABEL.pending;
            return (
              <div
                key={b.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
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
                  {b.guestNote && <p className="text-xs text-gray-400">Ghi chú: {b.guestNote}</p>}
                  <p className="text-sm font-semibold text-green-600 mt-1">
                    {b.totalPrice.toLocaleString("vi-VN")}đ
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {b.status === "pending" && (
                    <button
                      onClick={() => doAction(b.id, "confirm")}
                      disabled={actingId === b.id}
                      className="text-xs font-bold text-sky-700 border border-sky-200 hover:bg-sky-50 px-3 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      Xác nhận
                    </button>
                  )}
                  {b.status === "confirmed" && (
                    <button
                      onClick={() => doAction(b.id, "check-in")}
                      disabled={actingId === b.id}
                      className="text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-3 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      Check-in
                    </button>
                  )}
                  {b.status === "checked-in" && (
                    <button
                      onClick={() => doAction(b.id, "check-out")}
                      disabled={actingId === b.id}
                      className="text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      Check-out
                    </button>
                  )}
                  {(b.status === "pending" || b.status === "confirmed") && (
                    <button
                      onClick={() => doAction(b.id, "cancel")}
                      disabled={actingId === b.id}
                      className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      Huỷ
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
