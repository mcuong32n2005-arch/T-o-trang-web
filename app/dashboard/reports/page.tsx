"use client";

import React, { useEffect, useState } from "react";

interface ReportData {
  period: string;
  revenue: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  occupancyRate: number;
  topRooms: { name: string; count: number }[];
  customersReturning: number;
}

const PERIODS = [
  { value: "day", label: "Hôm nay" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "year", label: "Năm nay" },
];

export default function AdminReportsPage() {
  const [period, setPeriod] = useState("month");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async (p: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${p}`);
      const data = await res.json();
      setReport(data.data || null);
    } catch (error) {
      console.error("Lỗi tải báo cáo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(period);
  }, [period]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between items-center gap-3 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Báo cáo thống kê</h1>
          <p className="text-xs text-gray-500">Tổng hợp doanh thu, booking và công suất phòng.</p>
        </div>
        <a
          href={`/api/reports/export?period=${period}`}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          ⬇ Xuất Excel/CSV
        </a>
      </header>

      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
              period === p.value ? "bg-teal-700 text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Đang tải báo cáo...</p>
      ) : !report ? (
        <p className="text-sm text-gray-400 text-center py-10">Không có dữ liệu.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Doanh thu</p>
              <p className="text-2xl font-black text-green-600 mt-2">{report.revenue.toLocaleString("vi-VN")}đ</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng booking</p>
              <p className="text-2xl font-black text-gray-800 mt-2">{report.totalBookings}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Công suất phòng</p>
              <p className="text-2xl font-black text-purple-600 mt-2">{report.occupancyRate}%</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Khách quay lại</p>
              <p className="text-2xl font-black text-sky-600 mt-2">{report.customersReturning}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Booking theo trạng thái</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Đã xác nhận</span>
                <span className="font-bold text-emerald-600">{report.confirmedBookings}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Đã huỷ</span>
                <span className="font-bold text-red-500">{report.cancelledBookings}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Phòng được đặt nhiều nhất</p>
              {report.topRooms.length === 0 ? (
                <p className="text-xs text-gray-400">Chưa có dữ liệu.</p>
              ) : (
                <ul className="space-y-1.5">
                  {report.topRooms.map((r, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{r.name}</span>
                      <span className="font-bold text-gray-800">{r.count} lượt</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
