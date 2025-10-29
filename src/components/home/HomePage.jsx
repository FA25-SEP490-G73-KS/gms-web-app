import React, { useEffect, useRef, useState, useCallback } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import axios from 'axios';
import '../../styles/homepage.css';
import '../../styles/material-symbols.css'; // css local


export default function HomePage() {
  // Before/After slider refs and state
  const containerRef = useRef(null);
  const beforeRef = useRef(null);
  const handleRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    plateNumber: '',
    bookingDate: '',
    timeSlot: '',
    serviceType: '',
    description: '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [invalidFields, setInvalidFields] = useState(new Set());
  const [now, setNow] = useState(new Date());
  const [timeOptions, setTimeOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        
        await Promise.all([
         
          new Promise((resolve) => {
            AOS.init({ duration: 1200, once: true });
            setTimeout(() => {
              AOS.refresh();
              resolve();
            }, 0);
          }),
        ]);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();

  
    const clockId = window.setInterval(() => setNow(new Date()), 30000);

    return () => {
      window.clearInterval(clockId);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const before = beforeRef.current;
    const handle = handleRef.current;
    if (!container || !before || !handle) return;

    const update = (x) => {
      const rect = container.getBoundingClientRect();
      let localX = x - rect.left;
      if (localX < 0) localX = 0;
      if (localX > rect.width) localX = rect.width;
      const percent = (localX / rect.width) * 100;
      before.style.width = `${percent}%`;
      handle.style.left = `${percent}%`;
    };

    const onMouseDown = (e) => {
      setDragging(true);
      update(e.clientX);
    };
    const onMouseMove = (e) => {
      if (!dragging) return;
      update(e.clientX);
    };
    const onMouseUp = () => setDragging(false);

    const onTouchStart = (e) => {
      setDragging(true);
      update(e.touches[0].clientX);
    };
    const onTouchMove = (e) => {
      if (!dragging) return;
      update(e.touches[0].clientX);
    };
    const onTouchEnd = () => setDragging(false);

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragging]);

  const today = new Date().toISOString().split('T')[0];

  // Helpers to determine if a time slot is expired for the selected date (today)
  const parseEndMinutes = (slot) => {
    // Prefer explicit endTime (e.g., "17:30")
    const endRaw = slot.endTime;
    const label = slot.label || '';
    let timeStr = endRaw;
    if (!timeStr) {
      // Fallback: parse the second HH:MM in label like "08:00 - 09:00"
      const matches = label.match(/(\d{1,2}:\d{2})/g);
      if (matches && matches.length >= 2) {
        timeStr = matches[1];
      } else if (matches && matches.length === 1) {
        // In case label only has one time and implies end is the same (rare), treat it as start+0
        timeStr = matches[0];
      }
    }
    if (!timeStr) return Number.POSITIVE_INFINITY; // if unparseable, don't expire it
    const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10));
    return h * 60 + (isNaN(m) ? 0 : m);
  };

  const isSlotExpired = (slot) => {
    if (!form.bookingDate) return false;
    if (form.bookingDate !== today) return false; // only expire for today
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = parseEndMinutes(slot);
    return nowMinutes >= endMinutes;
  };

  // Fetch time slots when booking date changes
  useEffect(() => {
    if (!form.bookingDate) {
      setTimeOptions([]);
      return;
    }

    const fetchTimeSlots = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:8080/api/appointments/time-slots?date=${form.bookingDate}`);
        if (Array.isArray(res.data)) {
          // Only keep available time slots (booked < maxCapacity)
          const filtered = res.data.filter((slot) => slot.available && slot.booked < slot.maxCapacity);
          setTimeOptions(filtered);
        } else {
          setTimeOptions([]);
        }
      } catch (err) {
        console.error('Failed to load time slots:', err);
        setTimeOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, [form.bookingDate]);



    const handleOpenBooking = (e) => {
    e.preventDefault();
    setIsBookingOpen(true);
  };

  const resetBookingState = () => {
    setForm({ customerName: '', phone: '', plateNumber: '', bookingDate: '', timeSlot: '', serviceType: '', description: '' });
    setSelectedFiles([]);
    setInvalidFields(new Set());
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    resetBookingState();
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
    setInvalidFields((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleMediaChange = (e) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    // Allow selecting same files again
    e.target.value = '';
  };

  const removeFileAt = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateAndSubmit = async (e) => {
    e.preventDefault();
    let isValid = true;
    const errors = [];
    const invalid = new Set();

    const name = form.customerName.trim();
    const phone = form.phone.trim();
    const plate = form.plateNumber.trim();

    if (!name) { invalid.add('customerName'); errors.push('• Họ và tên không được để trống.'); isValid = false; }

    if (!phone) { invalid.add('phone'); errors.push('• Số điện thoại không được để trống.'); isValid = false; }
    else if (!/^0\d{9}$/.test(phone)) { invalid.add('phone'); errors.push('• Số điện thoại phải gồm 10 số và bắt đầu bằng 0.'); isValid = false; }

    if (!plate) { invalid.add('plateNumber'); errors.push('• Biển số xe không được để trống.'); isValid = false; }
    else if (!/^[0-9]{2}[A-Z]{1,2}-?[0-9]{3,4}\.?[0-9]{0,2}$/.test(plate)) { invalid.add('plateNumber'); errors.push('• Biển số xe không hợp lệ (VD: 30F-123.45 hoặc 51A12345).'); isValid = false; }

    if (!form.bookingDate) { invalid.add('bookingDate'); errors.push('• Vui lòng chọn ngày đặt.'); isValid = false; }
    if (!form.timeSlot) { invalid.add('timeSlot'); errors.push('• Vui lòng chọn khung giờ.'); isValid = false; }
    if (!form.serviceType) { invalid.add('serviceType'); errors.push('• Vui lòng chọn loại dịch vụ.'); isValid = false; }

    if (!isValid) {
      setInvalidFields(invalid);
      alert('⚠️ Vui lòng kiểm tra lại các thông tin sau:\n\n' + errors.join('\n'));
      return;
    }

    // Prevent submission if the selected time slot has just expired
    const chosenSlot = timeOptions.find((s) => String(s.timeSlotId) === String(form.timeSlot));
    if (chosenSlot && isSlotExpired(chosenSlot)) {
      alert('Khung giờ đã hết hạn, vui lòng chọn khung giờ khác.');
      return;
    }

    try {
      await axios.post('http://localhost:8080/api/appointments', {
        customerName: form.customerName,
          phoneNumber: form.phone,
          licensePlate: form.plateNumber,
          appointmentDate: form.bookingDate,
          timeSlotIndex: form.timeSlot,
          serviceType: form.serviceType,
          note: form.description,
      });
      alert('Appointment booked successfully');
      handleCloseBooking();
    } catch (err) {
      console.error('Failed to submit appointment', err);
      alert('Failed to submit');
    }
  };

  const isOptionDisabled = (threshold) => {
    if (form.bookingDate !== today) return false;
    const now = new Date();
    const current = now.getHours() + now.getMinutes() / 60;
    return current >= threshold;
  };

  return (
    <main className="gms-home">
      {/* HERO SECTION */}
        <section className="hero-banner">
            <div className="hero-content">
                <div className="line top-line">
                    <p data-aos="fade-right">
                        Mỗi chiếc xe là một hành trình, và chúng tôi chăm sóc nó bằng sự tận tâm,
                        công nghệ hiện đại cùng tay nghề chuyên nghiệp tại
                    </p>
                    <h1 data-aos="fade-down">
                        <span className="highlight">Gara Ô Tô</span> Hoàng Tuấn
                    </h1>
                </div>

                <div className="line bottom-line">
                    <h1 data-aos="fade-right">
                        Chất Lượng <span className="highlight">Vàng</span>
                    </h1>
                    <p data-aos="fade-left">
                        Chúng tôi mang đến giải pháp toàn diện cho mọi dòng xe,
                        giúp bạn yên tâm trên từng hành trình với chất lượng và uy tín vượt trội.
                    </p>
                </div>
            </div>

            <div className="hero-image-wrapper" data-aos="fade-up">
                <div className="hero-image-container"></div>
                <a href="#services" className="btn-primary hero-btn" data-aos="zoom-in" id="openBookingBtn" onClick={handleOpenBooking}>Đặt lịch
                    ngay</a>
            </div>

            <div id="bookingOverlay" className="booking-overlay" style={{ display: isBookingOpen ? 'flex' : 'none' }} onClick={handleCloseBooking} role="dialog" aria-modal="true" aria-labelledby="bookingTitle">
                <div className="booking-popup" data-aos="zoom-in" onClick={(e) => e.stopPropagation()}>
                    <h2 id="bookingTitle">Đặt lịch sửa chữa</h2>
                    <form id="bookingForm" noValidate onSubmit={validateAndSubmit}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor="customerName">Họ và tên *</label>
                          <input id="customerName" type="text" value={form.customerName} onChange={handleInputChange} placeholder="Nhập họ tên" required style={{ borderColor: invalidFields.has('customerName') ? 'red' : undefined }} />
                        </div>

                        <div className="form-group">
                          <label htmlFor="phone">Số điện thoại *</label>
                          <input id="phone" type="tel" value={form.phone} onChange={handleInputChange} placeholder="VD: 0987654321" required pattern="^(0[0-9]{9})$" style={{ borderColor: invalidFields.has('phone') ? 'red' : undefined }} />
                        </div>

                        <div className="form-group">
                          <label htmlFor="plateNumber">Biển số xe *</label>
                          <input id="plateNumber" type="text" value={form.plateNumber} onChange={handleInputChange} placeholder="VD: 30F-123.45" required style={{ borderColor: invalidFields.has('plateNumber') ? 'red' : undefined }} />
                        </div>

                        <div className="form-group">
                          <label htmlFor="bookingDate">Ngày đặt *</label>
                          <input id="bookingDate" type="date" value={form.bookingDate} onChange={handleInputChange} min={today} required style={{ borderColor: invalidFields.has('bookingDate') ? 'red' : undefined }} />
                        </div>

                        <div className="form-group">
                          <label htmlFor="timeSlot">Khung giờ *</label>
                            <select
                                id="timeSlot"
                                value={form.timeSlot}
                                onChange={handleInputChange}
                                required
                                style={{ borderColor: invalidFields.has('timeSlot') ? 'red' : undefined }}
                            >
                                <option value="">-- Chọn khung giờ --</option>
                                {timeOptions.length === 0 && form.bookingDate && (
                                    <option disabled>Không còn khung giờ trống</option>
                                )}
                                {timeOptions.map((slot) => {
                                    const expired = isSlotExpired(slot);
                                    return (
                                        <option
                                            key={slot.timeSlotId}
                                            value={slot.timeSlotId}
                                            disabled={expired}
                                            style={{ opacity: expired ? 0.5 : 1 }}
                                        >
                                            {slot.label}{expired ? ' (hết hạn)' : ''}
                                        </option>
                                    );
                                })}
                            </select>

                        </div>

                        <div className="form-group">
                          <label htmlFor="serviceType">Loại dịch vụ *</label>
                            <select
                                id="serviceType"
                                value={form.serviceType}
                                onChange={handleInputChange}
                                required
                                style={{ borderColor: invalidFields.has('serviceType') ? 'red' : undefined }}
                            >
                                <option value="">-- Chọn dịch vụ --</option>
                                <option value="SUA_CHUA">Sửa chữa</option>
                                <option value="BAO_HANH">Bảo hành</option>
                                <option value="SON">Sơn</option>
                            </select>
                        </div>

                        <div className="form-group full">
                          <label htmlFor="description">Mô tả chi tiết</label>
                          <textarea id="description" rows={3} value={form.description} onChange={handleInputChange} placeholder="Nhập mô tả thêm..."></textarea>
                        </div>
                      </div>

                      <div className="form-btns">
                        <button type="submit" className="submit-btn">Gửi yêu cầu</button>
                        <button type="button" id="closeBookingBtn" className="close-btn" onClick={handleCloseBooking}>Đóng</button>
                      </div>
                    </form>
                </div>
            </div>

        </section>

        {/* ABOUT */}
        <section className="about-section" id="about">
            <div className="about-left" data-aos="fade-right">
                <h4>Giới thiệu</h4>
                <h2>Who are we? Chúng tôi là ai?</h2>
                <p>
                    Chúng tôi không chỉ sửa xe – chúng tôi nâng niu từng hành trình. Tại Gara Ô Tô Hoàng Tuấn, mỗi chiếc
                    xe
                    là một tác phẩm, được chăm chút bằng công nghệ hiện đại và tâm huyết tinh tế.
                </p>
                <div className="author">
                    <img src="/image/a-minimalist-logo-design-featuring-the-m_KCX4Hu-hTAOZg4Njj0hGvg_4TlY5-kYRRSPFzTnTifWGQ.jpeg" alt="Author"/>
                    <span>Hoàng Tuấn</span>
                </div>
            </div>

            <div className="about-image" data-aos="fade-up">
                <img
                    src="/image/aboutus.jpg"
                    alt="Construction Workers"
                />
            </div>

            <div className="about-right" data-aos="fade-left">
                <div>
                    <h3>Sứ mệnh</h3>
                    <p>
                        Chúng tôi không chỉ sửa xe – chúng tôi nâng niu từng hành trình. Tại Gara Ô Tô Hoàng Tuấn, mỗi
                        chiếc xe
                        là một tác phẩm, được chăm chút bằng công nghệ hiện đại và tâm huyết tinh tế.
                    </p>
          </div>
          <div>
            <h3>Tầm nhìn</h3>
            <p>Trở thành biểu tượng chăm sóc xe uy tín tại Việt Nam, nơi chất lượng, sáng tạo và tâm huyết hội tụ.</p>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="services" id="services">
        <div className="services-header" data-aos="zoom-in">
          <h2>
            Our <span>Services</span>
          </h2>
          <p>
            Gara Hoàng Tuấn tự hào mang đến những giải pháp toàn diện cho chiếc xe của bạn — từ bảo dưỡng định kỳ,
            thay thế – sửa chữa chuyên sâu cho đến dịch vụ sơn hoàn thiện đạt chuẩn nhà máy. Mỗi chi tiết đều được
            thực hiện bằng tâm huyết và kỹ thuật chính xác.
          </p>
        </div>

        <div className="services-list">
          <div className="service-card" data-aos="fade-right">
            <img
              src="/image/baoduong-service.jpg"
              alt="Bảo dưỡng định kỳ"
            />
            <h3>Bảo dưỡng định kỳ</h3>
            <div className="service-detail">
              <h4>Bảo dưỡng định kỳ toàn diện</h4>
              <p>
                Bao gồm thay dầu, kiểm tra phanh, lọc gió, nước làm mát và hệ thống điện. Đảm bảo xe luôn vận hành êm
                ái, tiết kiệm nhiên liệu và an toàn tuyệt đối.
              </p>
            </div>
          </div>

          <div className="service-card" data-aos="zoom-in">
            <img
              src="/image/suachua-service.jpg"
              alt="Thay thế & Sửa chữa"
            />
            <h3>Thay thế & Sửa chữa</h3>
            <div className="service-detail">
              <h4>Sửa chữa chuyên sâu</h4>
              <p>
                Chẩn đoán bằng thiết bị hiện đại. Thay thế phụ tùng chính hãng, xử lý triệt để mọi lỗi động cơ, hộp
                số, hệ thống lái và phanh.
              </p>
            </div>
          </div>

          <div className="service-card" data-aos="fade-left">
            <img src="/image/son-service.jpg" alt="Sơn & Hoàn thiện xe" />
            <h3>Sơn & Hoàn thiện xe</h3>
            <div className="service-detail">
              <h4>Sơn & Đánh bóng đạt chuẩn</h4>
              <p>
                Sử dụng buồng sơn hiện đại, sơn gốc nước thân thiện môi trường. Màu sắc bền đẹp, bóng mịn, khôi phục
                như mới sau va chạm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="why-choose">
        <div className="why-bg">
          <h2 data-aos="fade-up">
            Tại sao chọn <span>Gara Hoàng Tuấn?</span>
          </h2>
          <p data-aos="fade-up" data-aos-delay="100">
            Với hơn 10 năm kinh nghiệm trong ngành, Gara Hoàng Tuấn không chỉ là nơi sửa chữa – chúng tôi là điểm đến
            tin cậy của những người yêu xe, mang đến sự chăm sóc toàn diện, tận tâm và chuyên nghiệp cho mọi hành trình.
          </p>

          <div className="why-items">
            <div className="why-item" data-aos="fade-up" data-aos-delay="200">
              <span className="icon" aria-hidden>
                <span className="material-symbols-outlined">
engineering
</span>
              </span>
                <h3>Đội ngũ kỹ thuật viên chuyên nghiệp</h3>
                <p>
                Được đào tạo bài bản và có chứng chỉ kỹ thuật cao, mỗi nhân viên đều làm việc với tinh thần trách nhiệm
                và niềm đam mê dành cho xe.
              </p>
            </div>

            <div className="why-item" data-aos="fade-up" data-aos-delay="300">
              <span className="icon" aria-hidden>
                <span className="material-symbols-outlined">
verified_user
</span>
              </span>
                <h3>Chất lượng & Uy tín hàng đầu</h3>
                <p>
                Mọi dịch vụ đều được thực hiện theo quy trình chuẩn, sử dụng linh kiện chính hãng và được bảo hành rõ
                ràng – đảm bảo sự an tâm tuyệt đối cho khách hàng.
              </p>
            </div>

            <div className="why-item" data-aos="fade-up" data-aos-delay="400">
              <span className="icon" aria-hidden>
               <span className="material-symbols-outlined">
construction
</span>
              </span>
                <h3>Trang thiết bị hiện đại</h3>
                <p>
                Gara được trang bị hệ thống máy móc, công nghệ chẩn đoán và sơn hiện đại, giúp xử lý nhanh chóng –
                chính xác – tiết kiệm chi phí.
              </p>
            </div>
          </div>
        </div>
        <div className="why-slogan">
          <p>
            <em>Hoàng Tuấn</em> – Từ tâm tạo khác biệt, từ tầm nhìn kiến tạo hành trình.
          </p>
        </div>
      </section>

      {/* BEFORE & AFTER */}
      <section className="before-after-section" data-aos="fade-up">
        <h2>
          Hành trình <span>Biến đổi</span> của chiếc xe
        </h2>
        <p>
          Từ chiếc xe cũ kỹ đến vẻ ngoài mới mẻ hoàn hảo – hãy kéo thanh trượt để xem sự khác biệt mà Gara Hoàng Tuấn
          mang lại.
        </p>

        <div className="before-after-container" ref={containerRef}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9QiOlGHmz4rC4cKgtyuOARvI-AIPP7HRbQA&s"
            alt="Xe cũ"
            className="after-image"
          />
          <div className="before-image" ref={beforeRef} style={{ width: '50%' }}>
            <img src="https://media.vov.vn/sites/default/files/2024-04/toyota-corolla_cross-1.jpg" alt="Xe mới" />
          </div>
          <div className="slider-handle" ref={handleRef} style={{ left: '50%' }}>
            <span className="slider-icon">⇆</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-overlay" />

        <div className="footer-content">
          <div className="footer-left">
            <h2 className="footer-logo">
              Auto<span>Vision</span>
            </h2>
            <p className="footer-slogan">Driving the future with innovation</p>

            <ul className="footer-info">
              <li>
                <span className="icon" aria-hidden>
                  📍
                </span>
                110 đường Hoàng Nghiêu, phố Đông, phường Đông Tiến, Thanh Hóa
              </li>
              <li>
                <span className="icon" aria-hidden>
                  📞
                </span>
                0912603603
              </li>
              <li>
                <span className="icon" aria-hidden>
                  ✉️
                </span>
                contact@autovision.vn
              </li>
            </ul>

            <div className="social-links">
              <a href="#" aria-label="Facebook">
                👍
              </a>
              <a href="#" aria-label="Instagram">
                📸
              </a>
              <a href="#" aria-label="YouTube">
                ▶️
              </a>
            </div>
          </div>

          <div className="footer-right">
            <iframe
              title="map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.483236592485!2d106.70042357592902!3d10.773374089379695!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f417f3dcb1b%3A0x123456789abcdef!2sBen%20Thanh%20Market!5e0!3m2!1sen!2s!4v1700000000000"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 AutoVision. All Rights Reserved.</p>
        </div>
      </footer>
    </main>
  );
}

