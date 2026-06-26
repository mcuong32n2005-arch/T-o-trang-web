import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/requireAdmin";

// POST: Khách hàng đặt phòng
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ message: "Bạn cần đăng nhập để đặt phòng." }, { status: 401 });
        }

        const body = await request.json();
        const { roomId, roomName, roomCode, checkIn, checkOut, guestName, guestPhone, guestNote, price } = body;

        if (!roomId || !checkIn || !checkOut || !guestName || !guestPhone) {
            return NextResponse.json({ message: "Vui lòng điền đầy đủ thông tin đặt phòng." }, { status: 400 });
        }

        // Tính số đêm
        const inDate = new Date(checkIn);
        const outDate = new Date(checkOut);
        const nights = Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));

        if (nights <= 0) {
            return NextResponse.json({ message: "Ngày trả phòng phải sau ngày nhận phòng." }, { status: 400 });
        }

        const db = await getDb();

        // Lưu booking — gắn với userId của Clerk thay cho username cũ
        const result = await db.collection("bookings").insertOne({
            roomId,
            roomName,
            roomCode,
            checkIn: inDate,
            checkOut: outDate,
            nights,
            totalPrice: price * nights,
            pricePerNight: price,
            guestName,
            guestPhone,
            guestNote: guestNote || "",
            bookedBy: session.userId,
            status: "pending", // pending | confirmed | cancelled
            createdAt: new Date(),
        });

        // Upsert thông tin khách hàng vào collection customers
        await db.collection("customers").updateOne(
            { phone: guestPhone },
            {
                $set: {
                    name: guestName,
                    phone: guestPhone,
                    status: "Đang lưu trú",
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    email: "",
                    address: "",
                    note: "",
                    createdAt: new Date(),
                },
            },
            { upsert: true }
        );

        return NextResponse.json(
            { message: "Đặt phòng thành công!", bookingId: result.insertedId.toString(), nights },
            { status: 201 }
        );
    } catch (error) {
        console.error("Lỗi đặt phòng:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}

// GET: Lấy danh sách booking của user hiện tại
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
        }

        const db = await getDb();
        const bookings = await db
            .collection("bookings")
            .find({ bookedBy: session.userId })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json(
            {
                data: bookings.map((b) => ({ ...b, id: b._id.toString(), _id: undefined })),
            },
            {
                headers: {
                    // Đảm bảo response GET không bị cache (theo URL) ở bất kỳ tầng nào
                    // (browser, CDN, proxy) — vì dữ liệu phụ thuộc vào session/cookie
                    // của từng người dùng, không phải vào URL.
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                },
            }
        );
    } catch (error) {
        console.error("Lỗi lấy bookings:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}
