"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface Booking {
    id: string;
    roomName?: string;
    roomCode?: string;
    totalPrice: number;
    status: "pending" | "confirmed" | "cancelled";
    createdAt: string;
}

interface PurchasedPackage {
    id: string;
    packageId: string;
    amount: number;
    purchasedAt: string;
}

const PURCHASED_KEY = "baoan_prepay_purchases";

function loadPurchases(): PurchasedPackage[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(PURCHASED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

type TxType = "booking" | "prepay";

interface Transaction {
    id: string;
    type: TxType;
    title: string;
    amount: number;
    date: string;
    status: string;
    statusClassName: string;
}

const TYPE_TABS: { key: "all" | TxType; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "booking", label: "Đặt phòng" },
    { key: "prepay", label: "Trả trước" },
];

export default function TransactionsPage() {
    const { user, isLoaded } = useUser();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [purchases, setPurchases] = useState<PurchasedPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeType, setActiveType] = useState<"all" | TxType>("all");

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) {
            window.location.href = "/sign-in?redirect=/account/transactions";
            return;
        }

        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await fetch("/api/bookings", { cache: "no-store" });
                if (res.status === 401) {
                    window.location.href = "/sign-in?redirect=/account/transactions";
                    return;
                }
                const data = await res.json();
                if (!res.ok) {
                    setError(data.message || "Không thể tải lịch sử giao dịch.");
                    return;
                }
                setBookings(data.data || []);
                setPurchases(loadPurchases());
            } catch (err) {
                console.error("Lỗi tải giao dịch:", err);
                setError("Lỗi hệ thống, vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, user?.id]);

    const transactions: Transaction[] = useMemo(() => {
        const fromBookings: Transaction[] = bookings.map((b) => ({
            id: `booking-${b.id}`,
            type: "booking",
            title: `Đặt phòng ${b.roomName || ""} ${b.roomCode ? `(${b.roomCode})` : ""}`.trim(),
            amount: b.totalPrice,
            date: b.createdAt,
            status:
                b.status === "confirmed"
                    ? "Đã xác nhận"
                    : b.status === "cancelled"
                        ? "Đã huỷ"
                        : "Chờ xác nhận",
            statusClassName:
                b.status === "confirmed"
                    ? "bg-emerald-50 text-emerald-700"
                    : b.status === "cancelled"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-700",
        }));

        const fromPrepay: Transaction[] = purchases.map((p) => ({
            id: `prepay-${p.id}`,
            type: "prepay",
            title: `Mua gói trả trước ${p.amount.toLocaleString("vi-VN")}đ`,
            amount: p.amount,
            date: p.purchasedAt,
            status: "Đã thanh toán",
            statusClassName: "bg-emerald-50 text-emerald-700",
        }));

        return [...fromBookings, ...fromPrepay].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [bookings, purchases]);

    const filtered = useMemo(() => {
        if (activeType === "all") return transactions;
        return transactions.filter((t) => t.type === activeType);
    }, [transactions, activeType]);

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900">Thông tin giao dịch</h1>

            <div className="flex items-center gap-6 border-b border-gray-200 overflow-x-auto">
                {TYPE_TABS.map((tab) => {
                    const active = activeType === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveType(tab.key)}
                            className={`relative shrink-0 pb-3 text-sm font-semibold transition ${
                                active ? "text-green-600" : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            {tab.label}
                            {active && (
                                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-green-600 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {loading && <p className="text-sm text-gray-400">Đang tải lịch sử giao dịch...</p>}

            {!loading && error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                    <span className="text-3xl block mb-3">🧾</span>
                    <p className="text-sm text-gray-500">Bạn chưa có giao dịch nào.</p>
                </div>
            )}

            {!loading && !error && filtered.length > 0 && (
                <div className="space-y-3">
                    {filtered.map((tx) => (
                        <div
                            key={tx.id}
                            className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-3"
                        >
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{tx.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(tx.date).toLocaleString("vi-VN")}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-semibold text-green-600">
                                    {tx.amount.toLocaleString("vi-VN")}đ
                                </p>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${tx.statusClassName}`}>
                                    {tx.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
