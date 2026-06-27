"use client";

import React, { useEffect, useState } from "react";

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  reply?: string;
  isApproved: boolean;
  isSpam?: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      setReviews(data.data || []);
    } catch (error) {
      console.error("Lỗi tải đánh giá:", error);
      alert("Không tải được danh sách đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const updateReview = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không thể cập nhật đánh giá.");
        return;
      }
      await loadReviews();
    } catch (error) {
      console.error("Lỗi cập nhật đánh giá:", error);
      alert("Không thể kết nối tới máy chủ.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!window.confirm(`Xác nhận xoá đánh giá của "${review.customerName}"?`)) return;
    try {
      const res = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không xoá được đánh giá này.");
        return;
      }
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (error) {
      console.error("Lỗi xoá đánh giá:", error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-gray-200 pb-5">
        <h1 className="text-xl font-bold text-gray-800">Quản lý đánh giá</h1>
        <p className="text-xs text-gray-500">Duyệt, trả lời, hoặc xoá đánh giá spam.</p>
      </header>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Đang tải...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">Chưa có đánh giá nào.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-sm text-gray-800">{r.customerName}</p>
                  <p className="text-amber-500 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                </div>
                <div className="flex gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-sm ${
                      r.isApproved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {r.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                  </span>
                  {r.isSpam && <span className="text-[10px] font-bold px-2 py-1 rounded-sm bg-red-50 text-red-600">Spam</span>}
                </div>
              </div>

              <p className="text-sm text-gray-600">{r.comment}</p>

              {r.reply && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                  <span className="font-bold text-teal-700">Phản hồi của Admin: </span>
                  {r.reply}
                </div>
              )}

              <div className="flex flex-wrap gap-2 items-center pt-1">
                {!r.isApproved && (
                  <button
                    onClick={() => updateReview(r.id, { isApproved: true })}
                    disabled={busyId === r.id}
                    className="text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    Duyệt
                  </button>
                )}
                <button
                  onClick={() => updateReview(r.id, { isSpam: !r.isSpam })}
                  disabled={busyId === r.id}
                  className="text-xs font-bold text-amber-600 border border-amber-200 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  {r.isSpam ? "Bỏ đánh dấu spam" : "Đánh dấu spam"}
                </button>
                <button
                  onClick={() => handleDelete(r)}
                  className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                >
                  Xoá
                </button>

                <div className="flex-1 flex gap-2 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Viết phản hồi..."
                    value={replyDrafts[r.id] ?? r.reply ?? ""}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    className="flex-1 text-xs p-2 border border-gray-200 rounded-lg focus:outline-teal-500"
                  />
                  <button
                    onClick={() => updateReview(r.id, { reply: replyDrafts[r.id] ?? "" })}
                    disabled={busyId === r.id}
                    className="text-xs font-bold text-teal-700 border border-teal-200 hover:bg-teal-50 px-3 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
