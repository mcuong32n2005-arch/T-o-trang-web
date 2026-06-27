// Type khai báo role lưu trong Clerk publicMetadata.
// File này khớp với cách dùng trong lib/requireAdmin.ts (sessionClaims?.metadata?.role).
export type Roles = "admin" | "manager" | "staff" | "customer";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
    };
  }
}
