"use client";

import React, { useEffect, useState } from "react";

interface Payment {
  id: string;
  bookingId: string;
  guestName: string;
  roomAmount: number;
  serviceAmount: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: "unpaid" | "deposited" | "paid" | "refunded";
  method?: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "unpaid", label: "Chưa thanh toán", className: "bg-gray-100 text-gray-600" },
  { value: "deposited", label: "Đã cọc", className: "bg-amber-50 text-amber-700" },
  { value: "paid", label: "Đã thanh toán", className: "bg-emerald-50 text-emerald-700" },
  { value: "refunded", label: "Hoàn tiền", className: "bg-red-50 text-red-600" },
];

function statusInfo(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments");
      const data = await res.json();
      setPayments(data.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách thanh toán:", error);
      alert("Không tải được danh sách thanh toán.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleStatusChange = async (payment: Payment, status: string) => {
    setBusyId(payment.id);
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không thể cập nhật trạng thái.");
        return;
      }
      setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, status: status as Payment["status"] } : p)));
    } catch (error) {
      console.error("Lỗi đổi trạng thái thanh toán:", error);
      alert("Không thể kết nối tới máy chủ.");
    } finally {
      setBusyId(null);
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      <header className="border-b border-gray-200 pb-5">
        <h1 className="text-xl font-bold text-gray-800">Quản lý thanh toán</h1>
        <p className="text-xs text-gray-500">Danh sách giao dịch thanh toán của khách hàng.</p>
      </header>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng tiền đã thanh toán</p>
        <p className="text-2xl font-black text-green-600 mt-2">{totalRevenue.toLocaleString("vi-VN")}đ</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Đang tải danh sách thanh toán...</div>
        ) : payments.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Chưa có giao dịch thanh toán nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3">Khách</th>
                <th className="text-left px-5 py-3">Tiền phòng</th>
                <th className="text-left px-5 py-3">Dịch vụ</th>
                <th className="text-left px-5 py-3">Thuế</th>
                <th className="text-left px-5 py-3">Giảm giá</th>
                <th className="text-left px-5 py-3">Tổng tiền</th>
                <th className="text-left px-5 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition">
                  <td className="px-5 py-3 font-bold text-gray-800">{p.guestName}</td>
                  <td className="px-5 py-3 text-gray-600">{p.roomAmount.toLocaleString("vi-VN")}đ</td>
                  <td className="px-5 py-3 text-gray-600">{p.serviceAmount.toLocaleString("vi-VN")}đ</td>
                  <td className="px-5 py-3 text-gray-600">{p.tax.toLocaleString("vi-VN")}đ</td>
                  <td className="px-5 py-3 text-gray-600">-{p.discount.toLocaleString("vi-VN")}đ</td>
                  <td className="px-5 py-3 font-bold text-gray-800">{p.totalAmount.toLocaleString("vi-VN")}đ</td>
                  <td className="px-5 py-3">
                    <select
                      value={p.status}
                      disabled={busyId === p.id}
                      onChange={(e) => handleStatusChange(p, e.target.value)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-sm border-0 ${statusInfo(p.status).className}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
