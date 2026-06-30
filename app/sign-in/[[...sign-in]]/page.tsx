import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 antialiased">
            <Link
                href="/"
                className="absolute top-8 left-8 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-teal-700 transition-colors"
            >
                ← Trở về trang chủ
            </Link>

            <div className="text-center space-y-2 mb-6">
                <Link
                    href="/"
                    className="text-xl font-black tracking-wider uppercase text-teal-700"
                >
                    BẢO AN HOMESTAY
                </Link>
                <p className="text-xs text-gray-400 font-medium">
                    Truy cập nền tảng quản lý chuỗi chỗ nghỉ tại Thái Nguyên
                </p>
            </div>

            <SignIn
                appearance={{
                    variables: {
                        fontFamily: "var(--font-geist-sans), sans-serif",
                    },
                    elements: {
                        card: "shadow-md border border-gray-200 rounded-2xl",
                        formButtonPrimary:
                            "bg-teal-700 hover:bg-teal-800 text-xs uppercase tracking-widest",
                        footerActionLink: "text-teal-700 hover:underline",
                    },
                }}
                // Sau khi đăng nhập thành công, Clerk sẽ chuyển đến đây.
                // Việc phân nhánh admin -> /dashboard, user -> /booking
                // được middleware xử lý dựa trên publicMetadata.role.
                fallbackRedirectUrl="/booking"
                signUpUrl="/sign-up"
            />
        </div>
    );
}