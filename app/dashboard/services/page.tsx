"use client";

import React, { useEffect, useState } from "react";

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit?: string;
  description?: string;
  isActive?: boolean;
}

const EMPTY_FORM = { name: "", price: "", unit: "lần", description: "" };

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      setServices(data.data || []);
    } catch (error) {
      console.error("Lỗi tải dịch vụ:", error);
      alert("Không tải được danh sách dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (s: ServiceItem) => {
    setEditingId(s.id);
    setForm({ name: s.name, price: String(s.price), unit: s.unit || "lần", description: s.description || "" });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert("Vui lòng nhập đầy đủ Tên dịch vụ và Giá!");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/services/${editingId}` : "/api/services";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Có lỗi xảy ra.");
        return;
      }
      closeForm();
      await loadServices();
    } catch (error) {
      console.error("Lỗi lưu dịch vụ:", error);
      alert("Không thể kết nối tới máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: ServiceItem) => {
    try {
      const res = await fetch(`/api/services/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không thể đổi trạng thái.");
        return;
      }
      setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, isActive: !s.isActive } : x)));
    } catch (error) {
      console.error("Lỗi đổi trạng thái dịch vụ:", error);
    }
  };

  const handleDelete = async (s: ServiceItem) => {
    if (!window.confirm(`Xác nhận xoá dịch vụ "${s.name}"?`)) return;
    try {
      const res = await fetch(`/api/services/${s.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không xoá được dịch vụ này.");
        return;
      }
      setServices((prev) => prev.filter((x) => x.id !== s.id));
    } catch (error) {
      console.error("Lỗi xoá dịch vụ:", error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quản lý dịch vụ</h1>
          <p className="text-xs text-gray-500">Các dịch vụ cộng thêm: BBQ, thuê xe, tour, giặt ủi...</p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          ➕ Thêm dịch vụ
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Đang tải...</div>
        ) : services.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Chưa có dịch vụ nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3">Tên dịch vụ</th>
                <th className="text-left px-5 py-3">Giá</th>
                <th className="text-left px-5 py-3">Đơn vị</th>
                <th className="text-left px-5 py-3">Trạng thái</th>
                <th className="text-right px-5 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/60 transition">
                  <td className="px-5 py-3 font-bold text-gray-800">{s.name}</td>
                  <td className="px-5 py-3 text-gray-600">{s.price.toLocaleString("vi-VN")}đ</td>
                  <td className="px-5 py-3 text-gray-600">{s.unit}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-sm ${
                        s.isActive ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.isActive ? "Đang bán" : "Đã ẩn"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => handleToggleActive(s)} className="text-xs font-bold text-sky-600 hover:underline">
                      {s.isActive ? "Ẩn" : "Hiện"}
                    </button>
                    <button onClick={() => openEditForm(s)} className="text-xs font-bold text-teal-700 hover:underline">
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(s)} className="text-xs font-bold text-red-600 hover:underline">
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-teal-700 text-sm mb-4">
              {editingId ? "✏️ SỬA DỊCH VỤ" : "⚙️ THÊM DỊCH VỤ MỚI"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Tên dịch vụ *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Giá *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Đơn vị</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 border border-gray-200 text-gray-600 font-bold text-xs py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-lg transition"
                >
                  {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm dịch vụ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
