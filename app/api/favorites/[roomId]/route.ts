import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/requireAdmin";

// DELETE: Bỏ yêu thích 1 phòng của user hiện tại
export async function DELETE(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: "Bạn cần đăng nhập để thực hiện thao tác này." }, { status: 401 });
    }

    try {
        const { roomId } = await params;
        const db = await getDb();

        await db.collection("favorites").deleteOne({
            userId: session.userId,
            roomId,
        });

        return NextResponse.json({ message: "Đã bỏ yêu thích." });
    } catch (error) {
        console.error("Lỗi xoá favorite:", error);
        return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
    }
}
