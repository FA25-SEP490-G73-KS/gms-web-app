import { useState, useEffect, useCallback } from 'react';
import '../../styles/components/hero-slider.css';

const slides = [
  {
    id: 1,
    src: '/image/gr1.jpg',
    alt: 'Garage Hoàng Tuấn - Dịch vụ sơn, bảo dưỡng, phục hồi xe ô tô chuyên nghiệp'
  },
  {
    id: 2,
    src: '/image/gr2.jpg',
    alt: 'Garage Hoàng Tuấn - Xưởng sửa chữa và bảo dưỡng ô tô hiện đại'
  },
  {
    id: 3,
    src: '/image/gr3.jpg',
    alt: 'Garage Hoàng Tuấn - Chuyên sơn phục hồi và bảo dưỡng xe ô tô'
  },
  {
    id: 4,
    src: '/image/gara.png',
    alt: 'Garage Hoàng Tuấn - Xưởng sơn, bảo dưỡng và phục hồi xe ô tô chuyên nghiệp tại Thanh Hóa'
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loadedImages, setLoadedImages] = useState(new Set([0]));

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  useEffect(() => {
    const preloadImages = [currentSlide, (currentSlide + 1) % slides.length, (currentSlide - 1 + slides.length) % slides.length];
    
    preloadImages.forEach((index) => {
      if (!loadedImages.has(index)) {
        const img = new Image();
        img.src = slides[index].src;
        img.onload = () => {
          setLoadedImages((prev) => {
            const newSet = new Set(prev);
            newSet.add(index);
            return newSet;
          });
        };
      }
    });
  }, [currentSlide, loadedImages]);

  const handleDotClick = (index) => {
    goToSlide(index);
  };

  return (
    <div className="hero-slider" role="region" aria-label="Hero slider">
      <div className="hero-slider-container">
        <div 
          className="hero-slider-wrapper"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`
          }}
        >
                 {slides.map((slide, index) => (
                   <div key={slide.id} className="hero-slide">
                     {loadedImages.has(index) || index === currentSlide ? (
                       <img
                         src={slide.src}
                         alt={slide.alt}
                         className="hero-slide-img"
                         loading={index === 0 ? 'eager' : 'lazy'}
                         fetchPriority={index === 0 ? 'high' : 'auto'}
                         decoding={index === 0 ? 'sync' : 'async'}
                         style={{
                           width: '100%',
                           height: '100%',
                           objectFit: 'cover',
                           display: 'block'
                         }}
                       />
                     ) : (
                       <div 
                         className="hero-slide-placeholder"
                         style={{
                           width: '100%',
                           height: '100%',
                           background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
                           backgroundSize: '200% 100%',
                           animation: 'shimmer 1.5s infinite'
                         }}
                       />
                     )}
                   </div>
                 ))}
        </div>

        <button
          className="hero-slider-btn hero-slider-btn-prev"
          onClick={prevSlide}
          aria-label="Ảnh trước"
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          className="hero-slider-btn hero-slider-btn-next"
          onClick={nextSlide}
          aria-label="Ảnh tiếp theo"
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="hero-slider-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`hero-slider-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Đi đến ảnh ${index + 1}`}
              type="button"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

