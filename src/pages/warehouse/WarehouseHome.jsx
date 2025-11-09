import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function WarehouseHome() {
  const navigate = useNavigate()

  useEffect(() => {
<<<<<<< Updated upstream
    navigate('/warehouse/import/request', { replace: true })
=======
    navigate('/warehouse/export/request', { replace: true })
>>>>>>> Stashed changes
  }, [navigate])

  return null
}

