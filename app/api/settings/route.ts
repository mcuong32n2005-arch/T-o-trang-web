import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAction } from "@/lib/adminLog";

const SETTINGS_KEY = "system_settings"; // chỉ có duy nhất 1 document cấu hình toàn hệ thống

// GET: lấy cấu hình hệ thống — công khai vì layout trang chủ (logo, hotline...) cũng cần
export async function GET() {
  try {
    const db = await getDb();
    const settings = await db.collection("settings").findOne({ key: SETTINGS_KEY });

    return NextResponse.json({
      data: settings
        ? { ...settings, _id: undefined, key: undefined }
        : {
            logoUrl: "",
            bannerUrl: "",
            contactEmail: "",
            hotline: "",
            address: "",
            policy: "",
            terms: "",
            socials: {},
          },
    });
  } catch (error) {
    console.error("Lỗi lấy cấu hình hệ thống:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// PUT: cập nhật cấu hình hệ thống — chỉ admin
export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Bạn cần đăng nhập với quyền admin." }, { status: 401 });
  }

  try {
    const body = await request.json();
    delete body._id;
    delete body.key;

    const db = await getDb();
    await db.collection("settings").updateOne(
      { key: SETTINGS_KEY },
      { $set: { ...body, key: SETTINGS_KEY, updatedAt: new Date() } },
      { upsert: true }
    );

    await logAction({ actorId: admin.userId, action: "Đã cập nhật cài đặt hệ thống" });

    return NextResponse.json({ message: "Đã lưu cài đặt hệ thống." });
  } catch (error) {
    console.error("Lỗi cập nhật cấu hình hệ thống:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
