import CustomerLayout from '../../layouts/CustomerLayout';
import '../../styles/pages/home/home.css';

export default function AboutPage() {
  return (
    <CustomerLayout>
      <section className="home-hero">
        <div className="hero-full">
          <img src="/image/ChatGPT Image 07_41_33 19 thg 10, 2025.png" alt="garage" className="hero-full-img" />
        </div>
      </section>

      <section className="home-intro">
        <h2><span>VỀ CHÚNG TÔI</span></h2>
        <div className="intro-text">
          <p><b>TRUNG TÂM SỬA CHỮA GARAGE HOÀNG TUẤN</b></p>
          <p><b>Địa chỉ</b>: 110 đường Hoàng Nghiêu, phố Đông, phường Đông Tiến, TP. Thanh Hóa</p>
          <p><b>Điện thoại / Zalo</b>: 0912 603 603</p>

          <p>
            Xuất phát từ nhu cầu thực tế hiện nay, việc bảo dưỡng và sửa chữa xe ô tô là mối quan tâm hàng đầu của các chủ xe.
            Đặc biệt, trong bối cảnh thị trường ô tô ngày càng phát triển mạnh mẽ, việc tìm kiếm một đơn vị sửa chữa uy tín,
            chuyên nghiệp, giá cả hợp lý là điều khiến Quý khách hàng luôn trăn trở.
          </p>
          <p>
            Trước thực tế đó, Garage Ô tô Hoàng Tuấn hân hạnh được đồng hành cùng Quý khách hàng, mang đến những giải pháp
            toàn diện cho chiếc xe yêu quý của bạn. Chúng tôi luôn đặt <span className="gold">an toàn – chất lượng – uy tín</span> làm kim chỉ nam
            trong mọi hoạt động.
          </p>

          <h3 style={{ fontSize: 18, marginTop: 14 }}>Cơ sở vật chất – Trang thiết bị</h3>
          <ul>
            <li>Hệ thống cầu nâng tiêu chuẩn, phù hợp cho mọi dòng xe.</li>
            <li>Buồng sơn sấy khép kín với công nghệ sơn vi tính hiện đại.</li>
            <li>Giàn kéo nắn khung xương, máy hàn rút tôn, máy bấm đinh tán thế hệ mới.</li>
            <li>Thiết bị cân chỉnh đo kiểm, máy đọc/xóa lỗi động cơ tiên tiến.</li>
            <li>Hệ thống máy hút – nạp gas tự động và các dụng cụ chuyên dùng đạt chuẩn.</li>
          </ul>

          <h3 style={{ fontSize: 18, marginTop: 14 }}>Hệ thống nhà xưởng đồng bộ, khoa học</h3>
          <ul>
            <li>Khu vực đại tu, bảo dưỡng máy – gầm.</li>
            <li>Khu vực điện, điện lạnh, điều hòa ô tô.</li>
            <li>Khu vực gò – sơn phục hồi xe thân vỏ.</li>
            <li>Khu rửa xe, chăm sóc nội – ngoại thất.</li>
          </ul>

          <h3 style={{ fontSize: 18, marginTop: 14 }}>Các dịch vụ cung cấp</h3>
          <ul>
            <li>Dịch vụ rửa xe, dọn nội thất, đánh bóng sơn xe công nghệ cao.</li>
            <li>Thay thế phụ tùng chính hãng, bảo dưỡng định kỳ.</li>
            <li>Tư vấn kỹ thuật, chăm sóc khách hàng tận tâm.</li>
          </ul>

          <p className="intro-quote">“Thời gian – Chất lượng – Giá thành – Tạo nên sự khác biệt.”</p>
          <p>
            Đến với Garage Ô tô Hoàng Tuấn, Quý khách sẽ được phục vụ theo phong cách
            <span className="gold"> chuyên nghiệp – hiện đại – tận tâm</span>. Liên hệ ngay hôm nay để được tư vấn và hỗ trợ nhanh nhất!
          </p>
        </div>
      </section>
    </CustomerLayout>
  );
}


