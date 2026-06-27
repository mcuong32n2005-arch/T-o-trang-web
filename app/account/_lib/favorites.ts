"use client";

// ─── Helper dùng chung để quản lý phòng yêu thích ───────────────────────────
// Gọi API thật /api/favorites, lưu theo userId trong MongoDB — mỗi tài khoản
// có danh sách yêu thích riêng (KHÔNG còn dùng localStorage như bản cũ, vì
// localStorage là chung cho cả trình duyệt, mọi tài khoản đăng nhập trên cùng
// máy sẽ thấy chung 1 danh sách — đây chính là lỗi cần sửa).

export interface FavoriteRoom {
    id: string;
    code: string;
    name: string;
    price: number;
    image?: string;
    address?: string;
}

// Lấy toàn bộ danh sách yêu thích của user hiện tại từ server.
export async function getFavorites(): Promise<FavoriteRoom[]> {
    try {
        const res = await fetch("/api/favorites", { cache: "no-store" });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    } catch {
        return [];
    }
}

// Kiểm tra 1 phòng có đang được yêu thích không. Vì cần gọi API, hàm này là
// async — nơi gọi cần `await` hoặc dùng cùng với getFavorites() đã tải sẵn.
export async function isFavorite(roomId: string): Promise<boolean> {
    const favorites = await getFavorites();
    return favorites.some((f) => f.id === roomId);
}

// Thêm 1 phòng vào yêu thích.
export async function addFavorite(room: FavoriteRoom): Promise<boolean> {
    try {
        const res = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                roomId: room.id,
                code: room.code,
                name: room.name,
                price: room.price,
                image: room.image,
                address: room.address,
            }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

// Bỏ yêu thích 1 phòng.
export async function removeFavorite(roomId: string): Promise<boolean> {
    try {
        const res = await fetch(`/api/favorites/${roomId}`, { method: "DELETE" });
        return res.ok;
    } catch {
        return false;
    }
}

// Bật/tắt yêu thích — kiểm tra trạng thái hiện tại rồi gọi add hoặc remove
// tương ứng. Trả về true nếu sau khi bấm phòng đang ở trạng thái "đã yêu
// thích", false nếu vừa bị bỏ yêu thích.
export async function toggleFavorite(room: FavoriteRoom): Promise<boolean> {
    const currentlyFavorited = await isFavorite(room.id);
    if (currentlyFavorited) {
        await removeFavorite(room.id);
        return false;
    } else {
        await addFavorite(room);
        return true;
    }
}
