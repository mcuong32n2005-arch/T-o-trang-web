import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

const ALLOWED_ROLES = ["admin", "manager", "staff", "customer"];

// PUT: đổi role hoặc khoá/mở khoá (ban/unban) 1 user — chỉ admin
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const client = await clerkClient();

    if (typeof body.role === "string") {
      if (!ALLOWED_ROLES.includes(body.role)) {
        return NextResponse.json({ message: "Vai trò không hợp lệ." }, { status: 400 });
      }
      await client.users.updateUserMetadata(id, {
        publicMetadata: { role: body.role },
      });
      await logAction({ actorId: admin.userId, action: `Đã đổi vai trò người dùng thành ${body.role}`, target: id });
    }

    if (typeof body.isBanned === "boolean") {
      if (body.isBanned) {
        await client.users.banUser(id);
      } else {
        await client.users.unbanUser(id);
      }
      await logAction({
        actorId: admin.userId,
        action: body.isBanned ? "Đã khoá người dùng" : "Đã mở khoá người dùng",
        target: id,
      });
    }

    return NextResponse.json({ message: "Đã cập nhật người dùng." });
  } catch (error) {
    console.error("Lỗi cập nhật người dùng:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// DELETE: xoá tài khoản user — chỉ admin
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  const { id } = await params;

  // Chặn admin tự xoá chính mình để tránh mất quyền truy cập hệ thống
  if (id === admin.userId) {
    return NextResponse.json({ message: "Bạn không thể tự xoá tài khoản của chính mình." }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(id);

    await logAction({ actorId: admin.userId, action: "Đã xoá người dùng", target: id });

    return NextResponse.json({ message: "Đã xoá người dùng." });
  } catch (error) {
    console.error("Lỗi xoá người dùng:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
