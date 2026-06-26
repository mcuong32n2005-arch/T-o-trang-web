import { getDb } from "@/lib/mongodb";
import RoomsPageClient from "./RoomsPageClient";

async function getRooms() {
  const db = await getDb();
  const rooms = await db.collection("rooms").find().sort({ createdAt: -1 }).toArray();
  return rooms.map((r) => ({
    ...JSON.parse(JSON.stringify(r)),
    id: r._id.toString(),
    _id: undefined,
  }));
}

export default async function RoomsPage() {
  const rooms = await getRooms();

  return <RoomsPageClient initialRooms={rooms} />;
}
