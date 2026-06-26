import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import UserProfile from "@/models/User";

// GET: lấy thông tin hồ sơ cá nhân của user đang đăng nhập
// (tên, email hiển thị từ Clerk + hồ sơ bổ sung từ MongoDB)
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ message: "Bạn cần đăng nhập." }, { status: 401 });
    }

    try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);

        await connectToDatabase();
        let profile = await UserProfile.findOne({ clerkId: userId });

        // Nếu user chưa có hồ sơ bổ sung nào (lần đầu vào trang Profile) -> tạo rỗng
        if (!profile) {
            profile = await UserProfile.create({ clerkId: userId });
        }

        return NextResponse.json({
            data: {
                // Lấy từ Clerk — chỉ đọc, sửa qua nút tài khoản (UserButton)
                email: clerkUser.emailAddresses[0]?.emailAddress || "",
                imageUrl: clerkUser.imageUrl,
                displayName:
                    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
                    clerkUser.username ||
                    "",

                // Hồ sơ bổ sung — sửa trực tiếp trong trang Profile
                name: profile.name || "",
                phone: profile.phone || "",
                dob: profile.dob || "",
                avatarColor: profile.avatarColor || "#16a34a",
                cccdImageUrl: profile.cccdImageUrl || "",
            },
        });
    } catch (error) {
        console.error("Lỗi lấy thông tin user:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}

// PUT: cập nhật hồ sơ bổ sung (name, phone, dob, cccdImageUrl)
// Đổi mật khẩu / email / avatar chính: dùng UserButton của Clerk, không qua API này.
export async function PUT(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ message: "Bạn cần đăng nhập." }, { status: 401 });
    }

    try {
        const body = await request.json();
        const allowedFields = ["name", "phone", "dob", "cccdImageUrl"];
        const update: Record<string, string> = {};

        for (const field of allowedFields) {
            if (typeof body[field] === "string") {
                update[field] = body[field].trim();
            }
        }

        // Validate ngày sinh nếu có nhập — tránh lưu chuỗi không phải ngày hợp lệ
        if (update.dob && Number.isNaN(new Date(update.dob).getTime())) {
            return NextResponse.json({ message: "Ngày sinh không hợp lệ." }, { status: 400 });
        }

        await connectToDatabase();
        await UserProfile.updateOne(
            { clerkId: userId },
            { $set: update },
            { upsert: true }
        );

        return NextResponse.json({ message: "Đã cập nhật thông tin tài khoản." });
    } catch (error) {
        console.error("Lỗi cập nhật user:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}

// DELETE: xoá tài khoản Clerk của chính mình (xoá luôn hồ sơ bổ sung trong MongoDB)
export async function DELETE() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ message: "Bạn cần đăng nhập." }, { status: 401 });
    }

    try {
        const client = await clerkClient();
        await client.users.deleteUser(userId);

        await connectToDatabase();
        await UserProfile.deleteOne({ clerkId: userId });

        return NextResponse.json({ message: "Đã xoá tài khoản." });
    } catch (error) {
        console.error("Lỗi xoá user:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}
