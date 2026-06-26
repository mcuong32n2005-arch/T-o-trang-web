import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

async function handleLogout(request: Request) {
    const cookieStore = await cookies();

    // Xóa cookie session
    cookieStore.delete(SESSION_COOKIE_NAME);

    // Redirect về trang chủ, dùng URL tuyệt đối để tránh lỗi trên server
    return NextResponse.redirect(new URL("/", request.url));
}

export async function GET(request: Request) {
    return handleLogout(request);
}

export async function POST(request: Request) {
    return handleLogout(request);
}
