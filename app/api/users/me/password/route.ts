import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// PUT: đổi mật khẩu — yêu cầu nhập đúng mật khẩu hiện tại
export async function PUT(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session) {
        return NextResponse.json({ message: "Bạn cần đăng nhập." }, { status: 401 });
    }

    try {
        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới." },
                { status: 400 }
            );
        }
        if (newPassword.length < 6) {
            return NextResponse.json(
                { message: "Mật khẩu mới phải có ít nhất 6 ký tự." },
                { status: 400 }
            );
        }

        await connectToDatabase();
        const user = await User.findOne({ username: session.username });
        if (!user) {
            return NextResponse.json({ message: "Không tìm thấy tài khoản." }, { status: 404 });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ message: "Mật khẩu hiện tại không đúng." }, { status: 400 });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        await user.save();

        return NextResponse.json({ message: "Đã đổi mật khẩu thành công." });
    } catch (error) {
        console.error("Lỗi đổi mật khẩu:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}
