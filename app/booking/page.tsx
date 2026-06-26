import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/mongodb";
import BookingPageClient from "./BookingPageClient";

async function getRooms() {
    const db = await getDb();
    const rooms = await db.collection("rooms").find().sort({ createdAt: -1 }).toArray();
    return rooms.map((r) => ({
        ...JSON.parse(JSON.stringify(r)),
        id: r._id.toString(),
        _id: undefined,
    }));
}

export default async function BookingPage() {
    // Lấy session từ Clerk — không redirect, chỉ lấy thông tin để truyền xuống client
    const { userId, sessionClaims } = await auth();
    const role = sessionClaims?.metadata?.role ?? null;

    const rooms = await getRooms();

    return (
        <BookingPageClient
            initialRooms={rooms}
            isLoggedIn={!!userId}
            userRole={role}
        />
    );
}
