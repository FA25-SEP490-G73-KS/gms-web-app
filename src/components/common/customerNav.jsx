import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function CustomerNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const items = [
    { label: 'Trang chủ', to: '/#home' },
    { label: 'Giới thiệu', to: '/about' },
    { label: 'Dịch vụ', to: '/#services' },
    { label: 'Blog', to: '/blog' },
    { label: 'Liên hệ', to: '/contact' },
  ]

  const isActive = (to) => {
    if (to === '/#home') {
      if (location.pathname === '/' && (!location.hash || location.hash === '#home')) {
        return true
      }
    }
    if (to.startsWith('/#')) {
      const hash = to.replace('/', '')
      return location.pathname === '/' && location.hash === hash
    }
    return location.pathname === to
  }

  const handleNavigate = (to) => (e) => {
    e.preventDefault()
    if (to.startsWith('/#')) {
      const hash = to.replace('/','')
      if (location.pathname !== '/') {
        navigate('/')
      }
      setTimeout(() => {
        const target = document.querySelector(hash)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        window.history.replaceState(null, '', `/${hash}`)
      }, 0)
      return
    }
    navigate(to)
  }

  const wrapper = {
    background: '#ffffff',
    borderBottom: '1px solid #eaeaea',
  }
  const container = {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '10px 5%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
  }
  const item = {
    color: '#111',
    fontWeight: 600,
    textDecoration: 'none',
    padding: '10px 16px',
    borderRadius: 12,
  }
  const itemActive = {
    background: '#CBB081',
    color: '#111',
  }

  if (isMobile) {
    return null
  }

  return (
    <div style={wrapper}>
      <nav style={container}>
        {items.map((it) => (
          <a
            key={it.to}
            href={it.to}
            onClick={handleNavigate(it.to)}
            style={{ ...item, ...(isActive(it.to) ? itemActive : null) }}
          >
            {it.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
