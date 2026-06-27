"use client";

import React, { useEffect, useRef, useState } from "react";

interface MediaItem {
  url: string;
  source: "room" | "homestay";
  label: string;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lastUploadUrl, setLastUploadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      setMedia(data.data || []);
    } catch (error) {
      console.error("Lỗi tải media:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setLastUploadUrl(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/rooms/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Tải ảnh lên thất bại.");
        return;
      }
      setLastUploadUrl(data.url);
    } catch (error) {
      console.error("Lỗi tải ảnh:", error);
      alert("Không thể kết nối tới máy chủ.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-gray-200 pb-5">
        <h1 className="text-xl font-bold text-gray-800">Quản lý hình ảnh</h1>
        <p className="text-xs text-gray-500">Thư viện ảnh đang gắn vào Homestay và Phòng.</p>
      </header>

      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <p className="text-xs font-bold text-gray-500">Tải ảnh lên (sau đó dán URL vào form Homestay/Phòng)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          disabled={uploading}
          className="text-xs"
        />
        {uploading && <p className="text-xs text-gray-400">Đang tải lên...</p>}
        {lastUploadUrl && (
          <div className="text-xs bg-emerald-50 text-emerald-700 rounded-lg p-3 flex items-center justify-between gap-3">
            <span className="truncate">{lastUploadUrl}</span>
            <button
              onClick={() => navigator.clipboard.writeText(lastUploadUrl)}
              className="font-bold underline shrink-0"
            >
              Copy
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-10">Đang tải thư viện ảnh...</p>
        ) : media.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Chưa có ảnh nào được gắn vào Homestay/Phòng.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {media.map((m, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.label} className="w-full h-28 object-cover" />
                <div className="p-2">
                  <p className="text-[11px] font-bold text-gray-700 truncate">{m.label}</p>
                  <p className="text-[10px] text-gray-400">{m.source === "room" ? "Phòng" : "Homestay"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
