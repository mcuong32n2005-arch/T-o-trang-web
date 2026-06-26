"use client";

import React, { useEffect, useState } from "react";

interface HomestayRoom {
  id: string;
  code: string;
  name: string;
  description: string;
  floor: number;
  sqm: number;
  bedroomCount?: number;
  bedCount?: number;
  bathroomCount?: number;
  amenities: string[];
  status: string;
  price: number;
  roomType: { id: string; name: string };
  property: { id: string; name: string; type: string };
  address: { id: string; alias: string; fullAddress: string };
  images?: string[];
}

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  floor: "1",
  sqm: "30",
  price: "",
  status: "available",
  roomTypeName: "standard",
  propertyName: "Bảo An - Cơ sở 5",
  fullAddress: "Nguyễn Công Hoan, Phan Đình Phùng, TP. Thái Nguyên",
  amenitiesInput: "",
  images: [] as string[],
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<HomestayRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      setRooms(data.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách phòng:", error);
      alert("Không tải được danh sách phòng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (room: HomestayRoom) => {
    setEditingId(room.id);
    setForm({
      code: room.code,
      name: room.name,
      description: room.description || "",
      floor: String(room.floor ?? 1),
      sqm: String(room.sqm ?? 0),
      price: String(room.price ?? ""),
      status: room.status || "available",
      roomTypeName: room.roomType?.name || "standard",
      propertyName: room.property?.name || "Bảo An - Cơ sở 5",
      fullAddress: room.address?.fullAddress || "",
      amenitiesInput: (room.amenities || []).join(", "),
      images: room.images || [],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  // Tải lên 1 hoặc nhiều ảnh, mỗi ảnh gọi /api/upload riêng rồi gom URL trả về vào form.images
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || `Không tải lên được ảnh "${file.name}".`);
          continue;
        }
        uploadedUrls.push(data.url);
      }
      if (uploadedUrls.length > 0) {
        setForm((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      }
    } catch (error) {
      console.error("Lỗi tải ảnh lên:", error);
      alert("Không thể kết nối tới máy chủ khi tải ảnh.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (url: string) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img !== url) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.price) {
      alert("Vui lòng nhập đầy đủ Mã phòng, Số phòng và Giá phòng!");
      return;
    }

    setSaving(true);

    const payload = {
      code: form.code,
      name: form.name,
      description: form.description,
      floor: Number(form.floor),
      sqm: Number(form.sqm),
      price: Number(form.price),
      status: form.status,
      roomType: { id: "type-" + Date.now(), name: form.roomTypeName },
      property: {
        id: form.propertyName === "Bảo An - Cơ sở 5" ? "69c76fcf594e1f055aad1880" : "69c76fcf594e1f055aad1811",
        name: form.propertyName,
        type: "homestay",
      },
      address: {
        id: "addr-" + Date.now(),
        alias: form.propertyName.toLowerCase(),
        fullAddress: form.fullAddress,
      },
      amenities: form.amenitiesInput
          ? form.amenitiesInput.split(",").map((a) => a.trim()).filter(Boolean)
          : [],
      images: form.images,
    };

    try {
      const url = editingId ? `/api/rooms/${editingId}` : "/api/rooms";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Có lỗi xảy ra, vui lòng thử lại.");
        return;
      }

      closeForm();
      await loadRooms();
    } catch (error) {
      console.error("Lỗi lưu phòng:", error);
      alert("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room: HomestayRoom) => {
    const confirmed = window.confirm(`Xác nhận xoá phòng "${room.name}" (Mã: ${room.code})?`);
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
            <p className="text-xs text-gray-500">Thêm, sửa, xoá phòng — dữ liệu đồng bộ trực tiếp với MongoDB và hiển thị luôn trên trang chủ.</p>
          </div>
          <button
              onClick={openAddForm}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            ➕ Thêm phòng mới
          </button>
        </header>

        {/* BẢNG DANH SÁCH PHÒNG */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {loading ? (
              <div className="p-10 text-center text-sm text-gray-400">Đang tải danh sách phòng...</div>
          ) : rooms.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">Chưa có phòng nào. Bấm "Thêm phòng mới" để bắt đầu.</div>
          ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Ảnh</th>
                  <th className="text-left px-5 py-3">Mã / Số phòng</th>
                  <th className="text-left px-5 py-3">Cơ sở</th>
                  <th className="text-left px-5 py-3">Loại phòng</th>
                  <th className="text-left px-5 py-3">Giá / đêm</th>
                  <th className="text-left px-5 py-3">Trạng thái</th>
                  <th className="text-right px-5 py-3">Hành động</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {rooms.map((room) => {
                  const isAvailable =
                      room.status === "available" || room.status === "AVAILABLE" || room.status === "Sẵn sàng";
                  return (
                      <tr key={room.id} className="hover:bg-gray-50/60 transition">
                        <td className="px-5 py-3">
                          {room.images && room.images.length > 0 ? (
                              <img
                                  src={room.images[0]}
                                  alt={room.name}
                                  className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                              />
                          ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300 text-[10px]">
                                Chưa có
                              </div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-bold text-gray-800">{room.name}</div>
                          <div className="text-xs text-gray-400 font-mono">{room.code}</div>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{room.property?.name}</td>
                        <td className="px-5 py-3 text-gray-600 capitalize">{room.roomType?.name}</td>
                        <td className="px-5 py-3 font-bold text-teal-700">
                          {room.price ? room.price.toLocaleString("vi-VN") : "0"}đ
                        </td>
                        <td className="px-5 py-3">
                      <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-sm ${
                              isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}
                      >
                        ● {isAvailable ? "Đang trống" : "Đã đặt"}
                      </span>
                        </td>
                        <td className="px-5 py-3 text-right space-x-2">
                          <button
                              onClick={() => openEditForm(room)}
                              className="text-xs font-bold text-teal-700 hover:underline"
                          >
                            Sửa
                          </button>
                          <button
                              onClick={() => handleDelete(room)}
                              className="text-xs font-bold text-red-600 hover:underline"
                          >
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

        {/* MODAL FORM THÊM / SỬA PHÒNG */}
        {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-teal-700 text-sm mb-4 flex items-center gap-2">
                  {editingId ? "✏️ SỬA THÔNG TIN PHÒNG" : "⚙️ THÊM PHÒNG MỚI"}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Mã định danh (Code) *</label>
                      <input
                          type="text"
                          placeholder="Ví dụ: 207-cs5"
                          value={form.code}
                          onChange={(e) => setForm({ ...form, code: e.target.value })}
                          className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Số phòng (Name) *</label>
                      <input
                          type="text"
                          placeholder="Ví dụ: 207"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Giá thuê (VNĐ) *</label>
                      <input
                          type="number"
                          placeholder="Ví dụ: 600000"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Cơ sở *</label>
                      <select
                          value={form.propertyName}
                          onChange={(e) => {
                            const addr =
                                e.target.value === "Bảo An - Cơ sở 5"
                                    ? "Nguyễn Công Hoan, Phan Đình Phùng, TP. Thái Nguyên"
                                    : "125a Bắc Sơn, Phan Đình Phùng, TP. Thái Nguyên";
                            setForm({ ...form, propertyName: e.target.value, fullAddress: addr });
                          }}
                          className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500 bg-white"
                      >
                        <option value="Bảo An - Cơ sở 5">Bảo An - Cơ sở 5</option>
                        <option value="Bảo An - Cơ sở 1">Bảo An - Cơ sở 1</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Loại phòng</label>
                      <select
                          value={form.roomTypeName}
                          onChange={(e) => setForm({ ...form, roomTypeName: e.target.value })}
                          className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500 bg-white"
                      >
                        <option value="standard">Standard (Tiêu chuẩn)</option>
                        <option value="deluxe">Deluxe (Hạng sang)</option>
                        <option value="deluxe extra">Deluxe Extra (Đặc biệt)</option>
                      </select>
                    </div>
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
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Trạng thái</label>
                      <select
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                          className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500 bg-white"
                      >
                        <option value="available">Đang trống</option>
                        <option value="booked">Đã đặt</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Mô tả phòng</label>
                    <textarea
                        rows={2}
                        placeholder="Nhập mô tả tổng quan căn phòng..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                      Tiện ích (mỗi tiện ích phân tách bằng dấu phẩy)
                    </label>
                    <input
                        type="text"
                        placeholder="Máy lạnh, Tủ lạnh, Tivi 43 inch..."
                        value={form.amenitiesInput}
                        onChange={(e) => setForm({ ...form, amenitiesInput: e.target.value })}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                    />
                  </div>

                  {/* ẢNH PHÒNG */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Hình ảnh phòng</label>
                    <div className="flex flex-wrap gap-3 mb-2">
                      {form.images.map((url) => (
                          <div
                              key={url}
                              className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(url)}
                                className="absolute top-0.5 right-0.5 bg-black/60 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            >
                              ✕
                            </button>
                          </div>
                      ))}

                      <label
                          className={`w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center text-[10px] text-center px-1 cursor-pointer transition ${
                              uploadingImage
                                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                  : "border-gray-300 text-gray-400 hover:border-teal-500 hover:text-teal-600"
                          }`}
                      >
                        {uploadingImage ? "Đang tải..." : "+ Thêm ảnh"}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            disabled={uploadingImage}
                            onChange={(e) => handleImageUpload(e.target.files)}
                            className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-400">Hỗ trợ JPG, PNG, WEBP — tối đa 5MB mỗi ảnh.</p>
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
                        disabled={saving || uploadingImage}
                        className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-lg transition shadow-xs uppercase tracking-wider"
                    >
                      {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo phòng mới"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
}
