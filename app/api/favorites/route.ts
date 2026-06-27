import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/requireAdmin";

// GET: Lấy danh sách phòng yêu thích của user hiện tại
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
        }

        const db = await getDb();
        const favorites = await db
            .collection("favorites")
            .find({ userId: session.userId })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json(
            {
                data: favorites.map((f) => ({
                    id: f.roomId,
                    code: f.code,
                    name: f.name,
                    price: f.price,
                    image: f.image,
                    address: f.address,
                })),
            },
            {
                headers: {
                    // Dữ liệu phụ thuộc vào session/cookie của từng người dùng,
                    // không được cache theo URL ở bất kỳ tầng nào.
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                },
            }
        );
    } catch (error) {
        console.error("Lỗi lấy favorites:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}

// POST: Thêm 1 phòng vào danh sách yêu thích của user hiện tại
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ message: "Bạn cần đăng nhập để lưu phòng yêu thích." }, { status: 401 });
        }

        const body = await request.json();
        const { roomId, code, name, price, image, address } = body;

        if (!roomId) {
            return NextResponse.json({ message: "Thiếu thông tin phòng." }, { status: 400 });
        }

        const db = await getDb();

        // Upsert — nếu đã yêu thích trước đó (vd: bấm 2 lần do lag) thì không tạo trùng
        await db.collection("favorites").updateOne(
            { userId: session.userId, roomId },
            {
                $set: { userId: session.userId, roomId, code, name, price, image, address },
                $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
        );

        return NextResponse.json({ message: "Đã thêm vào yêu thích." }, { status: 201 });
    } catch (error) {
        console.error("Lỗi thêm favorite:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}
