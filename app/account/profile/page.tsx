"use client";

import React, { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";

interface ProfileData {
    name: string;
    phone: string;
    dob: string;
    avatarColor: string;
    cccdImageUrl: string;
    email: string;
    displayName: string;
    imageUrl: string;
}

// Mỗi dòng thông tin có thể bấm "Chỉnh sửa" để sửa tại chỗ
function EditableRow({
                         label,
                         value,
                         placeholder,
                         type = "text",
                         onSave,
                     }: {
    label: string;
    value: string;
    placeholder: string;
    type?: string;
    onSave: (newValue: string) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saving, setSaving] = useState(false);

    const display = value
        ? type === "date"
            ? new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
            : value
        : placeholder;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(draft.trim());
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="py-4 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{label}</span>
                {!editing && (
                    <button
                        onClick={() => { setDraft(value); setEditing(true); }}
                        className="text-xs font-semibold text-green-600 hover:underline"
                    >
                        Chỉnh sửa
                    </button>
                )}
            </div>

            {!editing ? (
                <p className={`text-sm mt-1 ${value ? "text-gray-900" : "text-gray-400"}`}>{display}</p>
            ) : (
                <div className="mt-2 flex items-center gap-2">
                    <input
                        type={type}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={placeholder}
                        autoFocus
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                    />
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-2 rounded-lg transition"
                    >
                        {saving ? "..." : "Lưu"}
                    </button>
                    <button
                        onClick={() => setEditing(false)}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2"
                    >
                        Huỷ
                    </button>
                </div>
            )}
        </div>
    );
}

export default function ProfilePage() {
    const { user } = useUser();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users/me");
            if (res.status === 401) {
                window.location.href = "/sign-in?redirect=/account/profile";
                return;
            }
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Không thể tải thông tin tài khoản.");
                return;
            }
            setProfile(data.data);
        } catch (err) {
            console.error("Lỗi tải profile:", err);
            setError("Lỗi hệ thống, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const updateField = async (field: keyof ProfileData, value: string) => {
        const res = await fetch("/api/users/me", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.message || "Cập nhật không thành công.");
            return;
        }
        setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Bạn chắc chắn muốn xoá tài khoản? Hành động này không thể hoàn tác.")) return;
        if (!window.confirm("Xác nhận lần cuối: xoá tài khoản vĩnh viễn?")) return;

        try {
            const res = await fetch("/api/users/me", { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) {
                alert(data.message || "Không thể xoá tài khoản.");
                return;
            }
            window.location.href = "/";
        } catch (err) {
            console.error("Lỗi xoá tài khoản:", err);
            alert("Lỗi hệ thống, vui lòng thử lại.");
        }
    };

    if (loading) {
        return <p className="text-sm text-gray-400">Đang tải thông tin tài khoản...</p>;
    }

    if (error || !profile) {
        return (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {error || "Không thể tải thông tin tài khoản."}
            </p>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h1>

            {/* ─── Khối tài khoản Clerk: avatar, email, mật khẩu, bảo mật ─── */}
            <div className="border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                    <UserButton
                        appearance={{
                            elements: { userButtonAvatarBox: "w-16 h-16" },
                        }}
                    />
                    <div>
                        <h2 className="text-base font-bold text-gray-900">
                            {profile.displayName || "Tài khoản của bạn"}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">{profile.email}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                            Bấm vào ảnh đại diện để đổi email, mật khẩu hoặc ảnh hồ sơ
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Khối hồ sơ bổ sung: tự lưu trong MongoDB ─── */}
            <div className="border border-gray-200 rounded-2xl p-6">
                <h2 className="text-base font-bold text-gray-900">Hồ sơ bổ sung</h2>
                <p className="text-xs text-gray-400 mt-1 mb-2">
                    Hoàn thành chi tiết hồ sơ giúp cho việc đặt chỗ được nhanh hơn và dễ hơn
                </p>

                <div className="border-t border-gray-100">
                    <EditableRow
                        label="Họ và tên"
                        value={profile.name}
                        placeholder="Chưa cập nhật"
                        onSave={(v) => updateField("name", v)}
                    />
                    <EditableRow
                        label="Số điện thoại"
                        value={profile.phone}
                        placeholder="Chưa cập nhật"
                        type="tel"
                        onSave={(v) => updateField("phone", v)}
                    />
                    <EditableRow
                        label="Ngày sinh"
                        value={profile.dob}
                        placeholder="Chưa cập nhật"
                        type="date"
                        onSave={(v) => updateField("dob", v)}
                    />
                </div>
            </div>

            {/* Ảnh CCCD/CMND */}
            <div className="border border-gray-200 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="3" strokeWidth={1.5} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 20c0-3 3.5-5 8-5s8 2 8 5" />
                    </svg>
                    Ảnh CCCD/CMND
                </div>
                <span className="text-xs font-semibold text-pink-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l1.5 1.5L15 9"/></svg>
                    {profile.cccdImageUrl ? "Đã cung cấp" : "Chưa cung cấp"}
                </span>
            </div>

            <button
                onClick={handleDeleteAccount}
                className="text-sm font-semibold text-red-500 hover:underline"
            >
                Xoá tài khoản
            </button>
        </div>
    );
}
