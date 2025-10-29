import CustomerLayout from '../../layouts/CustomerLayout';
import '../../styles/pages/home.css';

export default function ContactPage() {
  return (
    <CustomerLayout>
      <section className="home-intro">
        <h2><span>LIÊN HỆ</span></h2>
        <div className="intro-text">
          <p><b>GARAGE HOÀNG TUẤN</b></p>
          <p><b>MST</b>: (bổ sung sau nếu có)</p>
          <p><b>Địa chỉ</b>: 110 đường Hoàng Nghiêu, phố Đông, phường Đông Tiến, TP. Thanh Hóa, Việt Nam</p>
          <p><b>Số tài khoản</b>: (bổ sung sau nếu cần)</p>
          <p><b>Ngân hàng</b>: (bổ sung sau nếu có tài khoản doanh nghiệp)</p>
          <p><b>Website</b>: https://garagehoangtuan.vn (hoặc link bạn muốn dùng)</p>
          <p><b>Email</b>: garagehoangtuan@gmail.com</p>
          <p><b>Hotline / Zalo</b>: 0912 603 603</p>

          <div style={{ marginTop: 16 }}>
            <iframe
              title="Bản đồ Garage Hoàng Tuấn"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.451312236766!2d106.70000000000002!3d10.776530000000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1svi!2svi!4v1690000000000"
              width="100%"
              height="420"
              style={{ border: 0, borderRadius: 12 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </CustomerLayout>
  );
}


