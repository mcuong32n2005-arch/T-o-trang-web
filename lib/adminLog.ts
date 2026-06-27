import { getDb } from "@/lib/mongodb";

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

// Tạo 1 thông báo nội bộ cho admin (booking mới, hủy, thanh toán, review mới...)
export async function createNotification(params: {
  type: "new_booking" | "cancel_booking" | "payment" | "new_review";
  message: string;
  relatedId?: string;
}) {
  try {
    const db = await getDb();
    await db.collection("notifications").insertOne({
      type: params.type,
      message: params.message,
      relatedId: params.relatedId || "",
      isRead: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Lỗi tạo thông báo:", error);
  }
}
