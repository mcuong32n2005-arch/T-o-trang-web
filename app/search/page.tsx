import { getDb } from "@/lib/mongodb";
import SearchPageClient from "./SearchPageClient";

async function getRooms() {
  const db = await getDb();
  const rooms = await db.collection("rooms").find().sort({ createdAt: -1 }).toArray();
  return rooms.map((r) => ({
    ...JSON.parse(JSON.stringify(r)),
    id: r._id.toString(),
    _id: undefined,
  }));
}

export default async function SearchPage() {
  const rooms = await getRooms();

  return <SearchPageClient initialRooms={rooms} />;
}
