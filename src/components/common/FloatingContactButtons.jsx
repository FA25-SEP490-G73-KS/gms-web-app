import { FaPhone } from 'react-icons/fa';
import './FloatingContactButtons.css';

export default function FloatingContactButtons() {
  const handlePhoneClick = () => {
    window.location.href = 'tel:0912603603';
  };

  const handleZaloClick = () => {
    window.open('https://zalo.me/2212465165529319780', '_blank');
  };

  return (
    <div className="floating-contact-buttons">
      <div
        className="floating-button-wrapper"
        onClick={handlePhoneClick}
        aria-label="Gọi điện thoại"
        title="Gọi điện thoại: 0912603603"
      >
        <div className="floating-button-glow-ring"></div>
        <div className="floating-button-circle">
          <FaPhone className="floating-button-icon floating-button-phone" />
        </div>
      </div>

      <div
        className="floating-button-wrapper"
        onClick={handleZaloClick}
        aria-label="Chat Zalo"
        title="Chat Zalo: 0912603603"
      >
        <div className="floating-button-glow-ring"></div>
        <div className="floating-button-circle">
          <img src="/assets/zalo-logo.svg" alt="Zalo" width="40" className="floating-button-zalo-img" />
        </div>
      </div>
    </div>
  );
}

