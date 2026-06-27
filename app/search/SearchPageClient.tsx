"use client";

import React, { Suspense, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isFavorite, toggleFavorite } from "../account/_lib/favorites";

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

// ─── Nút tim yêu thích — dùng chung cho mọi card phòng trong trang này.
// Đọc/ghi qua API /api/favorites (lưu theo userId trong MongoDB — mỗi tài
// khoản có danh sách riêng), tự đổi màu/biểu tượng theo trạng thái đã/chưa
// yêu thích, và chặn click lan ra card (không mở trang chi tiết phòng khi
// bấm tim). ───────────────────────────────────────────────────────────────
function FavoriteButton({ room }: { room: HomestayRoom }) {
  const [favorited, setFavorited] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    isFavorite(room.id).then((result) => {
      if (active) setFavorited(result);
    });
    return () => {
      active = false;
    };
  }, [room.id]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      const nowFavorited = await toggleFavorite({
        id: room.id,
        code: room.code,
        name: room.name,
        price: room.price,
        image: room.images?.[0],
        address: room.address?.fullAddress,
      });
      setFavorited(nowFavorited);
    } finally {
      setPending(false);
    }
  };

  return (
      <button
          onClick={handleClick}
          disabled={pending}
          className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition disabled:opacity-60"
          title={favorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      >
        <svg
            className={`w-4 h-4 transition ${favorited ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
            fill={favorited ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
  );
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

// Khớp từ khóa với: tên phòng, mã phòng, tên cơ sở, địa chỉ đầy đủ, loại phòng
function matchKeyword(room: HomestayRoom, keyword: string) {
  const s = keyword.toLowerCase().trim();
  if (!s) return true;
  return (
      room.name?.toLowerCase().includes(s) ||
      room.code?.toLowerCase().includes(s) ||
      room.property?.name?.toLowerCase().includes(s) ||
      room.address?.fullAddress?.toLowerCase().includes(s) ||
      room.roomType?.name?.toLowerCase().includes(s)
  );
}

function SearchResults({ initialRooms }: { initialRooms: HomestayRoom[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = parseInt(searchParams.get("guests") || "0", 10);

  const [rooms] = useState<HomestayRoom[]>(initialRooms);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Từ khóa: tên/mã phòng, cơ sở, địa chỉ, loại phòng
      if (!matchKeyword(room, q)) return false;

      // Số khách tối đa mỗi phòng đáp ứng được
      if (guests > 0) {
        const maxGuests = room.bedroomCount ? room.bedroomCount + 2 : 3;
        if (maxGuests < guests) return false;
      }

      return true;
    });
  }, [rooms, q, guests]);

  const displayDate = (val: string) => {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const hasFilters = q || checkIn || checkOut || guests > 0;

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

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Tiêu đề + tóm tắt tiêu chí tìm kiếm */}
          <h1 className="text-xl font-bold text-gray-900 mb-2">Kết quả tìm kiếm</h1>

          {hasFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {q && (
                    <span className="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">
                Từ khóa: <span className="font-semibold text-gray-800">{q}</span>
              </span>
                )}
                {checkIn && (
                    <span className="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">
                Nhận phòng: <span className="font-semibold text-gray-800">{displayDate(checkIn)}</span>
              </span>
                )}
                {checkOut && (
                    <span className="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">
                Trả phòng: <span className="font-semibold text-gray-800">{displayDate(checkOut)}</span>
              </span>
                )}
                {guests > 0 && (
                    <span className="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">
                Số khách: <span className="font-semibold text-gray-800">{guests}</span>
              </span>
                )}
              </div>
          )}

          <p className="text-sm text-gray-500 mb-6">
            Tìm thấy <span className="font-semibold text-gray-700">{filteredRooms.length}</span> phòng phù hợp
          </p>

          {/* Lưới kết quả */}
          {filteredRooms.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl bg-white">
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-gray-500 text-sm">Không tìm thấy phòng nào phù hợp với tiêu chí của bạn.</p>
                <Link
                    href="/rooms"
                    className="inline-block mt-3 text-xs bg-green-50 text-green-700 font-bold px-4 py-2 rounded-lg hover:bg-green-100 transition"
                >
                  Xem tất cả phòng
                </Link>
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
                          <FavoriteButton room={room} />
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
        </div>
      </div>
  );
}

// useSearchParams cần được bọc trong Suspense theo yêu cầu của Next.js App Router
export default function SearchPageClient({ initialRooms }: { initialRooms: HomestayRoom[] }) {
  return (
      <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
        <SearchResults initialRooms={initialRooms} />
      </Suspense>
  );
}
