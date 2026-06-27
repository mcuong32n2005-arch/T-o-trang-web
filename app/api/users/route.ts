import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/requireAdmin";

// GET: lấy danh sách user từ Clerk (chỉ admin)
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit")) || 100;

    const client = await clerkClient();
    const { data } = await client.users.getUserList({ limit });

    const users = data.map((u) => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "(chưa đặt tên)",
      email: u.emailAddresses[0]?.emailAddress || "",
      role: (u.publicMetadata?.role as string) || "customer",
      isBanned: u.banned,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("Lỗi lấy danh sách người dùng:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
