// Đích: lib/roomStatus.ts (thay thế file cũ nếu đã tạo trước đó)
//
// Nơi DUY NHẤT định nghĩa các giá trị trạng thái phòng đúng như trong dropdown
// "Trạng thái" ở form sửa phòng (trang Quản lý phòng): Trống, Đã đặt, Đang ở,
// Đang vệ sinh, Bảo trì. Mọi nơi khác (API booking đồng bộ phòng, giao diện
// khách hàng) import từ đây thay vì tự gõ lại chuỗi tiếng Việt, để chỉ cần sửa
// 1 chỗ nếu sau này đổi nhãn.

export const ROOM_STATUS = {
    AVAILABLE: "Trống",
    BOOKED: "Đã đặt",
    OCCUPIED: "Đang ở",
    CLEANING: "Đang vệ sinh",
    MAINTENANCE: "Bảo trì",
} as const;

export type RoomStatus = (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS];

// Các giá trị status "cũ" đã từng được dùng trước khi chuẩn hoá về đúng 5 nhãn
// tiếng Việt ở trên (vd data cũ trong DB tạo trước ngày đổi sang ROOM_STATUS).
// Giữ lại để KHÔNG làm hỏng dữ liệu phòng đã có sẵn — coi các giá trị này tương
// đương với "Trống" / "Đang ở" cho tới khi phòng được lưu lại lần nữa (khi đó
// normalizeRoomStatus sẽ tự quy về đúng nhãn chuẩn tiếng Việt).
const LEGACY_AVAILABLE_ALIASES = ["available", "AVAILABLE", "Sẵn sàng", "Còn trống", "Còn phòng"];
const LEGACY_OCCUPIED_ALIASES = ["occupied", "OCCUPIED", "Hết phòng", "Đang sử dụng", "Đã đặt trước"];

// 3 trạng thái do HỆ THỐNG BOOKING tự động điều khiển (xác nhận/check-in/check-out/huỷ).
// "Đang vệ sinh" và "Bảo trì" là do admin tự tay đặt để khoá phòng thủ công — hệ
// thống booking sẽ KHÔNG BAO GIỜ tự động ghi đè 2 trạng thái này. Bao gồm cả các
// alias cũ để những phòng chưa từng được lưu lại (chưa migrate) vẫn được đồng bộ
// bình thường thay vì bị coi nhầm là "đang khoá thủ công".
export const AUTO_MANAGED_ROOM_STATUSES: (string | null | undefined)[] = [
    ROOM_STATUS.AVAILABLE,
    ROOM_STATUS.BOOKED,
    ROOM_STATUS.OCCUPIED,
    ...LEGACY_AVAILABLE_ALIASES,
    ...LEGACY_OCCUPIED_ALIASES,
    "",
    null,
    undefined,
];

const ALL_VALID_STATUSES: string[] = Object.values(ROOM_STATUS);

/**
 * Chuẩn hoá giá trị status gửi lên từ form sửa phòng. Nếu là 1 trong 5 giá trị
 * hợp lệ thì giữ nguyên; nếu là alias cũ thì quy về "Trống"/"Đang ở" tương ứng để
 * tự "chữa" dữ liệu cũ ngay khi admin lưu lại; nếu rỗng/không hợp lệ thì mặc định "Trống".
 */
export function normalizeRoomStatus(raw: unknown): string {
    if (typeof raw !== "string" || raw.trim() === "") return ROOM_STATUS.AVAILABLE;
    const value = raw.trim();
    if (ALL_VALID_STATUSES.includes(value)) return value;
    if (LEGACY_AVAILABLE_ALIASES.includes(value)) return ROOM_STATUS.AVAILABLE;
    if (LEGACY_OCCUPIED_ALIASES.includes(value)) return ROOM_STATUS.OCCUPIED;
    return ROOM_STATUS.AVAILABLE;
}

/** Dùng ở giao diện khách hàng để quyết định hiện badge "Hết phòng" hay không.
 * Phòng coi là còn trống khi status = "Trống", rỗng/chưa có (phòng mới tạo), hoặc
 * là 1 trong các alias cũ tương đương "available" — để không phá hiển thị của các
 * phòng đã tạo trước khi hệ thống chuyển sang dùng đúng 5 nhãn tiếng Việt. */
export function isRoomAvailable(status: unknown): boolean {
    if (status === null || status === undefined || status === "") return true;
    if (status === ROOM_STATUS.AVAILABLE) return true;
    return typeof status === "string" && LEGACY_AVAILABLE_ALIASES.includes(status);
}