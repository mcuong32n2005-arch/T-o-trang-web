import mongoose from "mongoose";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
      "Thiếu biến môi trường MONGODB_URI. Hãy khai báo trong file .env.local ở thư mục gốc dự án."
  );
}

// Lưu ý: KHÔNG truyền dbName riêng ở đây — để Mongoose và MongoClient cùng dùng
// đúng tên database "homestay" đã có sẵn trong MONGODB_URI (.../homestay?...).
// Nếu đặt dbName khác đi, User sẽ bị lưu vào 1 database khác với database
// chứa dữ liệu "rooms" của trang chủ, gây ra hiện tượng tưởng chạy được nhưng
// thật ra hai phần dữ liệu nằm ở 2 nơi khác nhau.

// Next.js có thể load lại module này nhiều lần khi dev (hot-reload),
// nên ta lưu các kết nối vào biến global để tránh tạo quá nhiều kết nối tới MongoDB.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// ----------------------------------------------------------------------------
// 1. KẾT NỐI MONGOOSE — dùng cho các Model (ví dụ models/User.ts)
// ----------------------------------------------------------------------------
let mongooseConnectionPromise: Promise<typeof mongoose>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongooseConnectionPromise) {
    global._mongooseConnectionPromise = mongoose.connect(uri);
  }
  mongooseConnectionPromise = global._mongooseConnectionPromise;
} else {
  mongooseConnectionPromise = mongoose.connect(uri);
}

// Export default dạng HÀM để các route.ts gọi connectToDatabase() như cũ
export default async function connectToDatabase() {
  return mongooseConnectionPromise;
}

// ----------------------------------------------------------------------------
// 2. KẾT NỐI MONGOCLIENT GỐC — dùng cho truy vấn collection trực tiếp
//    (ví dụ trang chủ lấy danh sách "rooms" qua getDb())
// ----------------------------------------------------------------------------
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() {
  const client = await clientPromise;
  return client.db(); // không truyền tên -> tự lấy "homestay" từ MONGODB_URI
}