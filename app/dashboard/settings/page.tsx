"use client";

import React, { useEffect, useState } from "react";

interface SystemSettings {
  logoUrl: string;
  bannerUrl: string;
  contactEmail: string;
  hotline: string;
  address: string;
  policy: string;
  terms: string;
  socials: { facebook?: string; zalo?: string; instagram?: string };
}

const EMPTY_SETTINGS: SystemSettings = {
  logoUrl: "",
  bannerUrl: "",
  contactEmail: "",
  hotline: "",
  address: "",
  policy: "",
  terms: "",
  socials: {},
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        setSettings({ ...EMPTY_SETTINGS, ...data.data, socials: { ...data.data?.socials } });
      } catch (error) {
        console.error("Lỗi tải cài đặt:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không thể lưu cài đặt.");
        return;
      }
      alert("Đã lưu cài đặt hệ thống.");
    } catch (error) {
      console.error("Lỗi lưu cài đặt:", error);
      alert("Không thể kết nối tới máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-400 text-center py-10">Đang tải cài đặt hệ thống...</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Cài đặt hệ thống</h1>
          <p className="text-xs text-gray-500">Logo, banner, liên hệ, chính sách và mạng xã hội.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition"
        >
          {saving ? "Đang lưu..." : "💾 Lưu cài đặt"}
        </button>
      </header>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thương hiệu</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">URL Logo</label>
            <input
              type="text"
              value={settings.logoUrl}
              onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">URL Banner</label>
            <input
              type="text"
              value={settings.bannerUrl}
              onChange={(e) => setSettings({ ...settings, bannerUrl: e.target.value })}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Liên hệ</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">Email liên hệ</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">Hotline</label>
            <input
              type="text"
              value={settings.hotline}
              onChange={(e) => setSettings({ ...settings, hotline: e.target.value })}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">Địa chỉ</label>
          <input
            type="text"
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mạng xã hội</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">Facebook</label>
            <input
              type="text"
              value={settings.socials.facebook || ""}
              onChange={(e) => setSettings({ ...settings, socials: { ...settings.socials, facebook: e.target.value } })}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">Zalo</label>
            <input
              type="text"
              value={settings.socials.zalo || ""}
              onChange={(e) => setSettings({ ...settings, socials: { ...settings.socials, zalo: e.target.value } })}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">Instagram</label>
            <input
              type="text"
              value={settings.socials.instagram || ""}
              onChange={(e) => setSettings({ ...settings, socials: { ...settings.socials, instagram: e.target.value } })}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chính sách & Điều khoản</p>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">Chính sách</label>
          <textarea
            rows={4}
            value={settings.policy}
            onChange={(e) => setSettings({ ...settings, policy: e.target.value })}
            className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">Điều khoản sử dụng</label>
          <textarea
            rows={4}
            value={settings.terms}
            onChange={(e) => setSettings({ ...settings, terms: e.target.value })}
            className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
          />
        </div>
      </div>
    </div>
  );
}
