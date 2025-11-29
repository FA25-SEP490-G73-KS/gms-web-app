import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import HeroSlider from '../../components/home/HeroSlider';
import '../../styles/pages/home/home.css';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AutomotiveBusiness',
      name: 'Garage Hoàng Tuấn',
      description: 'Garage Hoàng Tuấn chuyên sơn, bảo dưỡng, phục hồi xe ô tô uy tín tại Thanh Hóa',
      url: 'https://garagehoangtuan.vn',
      telephone: '0912603603',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '110 đường Hoàng Nghiêu',
        addressLocality: 'Thanh Hóa',
        addressCountry: 'VN'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '19.8075',
        longitude: '105.7759'
      },
      openingHours: [
        'Mo-Sa 08:00-18:00',
        'Su 08:00-12:00'
      ],
      priceRange: '$$',
      servesCuisine: false,
      areaServed: {
        '@type': 'City',
        name: 'Thanh Hóa'
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Dịch vụ Garage',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Sơn xe ô tô',
              description: 'Dịch vụ sơn xe ô tô chuyên nghiệp'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Bảo dưỡng xe',
              description: 'Dịch vụ bảo dưỡng định kỳ cho xe ô tô'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Phục hồi xe',
              description: 'Dịch vụ phục hồi ngoại thất và nội thất ô tô'
            }
          }
        ]
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '150'
      }
    });
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <CustomerLayout>
      <article itemScope itemType="https://schema.org/AutomotiveBusiness">
        <header className="home-hero" id="home" aria-label="Hero section" style={{ margin: 0, padding: 0 }}>
          <div className="hero-full">
            <HeroSlider />
          </div>
        </header>

        <section id="about" className="home-intro" aria-labelledby="about-heading">
          <h1 id="about-heading" itemProp="name">
            <span>GARAGE HOÀNG TUẤN</span> XIN KÍNH CHÀO QUÝ KHÁCH!
          </h1>
          <div className="intro-text" itemProp="description">
            <p>
              Garage Hoàng Tuấn là đơn vị <strong className="gold">chuyên sơn – bảo dưỡng – phục hồi</strong> xe ô tô uy tín tại Việt Nam,
              với đội ngũ kỹ thuật viên lành nghề cùng hệ thống trang thiết bị hiện đại, đáp ứng mọi nhu cầu chăm sóc xe
              của Quý khách hàng.
            </p>
            <p>
              Tại Garage Hoàng Tuấn, chúng tôi hiểu rằng mỗi chiếc xe không chỉ là phương tiện di chuyển, mà còn là người
              bạn đồng hành đáng tin cậy trên mọi hành trình. Vì vậy, <strong className="gold">an toàn, chất lượng và uy tín</strong> luôn được đặt lên
              hàng đầu trong từng dịch vụ.
            </p>
            <p>
              Với nhiều năm kinh nghiệm trong lĩnh vực <strong className="gold">sửa chữa và phục hồi xe</strong>, Garage Hoàng Tuấn tự hào mang đến các
              giải pháp chăm sóc toàn diện – từ sơn, bảo dưỡng định kỳ đến phục hồi ngoại thất và nội thất ô tô – giúp chiếc
              xe của bạn luôn trong trạng thái tốt nhất, như mới sau mỗi lần chăm sóc.
            </p>
            <blockquote className="intro-quote" itemProp="slogan">
              "Chất lượng tạo nên niềm tin – Uy tín khẳng định thương hiệu."
            </blockquote>
            <p>
              Đó chính là kim chỉ nam trong mọi hoạt động của Garage Hoàng Tuấn. Nhờ vào sự tin tưởng của khách hàng, chúng
              tôi không ngừng hoàn thiện dịch vụ để trở thành một trong những <strong className="gold">gara chăm sóc – sửa chữa ô tô hàng đầu
              khu vực</strong>.
            </p>
            <p><strong>Tận tâm – Chuyên nghiệp – Uy tín.</strong></p>
          </div>
        </section>

        <section id="services" className="home-services" aria-labelledby="services-heading">
          <h2 id="services-heading">DỊCH VỤ CỦA CHÚNG TÔI</h2>
          <div className="service-grid" role="list">
            <article className="service-card" role="listitem" itemScope itemType="https://schema.org/Service">
              <img
                src="/image/suaxe.jpeg"
                alt="Dịch vụ sơn xe ô tô chuyên nghiệp tại Garage Hoàng Tuấn - Sơn lại toàn bộ, sơn từng phần, sơn bóng"
                className="service-image"
                loading="lazy"
                width="350"
                height="220"
                decoding="async"
                itemProp="image"
              />
              <h3 className="s-title" itemProp="name">Sơn</h3>
              <meta itemProp="description" content="Dịch vụ sơn xe ô tô chuyên nghiệp với công nghệ hiện đại" />
            </article>
            <article className="service-card" role="listitem" itemScope itemType="https://schema.org/Service">
              <img
                src="/image/baoduong.webp"
                alt="Dịch vụ bảo dưỡng xe ô tô định kỳ tại Garage Hoàng Tuấn - Thay nhớt, lọc gió, kiểm tra hệ thống"
                className="service-image"
                loading="lazy"
                width="350"
                height="220"
                decoding="async"
                itemProp="image"
              />
              <h3 className="s-title" itemProp="name">Bảo dưỡng</h3>
              <meta itemProp="description" content="Dịch vụ bảo dưỡng định kỳ cho xe ô tô với đội ngũ kỹ thuật viên lành nghề" />
            </article>
            <article className="service-card" role="listitem" itemScope itemType="https://schema.org/Service">
              <img
                src="/image/phuchoi.png"
                alt="Dịch vụ phục hồi xe ô tô tại Garage Hoàng Tuấn - Phục hồi ngoại thất, nội thất, sửa chữa hư hỏng"
                className="service-image"
                loading="lazy"
                width="350"
                height="220"
                decoding="async"
                itemProp="image"
              />
              <h3 className="s-title" itemProp="name">Phục hồi xe</h3>
              <meta itemProp="description" content="Dịch vụ phục hồi ngoại thất và nội thất ô tô chuyên nghiệp" />
            </article>
          </div>
          <RegisterButton />
          
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link 
              to="/blog" 
              style={{
                color: 'var(--gold)',
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#b29c75';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--gold)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              Xem thêm bài viết về chăm sóc xe ô tô →
            </Link>
          </div>
        </section>
      </article>
    </CustomerLayout>
  );
}

function RegisterButton() {
  const navigate = useNavigate();
  return (
    <div style={{display:'flex',justifyContent:'center',marginTop:32,marginBottom:16}}>
      <button
        onClick={() => navigate('/appointment')}
        aria-label="Đăng ký dịch vụ tại Garage Hoàng Tuấn"
        className="register-service-btn"
        style={{
          background:'#CBB081', 
          color:'#111', 
          fontWeight:600, 
          fontSize: 'clamp(16px, 2.5vw, 18px)',
          padding:'16px 48px', 
          border:'none', 
          borderRadius:10, 
          boxShadow:'0 4px 18px rgba(0,0,0,.10)',
          cursor:'pointer', 
          transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background='#b29c75';
          e.currentTarget.style.transform='translateY(-2px)';
          e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background='#CBB081';
          e.currentTarget.style.transform='translateY(0)';
          e.currentTarget.style.boxShadow='0 4px 18px rgba(0,0,0,.10)';
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline='3px solid #CBB081';
          e.currentTarget.style.outlineOffset='4px';
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline='none';
        }}
      >
        Đăng ký dịch vụ
      </button>
    </div>
  )
}

