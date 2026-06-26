// Script này import dữ liệu phòng cũ (đang nằm trong data/rooms.json) vào MongoDB,
// Script này import dữ liệu phòng cũ (đang nằm trong data/rooms.json) vào MongoDB,
// để dashboard admin và trang chủ mới có dữ liệu sẵn ngay sau khi chuyển qua dùng database thật.
// Chỉ cần chạy 1 LẦN DUY NHẤT sau khi đã cấu hình MONGODB_URI.
//
// Cách dùng (chạy trong thư mục gốc dự án):
//   node scripts/import-rooms.mjs

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Không tìm thấy MONGODB_URI trong .env.local");
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), "data/rooms.json");
  if (!fs.existsSync(filePath)) {
    console.error("❌ Không tìm thấy file data/rooms.json để import.");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const rooms = raw.data || raw;

  if (!Array.isArray(rooms) || rooms.length === 0) {
    console.log("ℹ️  Không có dữ liệu phòng nào để import.");
    process.exit(0);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "bao_an_homestay");

  // Bỏ field "id" cũ (string tự đặt) để MongoDB tự sinh _id mới, tránh trùng lặp
  const docs = rooms.map((r) => {
    const { id, ...rest } = r;
    return { ...rest, createdAt: new Date() };
  });

  const result = await db.collection("rooms").insertMany(docs);
  console.log(`✅ Đã import ${result.insertedCount} phòng vào MongoDB (collection "rooms").`);

  await client.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Lỗi import:", err);
  process.exit(1);
});
