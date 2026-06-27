import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

// GET: tổng hợp toàn bộ ảnh đang được gắn vào rooms + homestays,
// để admin xem nhanh & biết ảnh nào thuộc đối tượng nào.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const db = await getDb();
    const [rooms, homestays] = await Promise.all([
      db.collection("rooms").find({}, { projection: { images: 1, name: 1, code: 1 } }).toArray(),
      db.collection("homestays").find({}, { projection: { images: 1, name: 1 } }).toArray(),
    ]);

    const media: { url: string; source: string; label: string }[] = [];

    rooms.forEach((r) => {
      (r.images || []).forEach((url: string) => {
        media.push({ url, source: "room", label: `${r.name} (${r.code})` });
      });
    });

    homestays.forEach((h) => {
      (h.images || []).forEach((url: string) => {
        media.push({ url, source: "homestay", label: h.name });
      });
    });

    return NextResponse.json({ data: media });
  } catch (error) {
    console.error("Lỗi lấy danh sách media:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
