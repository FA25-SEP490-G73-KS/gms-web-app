import CustomerLayout from '../../layouts/CustomerLayout';
import '../../styles/pages/home.css';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  return (
    <CustomerLayout>
      <section id="home" className="home-hero">
        <div className="hero-full">
          <img src="/image/gara.png" alt="garage" className="hero-full-img" />
        </div>
      </section>

      <section id="about" className="home-intro">
        <h2>
          <span>GARAGE HOÀNG TUẤN</span> XIN KÍNH CHÀO QUÝ KHÁCH!
        </h2>
        <div className="intro-text">
          <p>
            Garage Hoàng Tuấn là đơn vị <span className="gold">chuyên sơn – bảo dưỡng – phục hồi</span> xe ô tô uy tín tại Việt Nam,
            với đội ngũ kỹ thuật viên lành nghề cùng hệ thống trang thiết bị hiện đại, đáp ứng mọi nhu cầu chăm sóc xe
            của Quý khách hàng.
          </p>
          <p>
            Tại Garage Hoàng Tuấn, chúng tôi hiểu rằng mỗi chiếc xe không chỉ là phương tiện di chuyển, mà còn là người
            bạn đồng hành đáng tin cậy trên mọi hành trình. Vì vậy, <span className="gold">an toàn, chất lượng và uy tín</span> luôn được đặt lên
            hàng đầu trong từng dịch vụ.
          </p>
          <p>
            Với nhiều năm kinh nghiệm trong lĩnh vực <span className="gold">sửa chữa và phục hồi xe</span>, Garage Hoàng Tuấn tự hào mang đến các
            giải pháp chăm sóc toàn diện – từ sơn, bảo dưỡng định kỳ đến phục hồi ngoại thất và nội thất ô tô – giúp chiếc
            xe của bạn luôn trong trạng thái tốt nhất, như mới sau mỗi lần chăm sóc.
          </p>
          <p className="intro-quote">“Chất lượng tạo nên niềm tin – Uy tín khẳng định thương hiệu.”</p>
          <p>
            Đó chính là kim chỉ nam trong mọi hoạt động của Garage Hoàng Tuấn. Nhờ vào sự tin tưởng của khách hàng, chúng
            tôi không ngừng hoàn thiện dịch vụ để trở thành một trong những <span className="gold">gara chăm sóc – sửa chữa ô tô hàng đầu
            khu vực</span>.
          </p>
          <p><b>Tận tâm – Chuyên nghiệp – Uy tín.</b></p>
        </div>
      </section>

      <section id="services" className="home-services">
        <h3>DỊCH VỤ CỦA CHÚNG TÔI</h3>
        <div className="service-grid">
          <div className="service-card">
            <img src="/image/suaxe.jpeg" alt="Sơn" />
            <div className="s-title">Sơn</div>
          </div>
          <div className="service-card">
            <img src="/image/baoduong.webp" alt="Bảo dưỡng" />
            <div className="s-title">Bảo dưỡng</div>
          </div>
          <div className="service-card">
            <img src="/image/phuchoi.png" alt="Phục hồi xe" />
            <div className="s-title">Phục hồi xe</div>
          </div>
        </div>
        <RegisterButton />
      </section>

     
    </CustomerLayout>
  );
}

function RegisterButton() {
  const navigate = useNavigate();
  return (
    <div style={{display:'flex',justifyContent:'center',marginTop:28}}>
      <button
        onClick={() => navigate('/appointment')}
        style={{
          background:'#CBB081', color:'#111', fontWeight:500, fontSize:18,
          padding:'16px 38px', border:'none', borderRadius:10, boxShadow:'0 4px 18px rgba(0,0,0,.10)',
          cursor:'pointer', transition:'background 0.2s',
        }}
        onMouseOver={e=>e.currentTarget.style.background='#b29c75'}
        onMouseOut={e=>e.currentTarget.style.background='#CBB081'}
      >
        Đăng ký dịch vụ
      </button>
    </div>
  )
}

