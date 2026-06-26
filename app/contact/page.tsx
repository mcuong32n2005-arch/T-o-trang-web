import HelpPageLayout from "../_components/HelpPageLayout";

export default function ContactPage() {
  return (
    <HelpPageLayout title="Liên hệ Bảo An Homestay">
      {/* Khối thông tin liên hệ - theo mẫu ảnh */}
      <div className="rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 text-white p-6 md:p-8">
        <h2 className="text-lg font-bold border-b border-white/30 pb-3 mb-4">
          THÔNG TIN LIÊN HỆ
        </h2>

        <p className="font-semibold mb-4">CÔNG TY TNHH TƯ VẤN VÀ CÔNG NGHỆ BẢO AN</p>

        <ul className="space-y-2 text-sm md:text-base">
          <li className="flex gap-2">
            <span>•</span>
            <span>
              Địa chỉ: 125A đường Bắc Sơn, đối diện Huyndai Bắc Sơn, TP Thái
              Nguyên, tỉnh Thái Nguyên
            </span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Điện thoại: 0967.91.6868 - 0968.193.688</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Email: batek@gmail.com</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Website: batek.vn</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>ZALO: 0967.91.6868</span>
          </li>
        </ul>
      </div>

      {/* Phần mở rộng - form liên hệ nhanh (tuỳ chọn, có thể bỏ nếu không cần) */}
      <p className="mt-6 text-sm text-gray-500">
        Mọi thắc mắc về đặt phòng, hợp tác hoặc hỗ trợ kỹ thuật, vui lòng liên
        hệ trực tiếp theo thông tin trên hoặc qua Zalo để được phản hồi nhanh
        nhất.
      </p>
    </HelpPageLayout>
  );
}
