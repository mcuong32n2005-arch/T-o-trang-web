"use client";

import React, { useEffect, useState } from "react";

interface Homestay {
  id: string;
  name: string;
  description?: string;
  address: string;
  area?: number;
  maxGuests?: number;
  ownerName?: string;
  isHidden?: boolean;
  createdAt?: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  address: "",
  area: "",
  maxGuests: "",
  ownerName: "",
};

export default function AdminHomestaysPage() {
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadHomestays = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/homestays");
      const data = await res.json();
      setHomestays(data.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách homestay:", error);
      alert("Không tải được danh sách homestay. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomestays();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (h: Homestay) => {
    setEditingId(h.id);
    setForm({
      name: h.name,
      description: h.description || "",
      address: h.address,
      area: h.area ? String(h.area) : "",
      maxGuests: h.maxGuests ? String(h.maxGuests) : "",
      ownerName: h.ownerName || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address) {
      alert("Vui lòng nhập đầy đủ Tên và Địa chỉ!");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/homestays/${editingId}` : "/api/homestays";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Có lỗi xảy ra, vui lòng thử lại.");
        return;
      }

      closeForm();
      await loadHomestays();
    } catch (error) {
      console.error("Lỗi lưu homestay:", error);
      alert("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHidden = async (h: Homestay) => {
    try {
      const res = await fetch(`/api/homestays/${h.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: !h.isHidden }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không thể đổi trạng thái hiển thị.");
        return;
      }
      setHomestays((prev) => prev.map((x) => (x.id === h.id ? { ...x, isHidden: !h.isHidden } : x)));
    } catch (error) {
      console.error("Lỗi đổi trạng thái:", error);
      alert("Không thể kết nối tới máy chủ.");
    }
  };

  const handleDelete = async (h: Homestay) => {
    const confirmed = window.confirm(`Xác nhận xoá homestay "${h.name}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/homestays/${h.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không xoá được homestay này.");
        return;
      }
      setHomestays((prev) => prev.filter((x) => x.id !== h.id));
    } catch (error) {
      console.error("Lỗi xoá homestay:", error);
      alert("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quản lý Homestay</h1>
          <p className="text-xs text-gray-500">Danh sách homestay — mỗi homestay có thể chứa nhiều phòng.</p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          ➕ Thêm Homestay
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Đang tải danh sách homestay...</div>
        ) : homestays.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Chưa có homestay nào. Bấm &quot;Thêm Homestay&quot; để bắt đầu.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3">Tên</th>
                <th className="text-left px-5 py-3">Địa chỉ</th>
                <th className="text-left px-5 py-3">Chủ sở hữu</th>
                <th className="text-left px-5 py-3">Sức chứa</th>
                <th className="text-left px-5 py-3">Trạng thái</th>
                <th className="text-right px-5 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {homestays.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50/60 transition">
                  <td className="px-5 py-3 font-bold text-gray-800">{h.name}</td>
                  <td className="px-5 py-3 text-gray-600">{h.address}</td>
                  <td className="px-5 py-3 text-gray-600">{h.ownerName || "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{h.maxGuests ? `${h.maxGuests} khách` : "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-sm ${
                        h.isHidden ? "bg-gray-100 text-gray-500" : "bg-teal-50 text-teal-700"
                      }`}
                    >
                      {h.isHidden ? "Đang ẩn" : "Đang hiện"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleHidden(h)}
                      className="text-xs font-bold text-sky-600 hover:underline"
                    >
                      {h.isHidden ? "Hiện" : "Ẩn"}
                    </button>
                    <button onClick={() => openEditForm(h)} className="text-xs font-bold text-teal-700 hover:underline">
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(h)} className="text-xs font-bold text-red-600 hover:underline">
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-teal-700 text-sm mb-4">
              {editingId ? "✏️ SỬA HOMESTAY" : "⚙️ THÊM HOMESTAY MỚI"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Tên homestay *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Địa chỉ *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Diện tích (m²)</label>
                  <input
                    type="number"
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Số khách tối đa</label>
                  <input
                    type="number"
                    value={form.maxGuests}
                    onChange={(e) => setForm({ ...form, maxGuests: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Chủ sở hữu</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Mô tả</label>
                <textarea
                  rows={3}
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
                  className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-lg transition shadow-xs uppercase tracking-wider"
                >
                  {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm Homestay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
