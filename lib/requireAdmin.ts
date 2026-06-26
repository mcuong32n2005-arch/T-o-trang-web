import { auth } from "@clerk/nextjs/server";
import type { Roles } from "@/types/globals";

// Kiểm tra người gọi có phải admin không (dựa vào Clerk publicMetadata.role).
// Trả về userId nếu hợp lệ VÀ có role="admin", ngược lại trả null.
// Dùng trong Server Component / Route Handler khi cần tự xử lý thông báo lỗi
// (middleware đã chặn ở tầng route, đây là lớp kiểm tra bổ sung/tại chỗ).
export async function requireAdmin(): Promise<{ userId: string } | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const role = sessionClaims?.metadata?.role;
  if (role !== "admin") return null;

  return { userId };
}

// Kiểm tra role bất kỳ, dùng lại được cho các role khác nếu sau này mở rộng
export async function checkRole(role: Roles): Promise<boolean> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === role;
}

// Lấy session của bất kỳ người dùng đã đăng nhập (admin hoặc user)
export async function getSession() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  return { userId, role: sessionClaims?.metadata?.role };
}
