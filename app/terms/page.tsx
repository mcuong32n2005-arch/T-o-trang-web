import HelpPageLayout from "../_components/HelpPageLayout";

export default function TermsPage() {
  return (
    <HelpPageLayout title="Điều khoản hoạt động">
      <p className="mb-4">
        Khi sử dụng dịch vụ của Bảo An Homestay, bạn đồng ý với các điều
        khoản hoạt động sau đây.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        1. Phạm vi dịch vụ
      </h3>
      <p className="mb-4">
        Bảo An Homestay là nền tảng kết nối khách hàng với các chủ nhà/host
        cung cấp dịch vụ lưu trú trên hệ thống.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        2. Trách nhiệm của người dùng
      </h3>
      <p className="mb-4">
        Người dùng cam kết cung cấp thông tin chính xác khi đặt phòng và tuân
        thủ các quy định của từng cơ sở lưu trú.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        3. Trách nhiệm của host
      </h3>
      <p className="mb-4">
        Host chịu trách nhiệm về chất lượng dịch vụ, tính chính xác của thông
        tin phòng và việc tuân thủ pháp luật liên quan đến kinh doanh lưu
        trú.
      </p>
    </HelpPageLayout>
  );
}
