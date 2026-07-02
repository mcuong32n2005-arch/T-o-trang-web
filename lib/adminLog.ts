import { getDb } from "@/lib/mongodb";
import type { NotificationType } from "@/lib/types";

// Ghi 1 dòng nhật ký hệ thống mỗi khi admin thực hiện thao tác quan trọng
// (thêm/sửa/xoá). Gọi sau khi thao tác chính đã thành công.
// Không throw lỗi ra ngoài nếu ghi log thất bại — tránh làm hỏng request chính.
export async function logAction(params: {
  actorId: string;
  actorName?: string;
  action: string; // ví dụ: "Đã xoá Homestay", "Đổi giá phòng"
  target?: string; // ví dụ: tên/ID đối tượng bị tác động
}) {
  try {
    const db = await getDb();
    await db.collection("logs").insertOne({
      actorId: params.actorId,
      actorName: params.actorName || "",
      action: params.action,
      target: params.target || "",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Lỗi ghi nhật ký hệ thống:", error);
  }
}

// Tạo 1 thông báo. Có 2 chế độ:
// - Không truyền recipientId  -> thông báo nội bộ dùng chung cho ADMIN (hành vi cũ, không đổi).
// - Có truyền recipientId     -> thông báo riêng cho 1 KHÁCH HÀNG cụ thể (theo userId của Clerk),
//                                 chỉ khách đó thấy khi gọi GET /api/notifications.
export async function createNotification(params: {
  type: NotificationType;
  message: string;
  relatedId?: string;
  recipientId?: string;
}) {
  try {
    const db = await getDb();
    await db.collection("notifications").insertOne({
      type: params.type,
      message: params.message,
      relatedId: params.relatedId || "",
      recipientId: params.recipientId || null,
      isRead: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Lỗi tạo thông báo:", error);
  }
}
