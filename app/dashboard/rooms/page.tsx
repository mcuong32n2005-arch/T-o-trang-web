"use client";

import React, { useEffect, useState } from "react";

interface Homestay {
  id: string;
  name: string;
}

interface Room {
  id: string;
  code: string;
  name: string;
  description?: string;
  floor?: number;
  sqm?: number;
  bedroomCount?: number;
  bedCount?: number;
  bathroomCount?: number;
  status: string;
  price: number;
  property?: string; // id homestay cha
  images?: string[];
}

const STATUS_OPTIONS = [
  { value: "available", label: "Trống" },
  { value: "booked", label: "Đã đặt" },
  { value: "occupied", label: "Đang ở" },
  { value: "cleaning", label: "Đang vệ sinh" },
  { value: "maintenance", label: "Bảo trì" },
];

function statusLabel(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  floor: "1",
  sqm: "",
  bedroomCount: "1",
  bedCount: "1",
  bathroomCount: "1",
  status: "available",
  price: "",
  property: "",
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsRes, homestaysRes] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/homestays"),
      ]);
      const roomsData = await roomsRes.json();
      const homestaysData = await homestaysRes.json();
      setRooms(roomsData.data || []);
      setHomestays(homestaysData.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu phòng:", error);
      alert("Không tải được danh sách phòng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const homestayName = (id?: string) => homestays.find((h) => h.id === id)?.name || "—";

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (r: Room) => {
    setEditingId(r.id);
    setForm({
      code: r.code,
      name: r.name,
      description: r.description || "",
      floor: String(r.floor || 1),
      sqm: String(r.sqm || ""),
      bedroomCount: String(r.bedroomCount || 1),
      bedCount: String(r.bedCount || 1),
      bathroomCount: String(r.bathroomCount || 1),
      status: r.status || "available",
      price: String(r.price || ""),
      property: r.property || "",
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
    if (!form.code || !form.name || !form.price) {
      alert("Vui lòng nhập đầy đủ Mã phòng, Tên phòng và Giá phòng!");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/rooms/${editingId}` : "/api/rooms";
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
      await loadData();
    } catch (error) {
      console.error("Lỗi lưu phòng:", error);
      alert("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room: Room) => {
    const confirmed = window.confirm(`Xác nhận xoá phòng "${room.name}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không xoá được phòng này.");
        return;
      }
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
    } catch (error) {
      console.error("Lỗi xoá phòng:", error);
      alert("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quản lý phòng</h1>
          <p className="text-xs text-gray-500">Danh sách phòng thuộc các homestay.</p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          ➕ Thêm phòng
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Đang tải danh sách phòng...</div>
        ) : rooms.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Chưa có phòng nào. Bấm &quot;Thêm phòng&quot; để bắt đầu.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3">Mã</th>
                <th className="text-left px-5 py-3">Tên phòng</th>
                <th className="text-left px-5 py-3">Homestay</th>
                <th className="text-left px-5 py-3">Giá / đêm</th>
                <th className="text-left px-5 py-3">Trạng thái</th>
                <th className="text-right px-5 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition">
                  <td className="px-5 py-3 font-mono text-gray-600">{r.code}</td>
                  <td className="px-5 py-3 font-bold text-gray-800">{r.name}</td>
                  <td className="px-5 py-3 text-gray-600">{homestayName(r.property)}</td>
                  <td className="px-5 py-3 text-gray-600">{Number(r.price).toLocaleString("vi-VN")}đ</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-sm bg-teal-50 text-teal-700">
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button onClick={() => openEditForm(r)} className="text-xs font-bold text-teal-700 hover:underline">
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(r)} className="text-xs font-bold text-red-600 hover:underline">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 p-6 my-8">
            <h3 className="font-bold text-teal-700 text-sm mb-4">
              {editingId ? "✏️ SỬA THÔNG TIN PHÒNG" : "⚙️ THÊM PHÒNG MỚI"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Mã phòng *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Tên phòng *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Thuộc Homestay</label>
                <select
                  value={form.property}
                  onChange={(e) => setForm({ ...form, property: e.target.value })}
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500 bg-white"
                >
                  <option value="">— Chọn homestay —</option>
                  {homestays.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Tầng</label>
                  <input
                    type="number"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Diện tích (m²)</label>
                  <input
                    type="number"
                    value={form.sqm}
                    onChange={(e) => setForm({ ...form, sqm: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Giá / đêm *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Số phòng ngủ</label>
                  <input
                    type="number"
                    value={form.bedroomCount}
                    onChange={(e) => setForm({ ...form, bedroomCount: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Số giường</label>
                  <input
                    type="number"
                    value={form.bedCount}
                    onChange={(e) => setForm({ ...form, bedCount: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Số WC</label>
                  <input
                    type="number"
                    value={form.bathroomCount}
                    onChange={(e) => setForm({ ...form, bathroomCount: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Trạng thái</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500 bg-white"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
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
                  className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-lg transition shadow-xs uppercase tracking-wider"
                >
                  {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm phòng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
