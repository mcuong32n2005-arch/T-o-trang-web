"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { getFavorites, toggleFavorite } from './account/_lib/favorites';
import { isRoomAvailable } from '@/lib/roomStatus';
import type { Roles } from '@/types/globals';

// ─── DATE PICKER COMPONENT ───────────────────────────────────────────────────
const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

function DatePickerPopup({
                           value,
                           onChange,
                           onClose,
                         }: {
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const initial = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selected, setSelected] = useState<Date | null>(value ? new Date(value) : null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    setSelected(d);
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(iso);
  };

  const isToday = (day: number) => {
    return today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
  };
  const isSelected = (day: number) => {
    return selected && selected.getDate() === day && selected.getMonth() === viewMonth && selected.getFullYear() === viewYear;
  };
  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
      <div
          ref={ref}
          className="absolute top-full mt-2 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-72"
      >
        {/* Header tháng */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span className="text-sm font-semibold text-gray-800">
          {MONTHS[viewMonth]} {viewYear}
        </span>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* Ngày trong tuần */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Các ngày */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const past = isPast(day);
            const sel = isSelected(day);
            const tod = isToday(day);
            return (
                <button
                    key={day}
                    onClick={() => !past && selectDay(day)}
                    disabled={past}
                    className={`
                w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm transition font-medium
                ${past ? "text-gray-300 cursor-not-allowed" : "hover:bg-green-50 cursor-pointer"}
                ${sel ? "bg-green-600 text-white hover:bg-green-600 font-bold" : ""}
                ${tod && !sel ? "border border-green-500 text-green-600" : ""}
                ${!sel && !tod && !past ? "text-gray-700" : ""}
              `}
                >
                  {day}
                </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <button
              onClick={() => { setSelected(null); onChange(""); }}
              className="text-xs text-green-600 font-semibold hover:underline"
          >
            Xóa
          </button>
          <button
              onClick={() => { selectDay(today.getDate()); setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}
              className="text-xs text-green-600 font-semibold hover:underline"
          >
            Hôm nay
          </button>
        </div>
      </div>
  );
}

function DateField({
                     label,
                     value,
                     onChange,
                   }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const display = value
      ? new Date(value + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "";

  return (
      <div className="relative h-full w-full">
        {/* Toàn bộ vùng là nút bấm */}
        <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="w-full h-full flex flex-col justify-center text-left focus:outline-none"
        >
          <span className="text-[10px] text-gray-400 leading-none mb-0.5 block">{label}</span>
          {display
              ? <span className="text-sm font-medium text-gray-800 leading-none">{display}</span>
              : <span className="text-sm text-gray-400 leading-none">Chọn thời gian</span>
          }
        </button>
        {open && (
            <DatePickerPopup
                value={value}
                onChange={(v) => { onChange(v); setOpen(false); }}
                onClose={() => setOpen(false)}
            />
        )}
      </div>
  );
}

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
// Trạng thái đã/chưa yêu thích được truyền từ component cha qua prop
// `favorited` (cha chỉ gọi API /api/favorites 1 LẦN DUY NHẤT cho toàn bộ
// danh sách, thay vì để mỗi nút tự fetch riêng — trước đây cách cũ gây ra
// hàng chục request /api/favorites chạy song song mỗi khi tải trang, làm
// trang chậm hẳn). Khi bấm, gọi `onToggle` để cha cập nhật lại Set chung.
function FavoriteButton({
                          room,
                          isLoggedIn,
                          favorited,
                          onToggle,
                        }: {
  room: HomestayRoom;
  isLoggedIn: boolean;
  favorited: boolean;
  onToggle: (roomId: string, nowFavorited: boolean) => void;
}) {
  const [pending, setPending] = useState(false);

  const showFavorited = isLoggedIn && favorited;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pending) return;
    if (!isLoggedIn) {
      // Khách chưa đăng nhập bấm tim -> đưa sang trang đăng nhập thay vì gọi API lỗi
      window.location.href = "/sign-in";
      return;
    }
    setPending(true);
    try {
      const nowFavorited = await toggleFavorite(
          {
            id: room.id,
            code: room.code,
            name: room.name,
            price: room.price,
            image: room.images?.[0],
            address: room.address?.fullAddress,
          },
          favorited // truyền sẵn trạng thái hiện tại, khỏi phải fetch lại để kiểm tra
      );
      onToggle(room.id, nowFavorited);
    } finally {
      setPending(false);
    }
  };

  return (
      <button
          onClick={handleClick}
          disabled={pending}
          className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition disabled:opacity-60"
          title={showFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      >
        <svg
            className={`w-4 h-4 transition ${showFavorited ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
            fill={showFavorited ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
  );
}

const LOCATIONS = [
  { name: "Bảo An - Cơ sở 1", rooms: "12 phòng", key: "Bảo An - Cơ sở 1", image: "/images/cs1.jpg" },
  { name: "Bảo An - Cơ sở 5", rooms: "30 phòng", key: "Bảo An - Cơ sở 5", image: "/images/cs5.jpg" },
];

const HELP_ITEMS = [
  { title: "Liên hệ Bảo An Homestay", icon: "concierge", link: "/contact" },
  { title: "Câu hỏi thường gặp", icon: "faq", link: "/faq" },
  { title: "Chính sách bảo mật", icon: "lock", link: "/privacy" },
  { title: "Chính sách thanh toán", icon: "card", link: "/payment-policy" },
  { title: "Điều khoản hoạt động", icon: "doc", link: "/terms" },
  { title: "Quy chế sàn TMĐT", icon: "scale", link: "/marketplace-rules" },
  { title: "Giải quyết khiếu nại", icon: "gear", link: "/complaints" },
];

function HelpIcon({ type }: { type: string }) {
  const cls = "w-7 h-7 text-gray-700";
  switch (type) {
    case "concierge": return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 20h18M12 4a4 4 0 100 8 4 4 0 000-8zM4 20a8 8 0 0116 0" /></svg>
    );
    case "faq": return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v1m0 3v4m0 2h.01" /></svg>
    );
    case "lock": return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 018 0v4" /></svg>
    );
    case "card": return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={1.5}/><path strokeLinecap="round" strokeWidth={1.5} d="M2 10h20" /></svg>
    );
    case "doc": return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    );
    case "scale": return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l9-3 9 3M3 6l4 10M21 6l-4 10M7 16h10M12 3v18" /></svg>
    );
    case "gear": return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    );
    default: return null;
  }
}

function BuildingIcon() {
  return (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="32" height="28" rx="1" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="1.5"/>
        <rect x="8" y="12" width="6" height="6" rx="0.5" fill="#38bdf8"/>
        <rect x="17" y="12" width="6" height="6" rx="0.5" fill="#38bdf8"/>
        <rect x="26" y="12" width="6" height="6" rx="0.5" fill="#38bdf8"/>
        <rect x="8" y="22" width="6" height="6" rx="0.5" fill="#38bdf8"/>
        <rect x="17" y="22" width="6" height="6" rx="0.5" fill="#38bdf8"/>
        <rect x="26" y="22" width="6" height="6" rx="0.5" fill="#38bdf8"/>
        <rect x="14" y="30" width="12" height="6" rx="0.5" fill="#0ea5e9"/>
      </svg>
  );
}

// Thẻ thu nhỏ hiển thị ảnh thật của cơ sở. Nếu chưa có ảnh (chưa thêm vào
// /public/images) thì rơi về icon toà nhà mặc định để không vỡ giao diện.
function LocationThumb({ src, alt }: { src?: string; alt: string }) {
  if (!src) return <BuildingIcon />;
  return (
      <div className="w-16 h-12 rounded-lg overflow-hidden relative shrink-0">
        <Image src={src} alt={alt} fill sizes="64px" className="object-cover" />
      </div>
  );
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80",
];

function getFallbackImage(roomTypeName: string, idx: number) {
  const type = (roomTypeName || '').toLowerCase();
  if (type.includes("deluxe extra")) return FALLBACK_IMAGES[0];
  if (type.includes("deluxe")) return FALLBACK_IMAGES[1];
  return FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
}

// ─── AUTH MENU (LOGGED IN) — đồng bộ với BookingPageClient.tsx: user menu +
// chuông thông báo thật (fetch /api/notifications) + hamburger menu. ──────────
function AuthMenuLoggedIn({ userRole }: { userRole?: Roles | null }) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const hamburgerRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (hamburgerRef.current && !hamburgerRef.current.contains(e.target as Node)) setHamburgerOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lấy danh sách + số lượng thông báo chưa đọc ngay khi vào trang, và cập
  // nhật lại mỗi 30 giây để chuông không bị đứng im (không cần bấm F5).
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.data || []);
      setUnreadCount(json.unreadCount || 0);
    } catch (err) {
      console.error("Lỗi lấy thông báo:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Khi mở dropdown chuông: đánh dấu tất cả đã đọc và cập nhật giao diện ngay lập tức.
  const handleToggleNotif = async () => {
    const willOpen = !notifOpen;
    setNotifOpen(willOpen);
    setHamburgerOpen(false);
    setUserOpen(false);
    if (willOpen) {
      setNotifLoading(true);
      await fetchNotifications();
      setNotifLoading(false);
      if (unreadCount > 0) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        fetch("/api/notifications/read-all", { method: "PUT" }).catch((err) =>
            console.error("Lỗi đánh dấu đã đọc:", err)
        );
      }
    }
  };

  const hamburgerItems = [
    { icon: "transaction", label: "Thông tin giao dịch", href: "/account/transactions" },
    { icon: "reward", label: "Điểm thưởng và ưu đãi", href: "/account/rewards" },
    { icon: "heart", label: "Phòng yêu thích", href: "/account/favorites" },
    { icon: "booking", label: "Quản lý đặt phòng", href: "/account/bookings" },
  ];

  return (
      <div className="flex items-center gap-3 shrink-0">
        {userRole === "admin" && (
            <Link href="/dashboard" className="text-sm font-semibold text-gray-700 hover:text-green-600 transition">Quản trị</Link>
        )}

        {/* User icon */}
        <div className="relative" ref={userRef}>
          <button
              onClick={() => { setUserOpen(o => !o); setHamburgerOpen(false); }}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition bg-white"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          {userOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                <Link href="/account/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-sm text-gray-700">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={1.5}/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11a3 3 0 100-6 3 3 0 000 6zM6.168 18.849A4 4 0 0110 16h4a4 4 0 013.834 2.855" />
                  </svg>
                  Thông tin tài khoản
                </Link>
                <Link href="/account/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-sm text-gray-700">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Đổi mật khẩu
                </Link>
                <button
                    onClick={() => signOut({ redirectUrl: "/" })}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-sm text-red-500 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất tài khoản
                </button>
              </div>
          )}
        </div>

        {/* Bell icon */}
        <div className="relative" ref={notifRef}>
          <button
              onClick={handleToggleNotif}
              className="relative w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition bg-white"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-green-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
            )}
          </button>

          {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">Thông báo</span>
                </div>

                {notifLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">Đang tải...</div>
                ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">Chưa có thông báo nào.</div>
                ) : (
                    notifications.map((n) => {
                      const content = (
                          <div
                              key={n.id}
                              className={`px-4 py-3 hover:bg-gray-50 transition text-sm border-b border-gray-50 last:border-b-0 ${
                                  !n.isRead ? "bg-green-50/50" : ""
                              }`}
                          >
                            <p className="font-medium text-gray-800 line-clamp-1">{n.title || "Thông báo"}</p>
                            {n.message && (
                                <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                            )}
                            {n.createdAt && (
                                <p className="text-gray-400 text-[11px] mt-1">
                                  {new Date(n.createdAt).toLocaleString("vi-VN")}
                                </p>
                            )}
                          </div>
                      );
                      return n.link ? (
                          <Link key={n.id} href={n.link} onClick={() => setNotifOpen(false)}>
                            {content}
                          </Link>
                      ) : (
                          content
                      );
                    })
                )}
              </div>
          )}
        </div>

        {/* Hamburger menu */}
        <div className="relative" ref={hamburgerRef}>
          <button
              onClick={() => { setHamburgerOpen(o => !o); setUserOpen(false); }}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition bg-white"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {hamburgerOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                {hamburgerItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-sm text-gray-700"
                    >
                      <HamburgerIcon type={item.icon} />
                      {item.label}
                    </Link>
                ))}
              </div>
          )}
        </div>
      </div>
  );
}

function HamburgerIcon({ type }: { type: string }) {
  const cls = "w-5 h-5 text-green-600";
  switch (type) {
    case "transaction": return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    );
    case "reward": return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
    );
    case "heart": return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
    case "booking": return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
    default: return null;
  }
}

export default function HomePageClient({
                                         initialRooms,
                                         isLoggedIn = false,
                                         userRole = null,
                                       }: {
  initialRooms: HomestayRoom[];
  isLoggedIn?: boolean;
  userRole?: Roles | null;
}) {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);

  const [selectedBranch, setSelectedBranch] = useState("all");
  const [homestays] = useState<HomestayRoom[]>(initialRooms);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Danh sách phòng yêu thích — CHỈ tải 1 LẦN DUY NHẤT ở đây cho toàn bộ trang,
  // rồi truyền xuống từng FavoriteButton qua Set. Trước đây mỗi FavoriteButton
  // tự gọi API riêng khi mount, nên trang có bao nhiêu card phòng là bấy nhiêu
  // request /api/favorites chạy song song, làm trang tải rất chậm.
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    getFavorites().then((list) => {
      if (active) setFavoriteIds(new Set(list.map((f) => f.id)));
    });
    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  const handleFavoriteToggle = (roomId: string, nowFavorited: boolean) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (nowFavorited) next.add(roomId);
      else next.delete(roomId);
      return next;
    });
  };

  // Cài đặt hệ thống (mạng xã hội...) lấy từ trang Quản trị > Cài đặt
  const [socials, setSocials] = useState<{ facebook?: string; zalo?: string; instagram?: string }>({});

  useEffect(() => {
    let active = true;
    fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (active) setSocials(data.data?.socials || {});
        })
        .catch((error) => console.error("Lỗi tải cài đặt hệ thống:", error));
    return () => {
      active = false;
    };
  }, []);

  // Carousel "Homestay" ở trang chủ chỉ lọc theo cơ sở đã chọn (thẻ Bảo An - Cơ sở 1/5).
  // Ô "Địa điểm" KHÔNG lọc real-time ở đây nữa — nó chỉ được dùng khi bấm nút
  // "Tìm kiếm" để chuyển sang trang /search, tránh việc đang gõ dở đã bị báo
  // "Không tìm thấy phòng nào phù hợp".
  const filteredHomestays = useMemo(() => {
    return homestays.filter((room) => {
      if (selectedBranch !== "all") {
        const roomBranch = (room.property?.name || "").toLowerCase().replace(/\s+/g, "");
        const selBranch = selectedBranch.toLowerCase().replace(/\s+/g, "");
        if (!roomBranch.includes(selBranch) && !selBranch.includes(roomBranch)) return false;
      }
      return true;
    });
  }, [homestays, selectedBranch]);

  const CARD_WIDTH = 300;
  const VISIBLE = 4;
  const maxIdx = Math.max(0, filteredHomestays.length - VISIBLE);

  const scrollCarousel = (dir: "prev" | "next") => {
    setCarouselIdx((prev) => {
      if (dir === "next") return Math.min(prev + 1, maxIdx);
      return Math.max(prev - 1, 0);
    });
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", String(guests));
    router.push(`/search?${params.toString()}`);
  };

  return (
      <div className="min-h-screen bg-white text-gray-900 antialiased">

        {/* ═══════════════════════════════════════════
          HEADER — logo + search bar + auth links
      ═══════════════════════════════════════════ */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-6">

            {/* Logo */}
            <Link href="/" className="text-2xl font-black text-green-600 shrink-0 tracking-tight">
              Bảo An
            </Link>

            {/* Search bar */}
            <div className="flex-1 flex items-center border border-gray-300 rounded-lg bg-white shadow-sm h-11">
              {/* Địa điểm */}
              <div className="flex-[2] px-4 border-r border-gray-200 h-full flex flex-col justify-center rounded-l-lg">
                <span className="text-[10px] text-gray-400 leading-none mb-0.5">Địa điểm</span>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nhập thông tin tìm kiếm"
                    className="text-sm font-medium text-gray-800 bg-transparent focus:outline-none placeholder-gray-400 leading-none"
                />
              </div>

              {/* Nhận phòng */}
              <div className="flex-[1.5] px-4 border-r border-gray-200 h-full">
                <DateField label="Nhận phòng" value={checkIn} onChange={setCheckIn} />
              </div>

              {/* Trả phòng */}
              <div className="flex-[1.5] px-4 border-r border-gray-200 h-full">
                <DateField label="Trả phòng" value={checkOut} onChange={setCheckOut} />
              </div>

              {/* Số khách */}
              <div className="px-4 border-r border-gray-200 h-full flex flex-col justify-center">
                <span className="text-[10px] text-gray-400 leading-none mb-0.5">Số khách</span>
                <div className="flex items-center gap-1">
                  <button
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      className="w-4 h-4 text-gray-500 hover:text-green-600 font-bold text-xs leading-none"
                  >−</button>
                  <span className="text-sm font-semibold text-gray-800 w-4 text-center">{guests}</span>
                  <button
                      onClick={() => setGuests((g) => g + 1)}
                      className="w-4 h-4 text-gray-500 hover:text-green-600 font-bold text-xs leading-none"
                  >+</button>
                </div>
              </div>

              {/* Nút Tìm kiếm */}
              <button
                  onClick={handleSearch}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-6 h-full transition shrink-0 rounded-r-lg"
              >
                Tìm kiếm
              </button>
            </div>

            {/* Auth */}
            <div className="flex items-center gap-4 shrink-0">
              {isLoggedIn ? (
                  <AuthMenuLoggedIn userRole={userRole} />
              ) : (
                  <>
                    <Link href="/sign-in" className="text-sm font-semibold text-gray-700 hover:text-green-600 transition">Đăng nhập</Link>
                    <Link href="/sign-up" className="text-sm font-semibold text-gray-700 hover:text-green-600 transition">Đăng ký</Link>
                  </>
              )}
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════
          CƠ SỞ — danh sách thẻ lựa chọn chi nhánh
      ═══════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <span className="text-red-500">📍</span>
            Các cơ sở tại phường Phan Đình Phùng
          </h2>
          <div className="flex gap-4">
            {LOCATIONS.map((loc) => {
              const active = selectedBranch === loc.key;
              return (
                  <button
                      key={loc.key}
                      onClick={() => setSelectedBranch(active ? "all" : loc.key)}
                      className={`flex flex-col items-center p-4 rounded-xl border-2 w-36 transition cursor-pointer bg-white ${
                          active
                              ? "border-teal-400 ring-1 ring-teal-200"
                              : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <LocationThumb src={loc.image} alt={loc.name} />
                    <span className="font-semibold text-xs text-gray-800 mt-2 text-center leading-tight">{loc.name}</span>
                    <span className="text-[11px] text-gray-400 mt-0.5">{loc.rooms}</span>
                  </button>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
          HOMESTAY — carousel card section
      ═══════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Tiêu đề section + điều hướng */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Homestay</h2>
            <div className="flex items-center gap-3">
              <Link href="/rooms" className="text-sm font-semibold text-green-600 hover:underline">
                Xem thêm
              </Link>
              <button
                  onClick={() => scrollCarousel("prev")}
                  disabled={carouselIdx === 0}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                  onClick={() => scrollCarousel("next")}
                  disabled={carouselIdx >= maxIdx}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Carousel wrapper */}
          {filteredHomestays.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-gray-500 text-sm">Không tìm thấy phòng nào phù hợp.</p>
                <button
                    onClick={() => { setSearchTerm(""); setSelectedBranch("all"); }}
                    className="mt-3 text-xs bg-green-50 text-green-700 font-bold px-4 py-2 rounded-lg hover:bg-green-100 transition"
                >
                  Xóa bộ lọc
                </button>
              </div>
          ) : (
              <div className="overflow-hidden">
                <div
                    ref={carouselRef}
                    className="flex gap-5 transition-transform duration-300"
                    style={{ transform: `translateX(-${carouselIdx * (CARD_WIDTH + 20)}px)` }}
                >
                  {filteredHomestays.map((room, idx) => {
                    const isAvailable = isRoomAvailable(room.status);
                    const price3h = Math.round(room.price * 0.45);

                    return (
                        <div
                            key={room.id}
                            onClick={() => router.push(`/rooms/${room.id}`)}
                            className="shrink-0 bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition cursor-pointer group"
                            style={{ width: `${CARD_WIDTH}px` }}
                        >
                          {/* Hình ảnh */}
                          <div className="relative h-48 bg-gray-100 overflow-hidden">
                            <Image
                                src={room.images?.[0] || getFallbackImage(room.roomType?.name, idx)}
                                alt={room.name}
                                fill
                                sizes="(max-width: 768px) 50vw, 300px"
                                className="object-cover group-hover:scale-105 transition duration-500"
                            />
                            {/* Badges trên ảnh */}
                            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                              <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                {room.code || `R${1000 + idx}`}
                              </span>
                              {!isAvailable && (
                                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                    Hết phòng
                                  </span>
                              )}
                            </div>
                            {/* Nút yêu thích */}
                            <FavoriteButton
                                room={room}
                                isLoggedIn={isLoggedIn}
                                favorited={favoriteIds.has(room.id)}
                                onToggle={handleFavoriteToggle}
                            />
                          </div>

                          {/* Nội dung card */}
                          <div className="p-3">
                            {/* Tên phòng */}
                            <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-green-700 transition">
                              {room.name || `Phòng ${room.code}`}
                            </h3>

                            {/* Đánh giá */}
                            <div className="flex items-center gap-1 mt-1">
                              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              <span className="text-[11px] text-gray-500">(0 đánh giá)</span>
                            </div>

                            {/* Địa chỉ */}
                            <p className="text-[11px] text-gray-400 mt-1 line-clamp-1 flex items-center gap-1">
                              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {room.address?.fullAddress || "Thái Nguyên, Việt Nam"}
                            </p>

                            {/* Loại phòng + khách + số đặt */}
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

                            {/* Giá */}
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex justify-between text-sm font-semibold text-gray-700">
                                <span>{price3h.toLocaleString("vi-VN")}đ/ 3 giờ</span>
                                <span>{room.price.toLocaleString("vi-VN")}đ/ đêm</span>
                              </div>
                            </div>
                          </div>
                        </div>
                    );
                  })}
                </div>
              </div>
          )}
        </section>


        {/* ═══════════════════════════════════════════
          TRỢ GIÚP — grid cards
      ═══════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 border-t border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Trợ giúp</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {HELP_ITEMS.map((item, index) => (
                <Link
                    key={index}
                    href={item.link}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-white flex flex-col justify-between h-32 group"
                >
                  <div>
                    <HelpIcon type={item.icon} />
                    <h3 className="font-medium text-gray-800 mt-3 text-sm group-hover:text-green-700 transition">
                      {item.title}
                    </h3>
                  </div>
                  <span className="text-xs text-green-600 font-semibold mt-2 group-hover:underline">Xem thêm</span>
                </Link>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════ */}
        <footer className="border-t border-gray-200 bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-wrap items-center justify-between gap-4">
            <nav className="flex flex-wrap gap-6 text-sm text-gray-500">
              <Link href="/contact" className="hover:text-gray-800 transition">Liên hệ</Link>
              <Link href="/faq" className="hover:text-gray-800 transition">Các câu hỏi thường gặp</Link>
              <Link href="/host" className="hover:text-gray-800 transition">Kênh host</Link>
              <Link href="/payment-guide" className="hover:text-gray-800 transition">Hướng dẫn thanh toán bằng VNPAY</Link>
            </nav>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <Link href={socials.instagram || "#"} target="_blank" rel="noopener noreferrer" className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </Link>
                <Link href={socials.facebook || "#"} target="_blank" rel="noopener noreferrer" className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </Link>
              </div>
            </div>
          </div>
        </footer>

        {/* ═══════════════════════════════════════════
          NÚT NỔI — Tìm phòng gần bạn + Chat hỗ trợ
      ═══════════════════════════════════════════ */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          <button className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Tìm phòng gần bạn
          </button>
          <button
              onClick={() => alert("Tính năng chat hỗ trợ sẽ được bổ sung!")}
              className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
  );
}
