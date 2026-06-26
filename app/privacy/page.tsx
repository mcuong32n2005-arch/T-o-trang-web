import HelpPageLayout from "../_components/HelpPageLayout";

export default function PrivacyPage() {
  return (
    <HelpPageLayout title="Chính sách bảo mật">
      <p className="mb-4">
        Bảo An Homestay tôn trọng và cam kết bảo vệ thông tin cá nhân của
        khách hàng khi sử dụng dịch vụ trên nền tảng của chúng tôi.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        1. Thông tin chúng tôi thu thập
      </h3>
      <p className="mb-4">
        Họ tên, số điện thoại, email, thông tin đặt phòng và các thông tin
        cần thiết khác để xử lý giao dịch của bạn.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        2. Mục đích sử dụng thông tin
      </h3>
      <p className="mb-4">
        Thông tin được sử dụng để xác nhận đặt phòng, hỗ trợ khách hàng,
        cải thiện chất lượng dịch vụ và gửi các thông báo liên quan đến giao
        dịch.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        3. Bảo mật thông tin
      </h3>
      <p className="mb-4">
        Chúng tôi áp dụng các biện pháp kỹ thuật và quản lý phù hợp để bảo vệ
        thông tin cá nhân của bạn khỏi truy cập, sử dụng hoặc tiết lộ trái
        phép.
      </p>

      <p className="text-sm text-gray-500 mt-6">
        Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ với chúng tôi qua
        trang Liên hệ.
      </p>
    </HelpPageLayout>
  );
}
