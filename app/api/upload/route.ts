import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/requireAdmin";

// POST: nhận 1 file ảnh, lưu vào public/uploads/rooms, trả về URL để lưu vào room.images
export async function POST(request: Request) {
    const admin = await requireAdmin();
    if (!admin) {
        return NextResponse.json(
            { message: "Bạn cần đăng nhập với quyền admin để thực hiện việc này." },
            { status: 401 }
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ message: "Vui lòng chọn ảnh để tải lên." }, { status: 400 });
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { message: "Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP." },
                { status: 400 }
            );
        }

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ message: "Ảnh không được vượt quá 5MB." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Đặt tên file ngẫu nhiên để tránh trùng / đè ảnh cũ
        const ext = path.extname(file.name) || ".jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

        const uploadDir = path.join(process.cwd(), "public", "uploads", "rooms");
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, fileName), buffer);

        const url = `/uploads/rooms/${fileName}`;

        return NextResponse.json({ message: "Tải ảnh lên thành công.", url });
    } catch (error) {
        console.error("Lỗi tải ảnh lên:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}
