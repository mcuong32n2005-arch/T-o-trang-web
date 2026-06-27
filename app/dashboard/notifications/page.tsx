"use client";

import React, { useEffect, useState } from "react";

interface NotificationItem {
  id: string;
  type: "new_booking" | "cancel_booking" | "payment" | "new_review";
  message: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  new_booking: "🆕",
  cancel_booking: "❌",
  payment: "💰",
  new_review: "⭐",
};

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setItems(data.data || []);
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PUT" });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Thông báo hệ thống</h1>
          <p className="text-xs text-gray-500">Booking mới, hủy đơn, thanh toán, đánh giá mới.</p>
        </div>
        <button onClick={markAllRead} className="text-xs font-bold text-teal-700 hover:underline">
          Đánh dấu tất cả đã đọc
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Chưa có thông báo nào.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((n) => (
              <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.isRead ? "bg-teal-50/40" : ""}`}>
                <span className="text-lg">{TYPE_ICON[n.type] || "🔔"}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{n.message}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(n.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
