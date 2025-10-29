

import { useNavigate } from "react-router-dom"

export default function Header() {
  const navigate = useNavigate()

  const containerStyle = {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "12px 5%",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    columnGap: 16,
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

  const titleWrapStyle = { textAlign: "center", justifySelf: "center" }
  const titleStyle = { color: "#CBB081", fontWeight: 700, fontSize: 36, lineHeight: 1.1, margin: 0 }
  const subTitleStyle = { color: "#CBB081", opacity: 0.9, fontSize: 12, marginTop: 6 }
  const hotlineStyle = { display: "flex", alignItems: "center", gap: 8, color: "#CBB081", fontWeight: 600, whiteSpace: "nowrap", justifySelf: "end" }

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <img src="/image/mainlogo.png" alt="Garage Hoàng Tuấn" style={{ height: 100, width: "auto" }} />

        <div style={titleWrapStyle}>
          <h1 style={titleStyle}>Garage Hoàng Tuấn</h1>
          <div style={subTitleStyle}>Số 110 đường Hoàng Nghiêu, phố Đông, phường Đông Tiến</div>
        </div>

        <div style={hotlineStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.19a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z" stroke="#CBB081" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Hotline: 0912603603</span>
        </div>
      </div>
    </header>
  )
}
