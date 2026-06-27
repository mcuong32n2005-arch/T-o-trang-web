"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

// ─── KHOẢNG GIÁ ───────────────────────────────────────────────────────────────
const PRICE_RANGES = [
  { key: "under-500k", label: "Dưới 500.000 đ", min: 0, max: 500_000 },
  { key: "500k-1m", label: "500.000 đ - 1.000.000 đ", min: 500_000, max: 1_000_000 },
  { key: "1m-2m", label: "1.000.000 đ - 2.000.000 đ", min: 1_000_000, max: 2_000_000 },
  { key: "2m-3m", label: "2.000.000 đ - 3.000.000 đ", min: 2_000_000, max: 3_000_000 },
  { key: "over-3m", label: "Trên 3.000.000 đ", min: 3_000_000, max: Infinity },
];

function matchPriceRange(price: number, rangeKey: string) {
  const range = PRICE_RANGES.find((r) => r.key === rangeKey);
  if (!range) return false;
  return price >= range.min && price < range.max;
}

// ─── TIỆN ÍCH — khớp đúng dữ liệu amenities thật trong DB ───────────────────
// "Tivi 43 inch" / "Tivi 43 inches" / "tv netflix" được gộp vào nhóm "Tivi"
const AMENITY_GROUPS: { title: string; items: { key: string; label: string; match: (a: string[]) => boolean }[] }[] = [
  {
    title: "Tiện ích phòng",
    items: [
      { key: "may-lanh", label: "Máy lạnh", match: (a) => a.includes("Máy lạnh") },
      { key: "tu-lanh", label: "Tủ lạnh", match: (a) => a.includes("Tủ lạnh") },
      { key: "nong-lanh", label: "Nóng lạnh", match: (a) => a.includes("Nóng lạnh") },
      {
        key: "tivi",
        label: "Tivi",
        match: (a) => a.some((x) => x.toLowerCase().includes("tivi") || x.toLowerCase().includes("tv")),
      },
      { key: "ban-lam-viec", label: "Bàn làm việc", match: (a) => a.includes("Bàn làm việc") },
      { key: "bep-nau", label: "Bếp nấu", match: (a) => a.includes("Bếp nấu") },
      { key: "phong-khach", label: "Phòng khách", match: (a) => a.includes("Phòng khách") },
      { key: "ban-cong", label: "Ban công", match: (a) => a.includes("Ban công") },
      { key: "bon-tam", label: "Bồn tắm", match: (a) => a.includes("Bồn tắm") },
    ],
  },
  {
    title: "View",
    items: [
      { key: "view-pho", label: "View phố", match: (a) => a.includes("View phố") },
    ],
  },
];

const ALL_AMENITY_ITEMS = AMENITY_GROUPS.flatMap((g) => g.items);

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

// ─── PILL — nút bo tròn dùng trong modal bộ lọc ─────────────────────────────
function FilterPill({
                      label,
                      active,
                      onClick,
                    }: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
      <button
          type="button"
          onClick={onClick}
          className={`px-4 py-2 rounded-full text-sm border transition whitespace-nowrap ${
              active
                  ? "border-green-600 text-green-700 bg-green-50 font-medium"
                  : "border-gray-300 text-gray-700 hover:border-gray-400"
          }`}
      >
        {label}
      </button>
  );
}

// ─── MODAL BỘ LỌC ─────────────────────────────────────────────────────────────
function FilterModal({
                       open,
                       onClose,
                       selectedPriceRanges,
                       togglePriceRange,
                       selectedAmenities,
                       toggleAmenity,
                       onClearAll,
                       onApply,
                     }: {
  open: boolean;
  onClose: () => void;
  selectedPriceRanges: string[];
  togglePriceRange: (key: string) => void;
  selectedAmenities: string[];
  toggleAmenity: (key: string) => void;
  onClearAll: () => void;
  onApply: () => void;
}) {
  if (!open) return null;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
            <h2 className="text-lg font-bold text-gray-900">Bộ lọc</h2>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Đóng"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nội dung cuộn được */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-6">
            {/* Khoảng giá */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Khoảng giá</h3>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((range) => (
                    <FilterPill
                        key={range.key}
                        label={range.label}
                        active={selectedPriceRanges.includes(range.key)}
                        onClick={() => togglePriceRange(range.key)}
                    />
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Tiện ích — theo nhóm */}
            {AMENITY_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">{group.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                        <FilterPill
                            key={item.key}
                            label={item.label}
                            active={selectedAmenities.includes(item.key)}
                            onClick={() => toggleAmenity(item.key)}
                        />
                    ))}
                  </div>
                </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
            <button
                onClick={onClearAll}
                className="text-sm text-red-500 font-medium hover:underline"
            >
              Xoá toàn bộ
            </button>
            <button
                onClick={onApply}
                className="bg-green-600 text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-green-700 transition"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>
  );
}

export default function RoomsPageClient({
                                          initialRooms,
                                        }: {
  initialRooms: HomestayRoom[];
}) {
  const router = useRouter();
  const [rooms] = useState<HomestayRoom[]>(initialRooms);

  // ─── Bộ lọc loại phòng (sidebar) ───
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("random");

  // ─── Bộ lọc modal: giá + tiện ích (đang chỉnh trong modal, chưa áp dụng) ───
  const [draftPriceRanges, setDraftPriceRanges] = useState<string[]>([]);
  const [draftAmenities, setDraftAmenities] = useState<string[]>([]);

  // ─── Bộ lọc đã áp dụng (dùng để filter danh sách phòng) ───
  const [appliedPriceRanges, setAppliedPriceRanges] = useState<string[]>([]);
  const [appliedAmenities, setAppliedAmenities] = useState<string[]>([]);

  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const toggleType = (key: string) => {
    setSelectedTypes((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const clearTypes = () => setSelectedTypes([]);

  const openFilterModal = () => {
    // mở modal với draft = giá trị đã áp dụng trước đó
    setDraftPriceRanges(appliedPriceRanges);
    setDraftAmenities(appliedAmenities);
    setFilterModalOpen(true);
  };

  const toggleDraftPriceRange = (key: string) => {
    setDraftPriceRanges((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleDraftAmenity = (key: string) => {
    setDraftAmenities((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const clearDraftFilters = () => {
    setDraftPriceRanges([]);
    setDraftAmenities([]);
  };

  const applyFilters = () => {
    setAppliedPriceRanges(draftPriceRanges);
    setAppliedAmenities(draftAmenities);
    setFilterModalOpen(false);
  };

  const clearAppliedFilters = () => {
    setAppliedPriceRanges([]);
    setAppliedAmenities([]);
  };

  const activeFilterCount = appliedPriceRanges.length + appliedAmenities.length;

  const filteredRooms = useMemo(() => {
    let list = rooms.filter((room) => {
      // Lọc theo loại phòng
      if (selectedTypes.length > 0) {
        const matchesType = selectedTypes.some((key) => matchRoomType(room.roomType?.name, key));
        if (!matchesType) return false;
      }

      // Lọc theo khoảng giá (OR giữa các khoảng đã chọn)
      if (appliedPriceRanges.length > 0) {
        const matchesPrice = appliedPriceRanges.some((key) => matchPriceRange(room.price, key));
        if (!matchesPrice) return false;
      }

      // Lọc theo tiện ích (AND — phòng phải có đủ tất cả tiện ích đã chọn)
      if (appliedAmenities.length > 0) {
        const roomAmenities = room.amenities || [];
        const matchesAllAmenities = appliedAmenities.every((key) => {
          const item = ALL_AMENITY_ITEMS.find((i) => i.key === key);
          return item ? item.match(roomAmenities) : false;
        });
        if (!matchesAllAmenities) return false;
      }

      return true;
    });

    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    }
    // "random" và "newest" giữ thứ tự gốc (đã sort theo createdAt từ server)

    return list;
  }, [rooms, selectedTypes, sortBy, appliedPriceRanges, appliedAmenities]);

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
              <button
                  onClick={openFilterModal}
                  className="flex items-center gap-2 text-sm font-semibold text-green-600 border border-green-500 rounded-full px-4 py-2 hover:bg-green-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 8h12M9 12h6M11 16h2" />
                </svg>
                Thêm bộ lọc
                {activeFilterCount > 0 && (
                    <span className="bg-green-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
                )}
              </button>
              {(selectedTypes.length > 0 || activeFilterCount > 0) && (
                  <button
                      onClick={() => {
                        clearTypes();
                        clearAppliedFilters();
                      }}
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

            {/* Khối: Khoảng giá đã chọn (rút gọn, đồng bộ với modal) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Khoảng giá</h3>
                {appliedPriceRanges.length > 0 && (
                    <button
                        onClick={() => setAppliedPriceRanges([])}
                        className="text-xs text-green-600 font-semibold hover:underline"
                    >
                      Xoá
                    </button>
                )}
              </div>
              <div className="space-y-3">
                {PRICE_RANGES.map((range) => (
                    <label key={range.key} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                          type="checkbox"
                          checked={appliedPriceRanges.includes(range.key)}
                          onChange={() =>
                              setAppliedPriceRanges((prev) =>
                                  prev.includes(range.key)
                                      ? prev.filter((k) => k !== range.key)
                                      : [...prev, range.key]
                              )
                          }
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">
                    {range.label}
                  </span>
                    </label>
                ))}
              </div>
            </div>

            {/* Khối: Tiện ích — đúng theo dữ liệu thật của phòng */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Tiện ích</h3>
                {appliedAmenities.length > 0 && (
                    <button
                        onClick={() => setAppliedAmenities([])}
                        className="text-xs text-green-600 font-semibold hover:underline"
                    >
                      Xoá
                    </button>
                )}
              </div>
              <div className="space-y-3">
                {ALL_AMENITY_ITEMS.map((item) => (
                    <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                          type="checkbox"
                          checked={appliedAmenities.includes(item.key)}
                          onChange={() =>
                              setAppliedAmenities((prev) =>
                                  prev.includes(item.key)
                                      ? prev.filter((k) => k !== item.key)
                                      : [...prev, item.key]
                              )
                          }
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">
                    {item.label}
                  </span>
                    </label>
                ))}
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
                      onClick={() => {
                        clearTypes();
                        clearAppliedFilters();
                      }}
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
          </section>
        </div>

        {/* ═══════════════════════════════════════════
          MODAL BỘ LỌC (giống 3 hình mẫu)
      ═══════════════════════════════════════════ */}
        <FilterModal
            open={filterModalOpen}
            onClose={() => setFilterModalOpen(false)}
            selectedPriceRanges={draftPriceRanges}
            togglePriceRange={toggleDraftPriceRange}
            selectedAmenities={draftAmenities}
            toggleAmenity={toggleDraftAmenity}
            onClearAll={clearDraftFilters}
            onApply={applyFilters}
        />
      </div>
  );
}
