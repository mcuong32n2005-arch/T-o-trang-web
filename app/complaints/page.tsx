import HelpPageLayout from "../_components/HelpPageLayout";

export default function ComplaintsPage() {
  return (
    <HelpPageLayout title="Giải quyết khiếu nại">
      <p className="mb-4">
        Nếu bạn gặp vấn đề trong quá trình đặt phòng hoặc sử dụng dịch vụ,
        Bảo An Homestay luôn sẵn sàng hỗ trợ giải quyết.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        1. Cách gửi khiếu nại
      </h3>
      <p className="mb-4">
        Vui lòng liên hệ qua số điện thoại hoặc Zalo tại trang Liên hệ, mô tả
        rõ vấn đề kèm thông tin đặt phòng (mã đơn, ngày đặt) để được hỗ trợ
        nhanh nhất.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        2. Thời gian xử lý
      </h3>
      <p className="mb-4">
        Khiếu nại sẽ được tiếp nhận và phản hồi trong vòng 24-48 giờ làm
        việc kể từ khi nhận được thông tin đầy đủ.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        3. Cam kết
      </h3>
      <p className="mb-4">
        Chúng tôi cam kết xử lý khách quan, minh bạch và bảo vệ quyền lợi
        hợp pháp của khách hàng cũng như đối tác host.
      </p>
    </HelpPageLayout>
  );
}
