import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
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
                    Khởi tạo tài khoản thành viên chuỗi chỗ nghỉ tại Thái Nguyên
                </p>
            </div>

            <SignUp
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
                // Người dùng mới đăng ký sẽ không có publicMetadata.role
                // -> middleware coi như "user" thường, không vào được /dashboard
                fallbackRedirectUrl="/booking"
                signInUrl="/sign-in"
            />
        </div>
    );
}