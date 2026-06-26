import { SignJWT, jwtVerify } from "jose";

// Tên cookie lưu phiên đăng nhập
export const SESSION_COOKIE_NAME = "admin_session";

const secretValue = process.env.JWT_SECRET || "doi-chuoi-bi-mat-nay-trong-env-local";
const JWT_SECRET = new TextEncoder().encode(secretValue);

export interface AdminSessionPayload {
  username: string;
  role: "admin" | "user";
}

// Tạo token đăng nhập, hạn dùng 7 ngày
export async function createSessionToken(payload: AdminSessionPayload) {
  return await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);
}

// Xác thực token, trả về null nếu không hợp lệ hoặc đã hết hạn
export async function verifySessionToken(
    token: string
): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (typeof payload.username !== "string") return null;
    if (payload.role !== "admin" && payload.role !== "user") return null;
    return { username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}