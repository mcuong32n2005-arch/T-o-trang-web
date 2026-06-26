"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── KIỂU DỮ LIỆU ────────────────────────────────────────────────────────────
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

// ─── LOẠI PHÒNG — chỉ 3 loại theo đúng dữ liệu thực tế ──────────────────────
// Thứ tự hiển thị trong sidebar: Standard → Deluxe → Deluxe Extra
const ROOM_TYPE_FILTERS = [
  { key: "standard", label: "Standard" },
  { key: "deluxe", label: "Deluxe" },
  { key: "deluxe extra", label: "Deluxe Extra" },
];

function matchRoomType(roomTypeName: string | undefined, filterKey: string) {
  const name = (roomTypeName || "").toLowerCase();
  if (filterKey === "deluxe extra") return name.includes("deluxe extra") || name.includes("deluxe-extra");
  if (filterKey === "deluxe") return name.includes("deluxe") && !name.includes("extra");
  if (filterKey === "standard") return name.includes("standard");
  return false;
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80",
];

function getFallbackImage(roomTypeName: string | undefined, idx: number) {
  const type = (roomTypeName || "").toLowerCase();
  if (type.includes("deluxe extra")) return FALLBACK_IMAGES[0];
  if (type.includes("deluxe")) return FALLBACK_IMAGES[1];
  return FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
}

type SortOption = "random" | "price-asc" | "price-desc" | "newest";

export default function RoomsPageClient({
  initialRooms,
}: {
  initialRooms: HomestayRoom[];
}) {
  const router = useRouter();
  const [rooms] = useState<HomestayRoom[]>(initialRooms);

  // ─── Bộ lọc ───
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("random");

  const toggleType = (key: string) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const clearTypes = () => setSelectedTypes([]);

  const filteredRooms = useMemo(() => {
    let list = rooms.filter((room) => {
      if (selectedTypes.length === 0) return true;
      return selectedTypes.some((key) => matchRoomType(room.roomType?.name, key));
    });

    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    }
    // "random" và "newest" giữ thứ tự gốc (đã sort theo createdAt từ server)

    return list;
  }, [rooms, selectedTypes, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      {/* ═══════════════════════════════════════════
          HEADER đơn giản
      ═══════════════════════════════════════════ */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-6">
          <Link href="/" className="text-2xl font-black text-green-600 shrink-0 tracking-tight">
            Bảo An
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-green-700 transition flex items-center gap-1 ml-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Trang chủ
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-6">
        {/* ═══════════════════════════════════════════
            SIDEBAR — BỘ LỌC
        ═══════════════════════════════════════════ */}
        <aside className="w-full md:w-72 shrink-0 space-y-4">
          {/* Header bộ lọc */}
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 text-sm font-semibold text-green-600 border border-green-500 rounded-full px-4 py-2 hover:bg-green-50 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 8h12M9 12h6M11 16h2" />
              </svg>
              Thêm bộ lọc
            </button>
            {selectedTypes.length > 0 && (
              <button
                onClick={clearTypes}
                className="text-sm text-red-500 font-medium hover:underline"
              >
                Xoá toàn bộ
              </button>
            )}
          </div>

          {/* Khối: Loại căn hộ */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Loại căn hộ</h3>
              {selectedTypes.length > 0 && (
                <button
                  onClick={clearTypes}
                  className="text-xs text-green-600 font-semibold hover:underline"
                >
                  Xoá
                </button>
              )}
            </div>
            <div className="space-y-3">
              {ROOM_TYPE_FILTERS.map((type) => (
                <label
                  key={type.key}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.key)}
                    onChange={() => toggleType(type.key)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Khối: Danh mục (placeholder cho mở rộng sau) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Danh mục</h3>
              <button className="text-xs text-green-600 font-semibold hover:underline">Xoá</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Hỗ trợ dịch vụ</span>
                <button
                  disabled
                  className="w-9 h-5 rounded-full bg-gray-200 relative cursor-not-allowed"
                  title="Sắp ra mắt"
                >
                  <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Ưu đãi đêm</span>
                <button
                  disabled
                  className="w-9 h-5 rounded-full bg-gray-200 relative cursor-not-allowed"
                  title="Sắp ra mắt"
                >
                  <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>
            </div>
          </div>

          {/* Khối: Tiện ích (placeholder cho mở rộng sau) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Tiện ích</h3>
              <button className="text-xs text-green-600 font-semibold hover:underline">Xoá</button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" disabled className="w-4 h-4 rounded border-gray-300 cursor-not-allowed" />
                <span className="text-sm text-gray-400">Bồn tắm</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" disabled className="w-4 h-4 rounded border-gray-300 cursor-not-allowed" />
                <span className="text-sm text-gray-400">Máy chiếu</span>
              </label>
            </div>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════
            DANH SÁCH PHÒNG
        ═══════════════════════════════════════════ */}
        <section className="flex-1 bg-white border border-gray-200 rounded-2xl p-6">
          {/* Tiêu đề + sắp xếp */}
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold text-gray-900">Danh sách phòng</h1>
          </div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              Tìm thấy <span className="font-semibold text-gray-700">{filteredRooms.length}</span> phòng
            </p>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm border border-gray-200 rounded-lg pl-3 pr-8 py-2 appearance-none bg-white focus:outline-none focus:border-green-500 cursor-pointer"
              >
                <option value="random">Ngẫu nhiên</option>
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến cao</option>
                <option value="price-desc">Giá: Cao đến thấp</option>
              </select>
              <svg
                className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Lưới phòng */}
          {filteredRooms.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-gray-500 text-sm">Không tìm thấy phòng nào phù hợp.</p>
              <button
                onClick={clearTypes}
                className="mt-3 text-xs bg-green-50 text-green-700 font-bold px-4 py-2 rounded-lg hover:bg-green-100 transition"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRooms.map((room, idx) => {
                const isAvailable =
                  room.status === "available" ||
                  room.status === "AVAILABLE" ||
                  room.status === "Sẵn sàng";

                return (
                  <div
                    key={room.id}
                    onClick={() => router.push(`/rooms/${room.id}`)}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition cursor-pointer group"
                  >
                    {/* Hình ảnh */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={room.images?.[0] || getFallbackImage(room.roomType?.name, idx)}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {room.code || `R${1000 + idx}`}
                        </span>
                        {!isAvailable && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            Đã đặt
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition"
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Nội dung card */}
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-green-700 transition">
                        {room.name || `Phòng ${room.code}`}
                      </h3>

                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="text-[11px] text-gray-500">(0 đánh giá)</span>
                      </div>

                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-1 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {room.address?.fullAddress || "Thái Nguyên, Việt Nam"}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                          {room.roomType?.name || "Studio"}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          1 - {room.bedroomCount ? room.bedroomCount + 2 : 3} khách
                        </span>
                        <span className="ml-auto text-gray-400">0 đã đặt</span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-sm font-semibold text-gray-700">
                          <span>{Math.round(room.price * 0.45).toLocaleString("vi-VN")}đ/ 3 giờ</span>
                          <span>{room.price.toLocaleString("vi-VN")}đ/ đêm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
