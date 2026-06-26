import HelpPageLayout from "../_components/HelpPageLayout";

export default function MarketplaceRulesPage() {
  return (
    <HelpPageLayout title="Quy chế sàn TMĐT">
      <p className="mb-4">
        Quy chế này quy định hoạt động của sàn giao dịch thương mại điện tử
        Bảo An Homestay, áp dụng cho người mua, người bán (host) và các bên
        liên quan.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        1. Điều kiện tham gia
      </h3>
      <p className="mb-4">
        Host đăng ký cung cấp dịch vụ trên sàn cần có đầy đủ thông tin pháp
        lý hợp lệ theo quy định của pháp luật Việt Nam.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        2. Quyền và nghĩa vụ các bên
      </h3>
      <p className="mb-4">
        Sàn có trách nhiệm cung cấp công cụ kết nối, hỗ trợ giao dịch; host
        và khách hàng tự chịu trách nhiệm về thông tin và giao dịch của
        mình.
      </p>

      <h3 className="font-semibold text-gray-900 mt-6 mb-2">
        3. Giải quyết tranh chấp
      </h3>
      <p className="mb-4">
        Mọi tranh chấp phát sinh được ưu tiên giải quyết thông qua thương
        lượng, hòa giải; trường hợp không thống nhất sẽ giải quyết theo quy
        định pháp luật.
      </p>
    </HelpPageLayout>
  );
}
