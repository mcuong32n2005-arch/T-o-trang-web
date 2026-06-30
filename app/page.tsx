import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/mongodb";
import HomePageClient from "./HomePageClient";

// Luôn lấy dữ liệu phòng mới nhất, không cache route này — tránh tình trạng
// trang chủ hiện dữ liệu/ảnh cũ do Next.js Router Cache khi điều hướng
// bằng <Link> giữa các trang.
export const dynamic = "force-dynamic";

async function getRooms() {
  const db = await getDb();
  const rooms = await db.collection("rooms").find().sort({ createdAt: -1 }).toArray();
  return rooms.map((r) => ({
    ...JSON.parse(JSON.stringify(r)),
    id: r._id.toString(),
    _id: undefined,
  }));
}

export default async function HomePage() {
  // Lấy session từ Clerk — không redirect, chỉ lấy thông tin để truyền xuống client
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role ?? null;

  const rooms = await getRooms();

  return (
      <HomePageClient
          initialRooms={rooms}
          isLoggedIn={!!userId}
          userRole={role}
      />
  );
}
