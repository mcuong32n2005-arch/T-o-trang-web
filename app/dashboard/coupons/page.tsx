"use client";

import React, { useEffect, useState } from "react";

interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  expiresAt: string;
  usageLimit?: number;
  usedCount?: number;
  isActive: boolean;
}

const EMPTY_FORM = { code: "", type: "percent", value: "", expiresAt: "", usageLimit: "" };

function isExpired(dateStr: string) {
  return new Date(dateStr).getTime() < Date.now();
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons");
      const data = await res.json();
      setCoupons(data.data || []);
    } catch (error) {
      console.error("Lỗi tải mã giảm giá:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.value || !form.expiresAt) {
      alert("Vui lòng nhập đầy đủ Mã, Giá trị giảm và Ngày hết hạn!");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Có lỗi xảy ra.");
        return;
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      await loadCoupons();
    } catch (error) {
      console.error("Lỗi tạo coupon:", error);
      alert("Không thể kết nối tới máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không thể đổi trạng thái.");
        return;
      }
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: !c.isActive } : x)));
    } catch (error) {
      console.error("Lỗi đổi trạng thái coupon:", error);
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!window.confirm(`Xoá mã "${c.code}"?`)) return;
    try {
      const res = await fetch(`/api/coupons/${c.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không xoá được mã này.");
        return;
      }
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
    } catch (error) {
      console.error("Lỗi xoá coupon:", error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quản lý mã giảm giá</h1>
          <p className="text-xs text-gray-500">Tạo và quản lý các mã coupon cho khách hàng.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          ➕ Tạo mã mới
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Đang tải...</div>
        ) : coupons.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Chưa có mã giảm giá nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3">Mã</th>
                <th className="text-left px-5 py-3">Giảm giá</th>
                <th className="text-left px-5 py-3">Hết hạn</th>
                <th className="text-left px-5 py-3">Đã dùng</th>
                <th className="text-left px-5 py-3">Trạng thái</th>
                <th className="text-right px-5 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => {
                const expired = isExpired(c.expiresAt);
                return (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-5 py-3 font-mono font-bold text-gray-800">{c.code}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {c.type === "percent" ? `${c.value}%` : `${c.value.toLocaleString("vi-VN")}đ`}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{new Date(c.expiresAt).toLocaleDateString("vi-VN")}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {c.usedCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ""}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-sm ${
                          expired
                            ? "bg-gray-100 text-gray-500"
                            : c.isActive
                            ? "bg-teal-50 text-teal-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {expired ? "Đã hết hạn" : c.isActive ? "Đang dùng" : "Đã tắt"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(c)}
                        disabled={expired}
                        className="text-xs font-bold text-sky-600 hover:underline disabled:opacity-40"
                      >
                        {c.isActive ? "Tắt" : "Bật"}
                      </button>
                      <button onClick={() => handleDelete(c)} className="text-xs font-bold text-red-600 hover:underline">
                        Xoá
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-teal-700 text-sm mb-4">⚙️ TẠO MÃ GIẢM GIÁ MỚI</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Mã coupon *</label>
                <input
                  type="text"
                  placeholder="VD: SUMMER2026"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Loại giảm giá</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500 bg-white"
                  >
                    <option value="percent">Theo % (VD: 10%)</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Giá trị *</label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Ngày hết hạn *</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Giới hạn lượt dùng</label>
                  <input
                    type="number"
                    placeholder="0 = không giới hạn"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 font-bold text-xs py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-lg transition"
                >
                  {saving ? "Đang tạo..." : "Tạo mã"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
