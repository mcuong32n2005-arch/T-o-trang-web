import Link from "next/link";
import { ReactNode } from "react";

export default function HelpPageLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Thanh điều hướng đơn giản */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-green-700 transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Trang chủ
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 text-gray-700 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
