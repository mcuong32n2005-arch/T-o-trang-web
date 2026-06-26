import Link from "next/link";

export default function FavoritesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900">Phòng yêu thích</h1>

            <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                <span className="text-3xl block mb-3">🤍</span>
                <p className="text-sm text-gray-500">Tính năng đang được phát triển.</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                    Các phòng bạn đã đánh dấu yêu thích sẽ hiển thị tại đây.
                </p>
                <Link href="/" className="text-sm font-semibold text-green-600 hover:underline">
                    Khám phá phòng ngay →
                </Link>
            </div>
        </div>
    );
}
