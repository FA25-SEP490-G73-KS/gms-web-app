import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function WarehouseHome() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/warehouse/import/request', { replace: true })
  }, [navigate])

  return null
}

