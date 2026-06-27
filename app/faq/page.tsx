import HelpPageLayout from "../_components/HelpPageLayout";

const FAQ_ITEMS = [
  {
    q: "Làm thế nào để đặt phòng trên Bảo An Homestay?",
    a: "Bạn chỉ cần chọn địa điểm, ngày nhận/trả phòng và số khách ở trang chủ, sau đó nhấn Tìm kiếm để xem các phòng phù hợp và tiến hành đặt.",
  },
  {
    q: "Tôi có thể thanh toán bằng hình thức nào?",
    a: "Hiện tại hệ thống hỗ trợ thanh toán qua VNPAY. Bạn có thể xem chi tiết tại trang Hướng dẫn thanh toán bằng VNPAY.",
  },
  {
    q: "Tôi muốn hủy hoặc đổi lịch đặt phòng thì làm sao?",
    a: "Vui lòng liên hệ trực tiếp với chủ nhà hoặc bộ phận hỗ trợ qua trang Liên hệ để được xử lý nhanh nhất.",
  },
  {
    q: "Làm sao để trở thành đối tác cho thuê phòng (host)?",
    a: "Bạn có thể tham khảo thông tin tại trang Kênh host để biết điều kiện và quy trình đăng ký.",
  },
  {
    q: "Bảo An Homestay có hỗ trợ nhận phòng sớm hoặc trả phòng muộn không?",
    a: "Một số homestay có hỗ trợ nhận/trả phòng linh hoạt và có thể tính phụ phí. Vui lòng kiểm tra thông tin chính sách của từng phòng trước khi đặt, hoặc liên hệ chủ nhà để được xác nhận.",
  },
  {
    q: "Tôi có thể khiếu nại nếu phòng không đúng như mô tả không?",
    a: "Được. Bạn có thể gửi khiếu nại qua trang Khiếu nại để được Bảo An Homestay hỗ trợ xử lý.",
  },
];

export default function FaqPage() {
  return (
      <HelpPageLayout title="Câu hỏi thường gặp">
        <div className="divide-y divide-gray-100">
          {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="py-4">
                <h3 className="font-semibold text-gray-900">{item.q}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.a}</p>
              </div>
          ))}
        </div>
      </HelpPageLayout>
  );
}
