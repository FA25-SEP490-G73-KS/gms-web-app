import React, { useEffect, useState, useCallback } from 'react'
import './ErrorAlert.css'

const ErrorAlert = ({ message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClose = useCallback(() => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300) // Đợi animation out hoàn thành
  }, [onClose])

  useEffect(() => {
    // Animation vào
    setIsAnimating(true)
    
    // Tự động ẩn sau duration
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, handleClose])

  if (!isVisible) return null

  return (
    <div
      className={`error-alert ${
        isAnimating ? 'slide-in' : 'slide-out'
      }`}
    >
      <div className="error-alert-icon-container">
        <svg
          className="error-alert-icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" fill="#EF4444" />
          <path
            d="M15 9L9 15M9 9L15 15"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="error-alert-content">
        <div className="error-alert-title">Cảnh báo</div>
        <div className="error-alert-message">{message}</div>
      </div>
      <button
        className="error-alert-close-button"
        onClick={handleClose}
        aria-label="Close"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}

export default ErrorAlert

