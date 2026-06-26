import mongoose from "mongoose";

// Model này giờ CHỈ lưu hồ sơ cá nhân bổ sung (không lưu mật khẩu/role nữa —
// việc đó Clerk đã quản lý). Mỗi document được liên kết với 1 user Clerk
// qua trường clerkId (chính là userId trả về từ auth() bên Clerk).
const UserProfileSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true,
    },

    // ─── Thông tin hồ sơ cá nhân ───
    name: {
        type: String,
        default: "",
    },
    email: {
        type: String,
        default: "",
    },
    phone: {
        type: String,
        default: "",
    },
    dob: {
        // Lưu dạng "YYYY-MM-DD", để trống nếu chưa khai báo (tránh hiện "Invalid date")
        type: String,
        default: "",
    },
    avatarColor: {
        // Màu nền avatar tròn hiển thị chữ cái đầu, sinh ngẫu nhiên lúc tạo hồ sơ
        type: String,
        default: "#16a34a",
    },
    cccdImageUrl: {
        type: String,
        default: "",
    },
}, {
    timestamps: true, // tự thêm createdAt, updatedAt
});

export default mongoose.models.UserProfile ||
mongoose.model("UserProfile", UserProfileSchema);
