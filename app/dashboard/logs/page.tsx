"use client";

import React, { useEffect, useState } from "react";

interface SystemLog {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  target?: string;
  createdAt: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/logs");
        const data = await res.json();
        setLogs(data.data || []);
      } catch (error) {
        console.error("Lỗi tải nhật ký:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <header className="border-b border-gray-200 pb-5">
        <h1 className="text-xl font-bold text-gray-800">Nhật ký hệ thống</h1>
        <p className="text-xs text-gray-500">Lịch sử thao tác của admin trong hệ thống (200 dòng gần nhất).</p>
      </header>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Đang tải...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Chưa có nhật ký nào được ghi lại.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((l) => (
              <div key={l.id} className="p-4 flex justify-between items-start gap-3">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">{l.actorName || l.actorId.slice(0, 10)}</span> — {l.action}
                    {l.target && <span className="text-gray-400"> ({l.target})</span>}
                  </p>
                </div>
                <p className="text-[11px] text-gray-400 shrink-0">{new Date(l.createdAt).toLocaleString("vi-VN")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
