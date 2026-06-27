"use client";

import React, { useEffect, useState } from "react";

interface ContactMessage {
  id: string;
  type: "contact" | "feedback" | "complaint";
  name: string;
  email?: string;
  phone?: string;
  content: string;
  reply?: string;
  isResolved: boolean;
  createdAt: string;
}

const TYPE_LABEL: Record<string, { label: string; className: string }> = {
  contact: { label: "Liên hệ", className: "bg-sky-50 text-sky-700" },
  feedback: { label: "Góp ý", className: "bg-emerald-50 text-emerald-700" },
  complaint: { label: "Khiếu nại", className: "bg-red-50 text-red-600" },
};

export default function AdminContactsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      setMessages(data.data || []);
    } catch (error) {
      console.error("Lỗi tải liên hệ:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const updateMessage = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không thể cập nhật.");
        return;
      }
      await loadMessages();
    } catch (error) {
      console.error("Lỗi cập nhật liên hệ:", error);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-gray-200 pb-5">
        <h1 className="text-xl font-bold text-gray-800">Quản lý liên hệ</h1>
        <p className="text-xs text-gray-500">Liên hệ, góp ý và khiếu nại từ khách hàng.</p>
      </header>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Đang tải...</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">Chưa có liên hệ nào.</p>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => {
            const type = TYPE_LABEL[m.type] || TYPE_LABEL.contact;
            return (
              <div key={m.id} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-sm text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-400">
                      {m.email} {m.phone && `· ${m.phone}`}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-sm ${type.className}`}>{type.label}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-sm ${
                        m.isResolved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {m.isResolved ? "Đã xử lý" : "Chờ xử lý"}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600">{m.content}</p>

                {m.reply && (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                    <span className="font-bold text-teal-700">Phản hồi: </span>
                    {m.reply}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 items-center pt-1">
                  {!m.isResolved && (
                    <button
                      onClick={() => updateMessage(m.id, { isResolved: true })}
                      disabled={busyId === m.id}
                      className="text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      Đánh dấu đã xử lý
                    </button>
                  )}
                  <div className="flex-1 flex gap-2 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Trả lời khách..."
                      value={replyDrafts[m.id] ?? m.reply ?? ""}
                      onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      className="flex-1 text-xs p-2 border border-gray-200 rounded-lg focus:outline-teal-500"
                    />
                    <button
                      onClick={() => updateMessage(m.id, { reply: replyDrafts[m.id] ?? "" })}
                      disabled={busyId === m.id}
                      className="text-xs font-bold text-teal-700 border border-teal-200 hover:bg-teal-50 px-3 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      Gửi
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
