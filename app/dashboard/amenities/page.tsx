"use client";

import React, { useEffect, useState } from "react";

interface Amenity {
  id: string;
  name: string;
  icon?: string;
}

const SUGGESTED = [
  { name: "Wifi", icon: "📶" },
  { name: "Hồ bơi", icon: "🏊" },
  { name: "Điều hoà", icon: "❄️" },
  { name: "TV", icon: "📺" },
  { name: "Bếp", icon: "🍳" },
  { name: "Máy giặt", icon: "🧺" },
  { name: "Bãi đỗ xe", icon: "🚗" },
];

export default function AdminAmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✅");
  const [saving, setSaving] = useState(false);

  const loadAmenities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/amenities");
      const data = await res.json();
      setAmenities(data.data || []);
    } catch (error) {
      console.error("Lỗi tải tiện ích:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAmenities();
  }, []);

  const addAmenity = async (n: string, i: string) => {
    if (!n.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/amenities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, icon: i }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không thể thêm tiện ích.");
        return;
      }
      setName("");
      setIcon("✅");
      await loadAmenities();
    } catch (error) {
      console.error("Lỗi thêm tiện ích:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: Amenity) => {
    if (!window.confirm(`Xoá tiện ích "${a.name}"?`)) return;
    try {
      const res = await fetch(`/api/amenities/${a.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không xoá được tiện ích này.");
        return;
      }
      setAmenities((prev) => prev.filter((x) => x.id !== a.id));
    } catch (error) {
      console.error("Lỗi xoá tiện ích:", error);
    }
  };

  const existingNames = new Set(amenities.map((a) => a.name));

  return (
    <div className="space-y-6">
      <header className="border-b border-gray-200 pb-5">
        <h1 className="text-xl font-bold text-gray-800">Quản lý tiện ích</h1>
        <p className="text-xs text-gray-500">Danh sách tiện ích dùng để gắn cho homestay / phòng.</p>
      </header>

      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <p className="text-xs font-bold text-gray-500">Thêm nhanh tiện ích phổ biến</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.filter((s) => !existingNames.has(s.name)).map((s) => (
            <button
              key={s.name}
              onClick={() => addAmenity(s.name, s.icon)}
              disabled={saving}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-teal-50 hover:border-teal-200 transition disabled:opacity-50"
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="Icon (emoji)"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-20 text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
          />
          <input
            type="text"
            placeholder="Tên tiện ích mới..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
          />
          <button
            onClick={() => addAmenity(name, icon)}
            disabled={saving || !name.trim()}
            className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition"
          >
            Thêm
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Đang tải...</div>
        ) : amenities.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Chưa có tiện ích nào.</div>
        ) : (
          <div className="p-5 flex flex-wrap gap-2">
            {amenities.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
              >
                <span>{a.icon} {a.name}</span>
                <button onClick={() => handleDelete(a)} className="text-red-500 hover:text-red-700 font-bold">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
