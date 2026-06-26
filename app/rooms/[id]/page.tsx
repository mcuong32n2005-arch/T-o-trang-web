"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// ─── DATE PICKER (giống hệt trang chủ, để đồng bộ trải nghiệm chọn ngày) ────
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
    label: string;
}) {
    const today = new Date();
    const initial = value ? new Date(value) : today;
    const [viewYear, setViewYear] = useState(initial.getFullYear());
    const [viewMonth, setViewMonth] = useState(initial.getMonth());
    const [selected, setSelected] = useState<Date | null>(value ? new Date(value) : null);
    const [time, setTime] = useState<string>(
        value ? value.slice(11, 16) || "14:00" : "14:00"
    );
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
        if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
        else setViewMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
        else setViewMonth((m) => m + 1);
    };

    const emit = (d: Date, t: string) => {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${t}`;
        onChange(iso);
    };

    const selectDay = (day: number) => {
        const d = new Date(viewYear, viewMonth, day);
        setSelected(d);
        emit(d, time);
    };

    const handleTimeChange = (t: string) => {
        setTime(t);
        if (selected) emit(selected, t);
    };

    const isToday = (day: number) =>
        today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
    const isSelected = (day: number) =>
        selected && selected.getDate() === day && selected.getMonth() === viewMonth && selected.getFullYear() === viewYear;
    const isPast = (day: number) => {
        const d = new Date(viewYear, viewMonth, day);
        d.setHours(0, 0, 0, 0);
        const t = new Date(); t.setHours(0, 0, 0, 0);
        return d < t;
    };

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);

    return (
        <div ref={ref} className="absolute top-full mt-2 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-72">
            <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <span className="text-sm font-semibold text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
                <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                    <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
                ))}
            </div>

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

            {/* Chọn giờ */}
            <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-[11px] font-semibold text-gray-500 block mb-1">Giờ</span>
                <input
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-green-500"
                />
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => { setSelected(null); onChange(""); }} className="text-xs text-green-600 font-semibold hover:underline">
                    Xóa
                </button>
                <button
                    onClick={() => { const d = new Date(); selectDay(d.getDate()); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); }}
                    className="text-xs text-green-600 font-semibold hover:underline"
                >
                    Hôm nay
                </button>
            </div>
        </div>
    );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
    const [open, setOpen] = useState(false);

    const display = value
        ? `${new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}, ${value.slice(11, 16)}`
        : "";

    return (
        <div className="relative h-full w-full">
            <button type="button" onClick={() => setOpen((o) => !o)} className="w-full h-full flex flex-col justify-center text-left focus:outline-none">
                <span className="text-[10px] text-gray-400 leading-none mb-0.5 block">{label}</span>
                {display
                    ? <span className="text-sm font-medium text-gray-800 leading-none">{display}</span>
                    : <span className="text-sm text-gray-400 leading-none">Chọn thời gian</span>
                }
            </button>
            {open && (
                <DatePickerPopup value={value} onChange={(v) => { onChange(v); setOpen(false); }} onClose={() => setOpen(false)} label={label} />
            )}
        </div>
    );
}

// ─── DỮ LIỆU PHÒNG ───────────────────────────────────────────────────────────
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

const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
];

export default function RoomDetailPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params?.id as string;

    const [room, setRoom] = useState<HomestayRoom | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [activeImage, setActiveImage] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [saved, setSaved] = useState(false);

    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [guests, setGuests] = useState(2);
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestNote, setGuestNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        if (!roomId) return;
        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/rooms/${roomId}`);
                if (res.status === 404) {
                    setNotFound(true);
                    return;
                }
                const data = await res.json();
                setRoom(data.data || null);
            } catch (error) {
                console.error("Lỗi tải thông tin phòng:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [roomId]);

    const gallery = useMemo(() => {
        if (room?.images && room.images.length > 0) return room.images;
        return [FALLBACK_IMAGES[0], FALLBACK_IMAGES[1], FALLBACK_IMAGES[2], FALLBACK_IMAGES[3]];
    }, [room]);

    // Phím tắt khi lightbox đang mở: Esc đóng, ← → chuyển ảnh
    useEffect(() => {
        if (!lightboxOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightboxOpen(false);
            if (e.key === "ArrowLeft") setActiveImage((i) => (i - 1 + gallery.length) % gallery.length);
            if (e.key === "ArrowRight") setActiveImage((i) => (i + 1) % gallery.length);
        };
        window.addEventListener("keydown", handler);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [lightboxOpen, gallery.length]);

    // Công thức giống hệt trang chủ: giá theo 3 giờ ước tính = 45% giá/đêm
    const price3h = room ? Math.round(room.price * 0.45) : 0;
    const maxGuests = room?.bedroomCount ? room.bedroomCount + 2 : 3;

    const nights = useMemo(() => {
        if (!checkIn || !checkOut) return 0;
        const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        if (ms <= 0) return 0;
        return Math.ceil(ms / (1000 * 60 * 60 * 24));
    }, [checkIn, checkOut]);

    const total = room && nights > 0 ? nights * room.price : 0;

    const handleShare = async () => {
        const url = typeof window !== "undefined" ? window.location.href : "";
        try {
            if (navigator.share) {
                await navigator.share({ title: room?.name, url });
            } else {
                await navigator.clipboard.writeText(url);
                alert("Đã sao chép liên kết phòng.");
            }
        } catch {
            // người dùng bấm huỷ chia sẻ — không cần xử lý gì thêm
        }
    };

    const handleBooking = async () => {
        setBookingError("");

        if (!checkIn || !checkOut) {
            setBookingError("Vui lòng chọn thời gian nhận và trả phòng.");
            return;
        }
        if (nights <= 0) {
            setBookingError("Thời gian trả phòng phải sau thời gian nhận phòng.");
            return;
        }
        if (!guestName.trim() || !guestPhone.trim()) {
            setBookingError("Vui lòng nhập đầy đủ họ tên và số điện thoại.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: room?.id,
                    roomName: room?.name,
                    roomCode: room?.code,
                    checkIn,
                    checkOut,
                    guestName: guestName.trim(),
                    guestPhone: guestPhone.trim(),
                    guestNote: guestNote.trim(),
                    price: room?.price,
                }),
            });

            if (res.status === 401) {
                // Chưa đăng nhập — lưu lại đường dẫn hiện tại để quay lại sau khi login
                const redirect = typeof window !== "undefined" ? window.location.pathname : "/";
                router.push(`/sign-in?redirect=${encodeURIComponent(redirect)}`);
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                setBookingError(data.message || "Đặt phòng không thành công.");
                return;
            }

            setBookingSuccess(true);
        } catch (error) {
            console.error("Lỗi đặt phòng:", error);
            setBookingError("Lỗi hệ thống, vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
                Đang tải thông tin phòng...
            </div>
        );
    }

    if (notFound || !room) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-sm text-gray-500">Không tìm thấy phòng này.</p>
                <Link href="/booking" className="text-sm font-semibold text-green-600 hover:underline">← Về trang đặt phòng</Link>
            </div>
        );
    }

    const isAvailable = room.status === "available" || room.status === "AVAILABLE" || room.status === "Sẵn sàng";

    return (
        <div className="min-h-screen bg-white text-gray-900 antialiased">
            {/* TOP BAR đơn giản */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-black text-green-600 tracking-tight">Bảo An</Link>
                    <Link href="/booking" className="text-xs font-semibold text-gray-500 hover:text-green-600 transition flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                        Quay lại danh sách phòng
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                {/* ẢNH PHÒNG: 1 ảnh lớn + lưới ảnh nhỏ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-2xl overflow-hidden mb-6 md:h-[420px]">
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        className="md:col-span-2 h-64 md:h-full min-h-0 bg-gray-100 cursor-pointer flex items-center justify-center overflow-hidden"
                    >
                        <img src={gallery[activeImage]} alt={room.name} className="w-full h-full object-contain" />
                    </button>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:h-full min-h-0">
                        {gallery.slice(0, 4).map((img, i) => (
                            <button
                                key={i}
                                onClick={() => { setActiveImage(i); setLightboxOpen(true); }}
                                className={`relative h-32 md:h-full w-full min-h-0 bg-gray-100 overflow-hidden flex items-center justify-center ${activeImage === i ? "ring-2 ring-green-600" : ""}`}
                            >
                                <img src={img} alt={`${room.name} ${i + 1}`} className="w-full h-full object-contain hover:scale-105 transition duration-300" />
                                {i === 3 && gallery.length > 4 && (
                                    <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold">
                                        +{gallery.length - 4} ảnh
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* LIGHTBOX — xem toàn màn hình, điều hướng giữa các ảnh */}
                {lightboxOpen && (
                    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col">
                        {/* Header lightbox */}
                        <div className="flex items-center justify-between px-4 md:px-8 py-4 text-white">
                            <span className="text-sm font-medium">Danh sách ảnh phòng</span>
                            <button
                                onClick={() => setLightboxOpen(false)}
                                className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>

                        {/* Ảnh chính + nút điều hướng */}
                        <div className="flex-1 flex items-center justify-center relative px-4 md:px-16">
                            <button
                                onClick={() => setActiveImage((i) => (i - 1 + gallery.length) % gallery.length)}
                                className="absolute left-2 md:left-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                            >
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                            </button>

                            <img
                                src={gallery[activeImage]}
                                alt={`${room.name} ${activeImage + 1}`}
                                className="max-h-[70vh] max-w-full object-contain rounded-lg"
                            />

                            <button
                                onClick={() => setActiveImage((i) => (i + 1) % gallery.length)}
                                className="absolute right-2 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                            >
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                            </button>
                        </div>

                        {/* Dải thumbnail dưới cùng */}
                        <div className="flex items-center justify-center gap-2 px-4 py-4 overflow-x-auto">
                            {gallery.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    className={`shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-md overflow-hidden border-2 transition ${
                                        activeImage === i ? "border-green-500" : "border-transparent opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ═══════ CỘT TRÁI: THÔNG TIN PHÒNG ═══════ */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header phòng */}
                        <div>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-2.5 py-1 rounded font-mono">
                    Mã căn hộ: {room.code}
                  </span>
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded ${isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    ● {isAvailable ? "Đang trống" : "Đã đặt"}
                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleShare} className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1 transition">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342a3 3 0 100 2.316m0-2.316a3 3 0 100-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                                        Chia sẻ
                                    </button>
                                    <button onClick={() => setSaved((s) => !s)} className={`text-xs font-semibold flex items-center gap-1 transition ${saved ? "text-red-500" : "text-gray-500 hover:text-gray-800"}`}>
                                        <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.682a4.5 4.5 0 010-6.364z"/></svg>
                                        Lưu lại
                                    </button>
                                </div>
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 mt-3">{room.name} — {room.property?.name}</h1>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                {room.address?.fullAddress || "Thái Nguyên"}
                            </p>
                        </div>

                        {/* Thông tin chung */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Thông tin chung</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[
                                    { label: "Loại phòng", value: room.roomType?.name || "Standard" },
                                    { label: "Diện tích", value: `${room.sqm} m²` },
                                    { label: "Số khách", value: `1 - ${maxGuests} khách` },
                                    { label: "Phòng ngủ", value: `${room.bedroomCount || 1} phòng` },
                                    { label: "Giường ngủ", value: `${room.bedCount || 1} giường` },
                                    { label: "Phòng tắm", value: `${room.bathroomCount || 1} phòng` },
                                ].map((item) => (
                                    <div key={item.label} className="border border-gray-200 rounded-xl p-3">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">{item.label}</span>
                                        <span className="font-semibold text-sm text-gray-800">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bảng giá */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Bảng giá</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Thuê theo giờ</p>
                                        <p className="text-xs text-gray-400">Tối đa 3 tiếng</p>
                                    </div>
                                    <span className="text-lg font-bold text-green-600">{price3h.toLocaleString("vi-VN")}đ</span>
                                </div>
                                <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Thuê theo đêm</p>
                                        <p className="text-xs text-gray-400">Nhận - trả phòng linh hoạt</p>
                                    </div>
                                    <span className="text-lg font-bold text-green-600">{room.price.toLocaleString("vi-VN")}đ</span>
                                </div>
                            </div>
                        </div>

                        {/* Giới thiệu căn hộ */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Giới thiệu căn hộ</h2>
                            {room.description && (
                                <p className="text-sm text-gray-600 leading-relaxed mb-4">{room.description}</p>
                            )}
                            {room.amenities?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {room.amenities.map((a, i) => (
                                        <span key={i} className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                      <span className="text-green-600">✔</span> {a}
                    </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Chính sách huỷ — văn bản chung, sửa lại cho đúng chính sách thực tế của bạn */}
                        <div className="border-t border-gray-100 pt-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Chính sách huỷ và chỉnh sửa</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-3">
                                    <span className="text-green-600 mt-0.5">🏷️</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">Đặt phòng thành công</p>
                                        <p className="text-gray-500 text-xs">Hoàn 100% tiền phòng và 100% tiền dịch vụ</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-green-600 mt-0.5">⏱️</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">7 ngày trước check-in</p>
                                        <p className="text-gray-500 text-xs">Hoàn 100% tiền dịch vụ, không hoàn tiền phòng</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-green-600 mt-0.5">⏱️</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">2 ngày trước check-in</p>
                                        <p className="text-gray-500 text-xs">Không hoàn tiền</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════ CỘT PHẢI: SIDEBAR ĐẶT PHÒNG ═══════ */}
                    <div className="lg:col-span-1">
                        {bookingSuccess ? (
                            <div className="border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24 text-center space-y-4">
                                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                                    <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                                </div>
                                <h3 className="text-base font-bold text-gray-900">Đặt phòng thành công!</h3>
                                <p className="text-sm text-gray-500">Thông tin đặt phòng đã được lưu. Admin sẽ liên hệ xác nhận với bạn sớm.</p>
                                <Link
                                    href="/account/bookings"
                                    className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-3 rounded-lg shadow transition"
                                >
                                    Xem đơn đặt phòng của tôi
                                </Link>
                                <Link href="/" className="block text-xs font-semibold text-gray-500 hover:text-gray-800 transition">
                                    ← Về trang chủ
                                </Link>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-24 space-y-4">
                                <h3 className="text-base font-bold text-gray-900">Thông tin chi tiết</h3>

                                <div className="flex items-center border border-gray-300 rounded-lg bg-white h-14">
                                    <div className="flex-1 h-full px-3 border-r border-gray-200">
                                        <DateField label="Thời gian nhận" value={checkIn} onChange={setCheckIn} />
                                    </div>
                                    <div className="flex-1 h-full px-3">
                                        <DateField label="Thời gian trả" value={checkOut} onChange={setCheckOut} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5">
                                    <span className="text-sm text-gray-700">Số khách (tối đa {maxGuests} khách)</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setGuests((g) => Math.max(1, g - 1))}
                                            className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-600 flex items-center justify-center transition"
                                        >−</button>
                                        <span className="text-sm font-semibold w-4 text-center">{guests}</span>
                                        <button
                                            onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
                                            className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-600 flex items-center justify-center transition"
                                        >+</button>
                                    </div>
                                </div>

                                {/* Thông tin khách đặt phòng */}
                                <div className="space-y-2.5 border-t border-gray-100 pt-4">
                                    <h4 className="text-sm font-bold text-gray-800">Thông tin khách đặt phòng</h4>
                                    <input
                                        type="text"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="Họ và tên"
                                        className="w-full text-sm p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                                    />
                                    <input
                                        type="tel"
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                        placeholder="Số điện thoại"
                                        className="w-full text-sm p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                                    />
                                    <textarea
                                        value={guestNote}
                                        onChange={(e) => setGuestNote(e.target.value)}
                                        placeholder="Ghi chú (không bắt buộc)"
                                        rows={2}
                                        className="w-full text-sm p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 resize-none"
                                    />
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        placeholder="Mã giảm giá"
                                        disabled
                                        className="w-full text-sm p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Chức năng mã giảm giá sẽ sớm được hỗ trợ.</p>
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">Đơn giá chi tiết</h4>
                                    {nights > 0 ? (
                                        <p className="text-xs text-gray-500 mb-2">
                                            {nights} đêm × {room.price.toLocaleString("vi-VN")}đ
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400 mb-2">Chọn ngày nhận và trả phòng để xem giá.</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">Tổng tiền</span>
                                        <span className="text-xl font-black text-green-600">{total.toLocaleString("vi-VN")}đ</span>
                                    </div>
                                </div>

                                {bookingError && (
                                    <p className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                        {bookingError}
                                    </p>
                                )}

                                <button
                                    onClick={handleBooking}
                                    disabled={!isAvailable || submitting}
                                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-lg shadow transition"
                                >
                                    {!isAvailable ? "Phòng đã được đặt" : submitting ? "Đang xử lý..." : "Đặt phòng"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
