// Script này dùng để TẠO hoặc ĐỔI MẬT KHẨU tài khoản admin trực tiếp trong MongoDB.
// Không có API công khai nào để tạo tài khoản admin — phải chạy script này từ máy của bạn,
// như vậy không ai khác có thể tự tạo tài khoản admin qua web được.
//
// Cách dùng (chạy trong thư mục gốc dự án, đã cài "mongodb", "bcryptjs", "dotenv"):
//   node scripts/create-admin.mjs <username> <password>
//
// Ví dụ:
//   node scripts/create-admin.mjs admin MatKhauCuaBan123

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

async function main() {
  const [, , usernameArg, passwordArg] = process.argv;
  const username = usernameArg || "admin";
  const password = passwordArg;

  if (!password) {
    console.error("❌ Cách dùng: node scripts/create-admin.mjs <username> <password>");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Không tìm thấy MONGODB_URI. Hãy chắc chắn file .env.local đã khai báo biến này.");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "bao_an_homestay");

  const existing = await db.collection("admins").findOne({ username });
  if (existing) {
    console.log(`ℹ️  Tài khoản "${username}" đã tồn tại — sẽ cập nhật lại mật khẩu mới.`);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.collection("admins").updateOne(
    { username },
    {
      $set: { username, passwordHash, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  console.log(`✅ Đã tạo/cập nhật tài khoản admin "${username}" thành công. Giờ có thể đăng nhập tại /login.`);

  await client.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});
