import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

// GET: đọc 1 file ảnh đã upload trong thư mục uploads/rooms (ngoài public/)
// và trả về cho trình duyệt, kèm Content-Type đúng định dạng.
// Ảnh public/homestay/rooms cũ (nếu còn) vẫn được Next.js serve trực tiếp
// như static asset bình thường, không qua route này.

const MIME_TYPES: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    // Chặn path traversal — chỉ cho phép tên file đơn giản, không cho dấu "/" hay ".."
    if (!filename || filename.includes("/") || filename.includes("..")) {
        return NextResponse.json({ message: "Tên file không hợp lệ." }, { status: 400 });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeType = MIME_TYPES[ext];
    if (!mimeType) {
        return NextResponse.json({ message: "Định dạng file không được hỗ trợ." }, { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), "uploads", "rooms", filename);
        const fileBuffer = await readFile(filePath);

        return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                "Content-Type": mimeType,
                // Cache 1 năm — tên file đã random nên không lo cache ảnh cũ sai
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch {
        return NextResponse.json({ message: "Không tìm thấy ảnh." }, { status: 404 });
    }
}
