"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getFavorites, removeFavorite, FavoriteRoom } from "../_lib/favorites";

export default function FavoritesPage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const [favorites, setFavorites] = useState<FavoriteRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const refresh = async () => {
        const data = await getFavorites();
        setFavorites(data);
    };

    useEffect(() => {
        // Chờ Clerk load xong, và mỗi khi đổi tài khoản (user.id thay đổi),
        // xoá state cũ + tải lại từ đầu — tương tự MyBookingsPage.
        if (!isLoaded) return;
        setFavorites([]);
        if (!user) {
            window.location.href = "/sign-in?redirect=/account/favorites";
            return;
        }
        setLoading(true);
        refresh().finally(() => setLoading(false));

        // Đồng bộ lại nếu phòng được (bỏ) yêu thích từ tab/trang khác
        const handleChange = () => refresh();
        window.addEventListener("favorites-changed", handleChange);
        return () => window.removeEventListener("favorites-changed", handleChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, user?.id]);

    const handleRemove = async (id: string) => {
        setRemovingId(id);
        try {
            await removeFavorite(id);
            await refresh();
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return <p className="text-sm text-gray-400">Đang tải danh sách yêu thích...</p>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900">Phòng yêu thích</h1>

            {favorites.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                    <span className="text-3xl block mb-3">🤍</span>
                    <p className="text-sm text-gray-500">Bạn chưa có phòng yêu thích nào</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">
                        Bảo An Homestay có rất nhiều phòng cho bạn khám phá đấy!
                    </p>
                    <Link href="/" className="text-sm font-semibold text-green-600 hover:underline">
                        Khám phá ngay →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {favorites.map((room) => (
                        <div
                            key={room.id}
                            className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition cursor-pointer group"
                            onClick={() => router.push(`/rooms/${room.id}`)}
                        >
                            <div className="relative h-36 bg-gray-100">
                                <img
                                    src={room.image || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80"}
                                    alt={room.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(room.id);
                                    }}
                                    disabled={removingId === room.id}
                                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition disabled:opacity-60"
                                    title="Bỏ yêu thích"
                                >
                                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.001 4.529c2.349-2.532 6.151-2.532 8.5 0a6.014 6.014 0 010 8.243l-7.793 8.314a1 1 0 01-1.415 0l-7.793-8.314a6.014 6.014 0 010-8.243c2.349-2.532 6.151-2.532 8.5 0z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-3">
                                <h3 className="font-semibold text-sm text-gray-900 group-hover:text-green-700 transition">
                                    {room.name} {room.code ? `(${room.code})` : ""}
                                </h3>
                                {room.address && (
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{room.address}</p>
                                )}
                                <p className="text-sm font-semibold text-green-600 mt-2">
                                    {room.price.toLocaleString("vi-VN")}đ/đêm
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
