import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Route public — không cần đăng nhập
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/booking(.*)",
  "/rooms(.*)",          // xem danh sách & chi tiết phòng — khách không cần đăng nhập
  "/search(.*)",
  "/contact",
  "/faq",
  "/privacy",
  "/payment-policy",
  "/terms",
  "/marketplace-rules",
  "/complaints",
  "/host",
  "/payment-guide",
  "/api/rooms(.*)",      // GET danh sách/chi tiết phòng công khai (route.ts đã tự chặn POST/PUT/DELETE)
  "/api/uploads(.*)",    // GET ảnh đã upload (phòng, cơ sở...) — ảnh công khai, ai cũng xem được, không cần đăng nhập
  "/api/bookings(.*)",   // route handler tự kiểm tra đăng nhập và trả 401 đúng ý — không để middleware chặn cứng ở đây
  "/api/favorites(.*)",  // route handler tự kiểm tra đăng nhập và trả 401 JSON — tránh middleware redirect HTML chậm sang /sign-in khi khách chưa đăng nhập bấm tim trên nhiều card phòng cùng lúc
  "/api/settings(.*)",   // GET cài đặt hệ thống (logo, mạng xã hội...) hiển thị công khai ở trang chủ — khách chưa đăng nhập cũng cần đọc được
]);

// Route chỉ admin (publicMetadata.role === "admin") mới được vào
const isAdminRoute = createRouteMatcher(["/dashboard(.*)", "/api/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;

  // Chặn route admin nếu chưa đăng nhập hoặc không có role admin
  if (isAdminRoute(req)) {
    if (role !== "admin") {
      // Chưa đăng nhập -> đẩy về trang sign-in; đã đăng nhập nhưng không phải admin -> đẩy về trang chủ
      const url = new URL(role ? "/" : "/sign-in", req.url);
      return NextResponse.redirect(url);
    }
    return;
  }

  // Các route còn lại (không public) yêu cầu đăng nhập, không cần là admin
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Bỏ qua file tĩnh và Next.js internal, trừ khi có trong query params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Luôn chạy cho API routes
    "/(api|trpc)(.*)",
  ],
};