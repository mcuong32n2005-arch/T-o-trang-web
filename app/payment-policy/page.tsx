import HelpPageLayout from "../_components/HelpPageLayout";

export default function PaymentPolicyPage() {
  return (
    <HelpPageLayout title="Chính sách thanh toán">
      <h3 className="font-semibold text-gray-900 mb-2">
        1. Phương thức thanh toán
      </h3>
      <p className="mb-4">
        Hệ thống hỗ trợ thanh toán trực tuyến qua cổng VNPAY, đảm bảo an toàn
        và nhanh chóng cho mọi giao dịch đặt phòng.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        2. Thời điểm thanh toán
      </h3>
      <p className="mb-4">
        Khách hàng cần hoàn tất thanh toán ngay khi xác nhận đặt phòng để giữ
        chỗ. Đơn đặt phòng chưa thanh toán sẽ không được giữ chỗ.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        3. Hoàn tiền và hủy đặt phòng
      </h3>
      <p className="mb-4">
        Chính sách hoàn tiền tùy thuộc vào điều kiện của từng phòng/host. Vui
        lòng kiểm tra kỹ điều khoản trước khi đặt hoặc liên hệ bộ phận hỗ trợ
        để được tư vấn.
      </p>

      <p className="text-sm text-gray-500 mt-6">
        Xem hướng dẫn chi tiết tại trang Hướng dẫn thanh toán bằng VNPAY.
      </p>
    </HelpPageLayout>
  );
}
