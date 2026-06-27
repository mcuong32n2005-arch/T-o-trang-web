// Các type dùng chung cho khu vực /dashboard (admin).
// Đặt tại đây để page.tsx và route.ts dùng lại, tránh lệch field giữa nơi đọc và nơi viết.

export type BookingStatus = "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled";
export type PaymentStatus = "unpaid" | "deposited" | "paid" | "refunded";
export type RoomStatus = "available" | "booked" | "occupied" | "cleaning" | "maintenance";

export interface Homestay {
  id: string;
  name: string;
  description?: string;
  address: string;
  area?: number; // diện tích (m2)
  maxGuests?: number;
  amenities?: string[]; // id tiện ích, tham chiếu collection amenities
  ownerName?: string;
  images?: string[];
  videos?: string[];
  model3dUrl?: string;
  isHidden?: boolean; // ẩn/hiện trên trang khách xem
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit?: string; // ví dụ "lần", "ngày", "người"
  description?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string; // emoji hoặc tên icon
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  expiresAt: string;
  usageLimit?: number;
  usedCount?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface Review {
  id: string;
  roomId?: string;
  homestayId?: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  reply?: string;
  isApproved: boolean;
  isSpam?: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  guestName: string;
  roomAmount: number;
  serviceAmount: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: PaymentStatus;
  method?: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  type: "contact" | "feedback" | "complaint";
  name: string;
  email?: string;
  phone?: string;
  content: string;
  reply?: string;
  isResolved: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: "new_booking" | "cancel_booking" | "payment" | "new_review";
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  target?: string;
  createdAt: string;
}

export interface SystemSettings {
  logoUrl?: string;
  bannerUrl?: string;
  contactEmail?: string;
  hotline?: string;
  address?: string;
  policy?: string;
  terms?: string;
  socials?: { facebook?: string; zalo?: string; instagram?: string };
}
