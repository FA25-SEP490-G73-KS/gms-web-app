import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"

export default function Header() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const containerStyle = {
    maxWidth: 1400,
    margin: "0 auto",
    padding: isMobile ? "8px 5%" : "12px 5%",
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr auto" : "1fr auto 1fr",
    alignItems: "center",
    columnGap: 16,
    position: "relative",
  }

  const headerStyle = {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "#0f0f0f",
    borderBottom: "1px solid #1f1f1f",
  }

  const brandStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    justifySelf: "start",
  }

  const titleWrapStyle = { 
    textAlign: "center", 
    justifySelf: isMobile ? "start" : "center",
    flex: isMobile ? 1 : "none"
  }
  const titleStyle = { 
    color: "#CBB081", 
    fontWeight: 700, 
    fontSize: isMobile ? 20 : 36, 
    lineHeight: 1.1, 
    margin: 0 
  }
  const subTitleStyle = { 
    color: "#CBB081", 
    opacity: 0.9, 
    fontSize: isMobile ? 10 : 12, 
    marginTop: isMobile ? 2 : 6,
    display: isMobile ? "none" : "block"
  }
  const hotlineStyle = { display: "flex", alignItems: "center", gap: 8, color: "#CBB081", fontWeight: 600, whiteSpace: "nowrap", justifySelf: "end" }

  const navItems = [
    { path: "/", label: "Trang chủ" },
    { path: "/about", label: "Giới thiệu" },
    { path: "/blog", label: "Blog" },
    { path: "/contact", label: "Liên hệ" },
    { path: "/appointment", label: "Đặt lịch" },
  ]

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        {!isMobile && (
          <img src="/image/mainlogo.png" alt="Garage Hoàng Tuấn" style={{ height: 100, width: "auto" }} />
        )}

        <div style={titleWrapStyle}>
          <h1 style={titleStyle}>Garage Hoàng Tuấn</h1>
          <div style={subTitleStyle}>Số 110 đường Hoàng Nghiêu, phố Đông, phường Đông Tiến</div>
        </div>

        {!isMobile && (
          <div style={hotlineStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.19a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z" stroke="#CBB081" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Hotline: 0912603603</span>
          </div>
        )}

        {isMobile && (
          <button
            onClick={toggleMobileMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: '#CBB081',
              cursor: 'pointer',
              padding: '8px',
              justifySelf: 'end',
              zIndex: 100,
            }}
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
        )}

        {isMobile && mobileMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#0f0f0f',
              borderTop: '1px solid #1f1f1f',
              padding: '16px 5%',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              zIndex: 99,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  color: '#CBB081',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1a1a1a'
                  e.currentTarget.style.borderColor = '#CBB081'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                {item.label}
              </Link>
            ))}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              color: '#CBB081', 
              fontWeight: 600, 
              padding: '12px 16px',
              marginTop: '8px',
              borderTop: '1px solid #1f1f1f',
              paddingTop: '16px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.19a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z" stroke="#CBB081" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Hotline: 0912603603</span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
