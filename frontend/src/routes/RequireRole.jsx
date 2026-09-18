import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RequireRole({ roles, children }) {
  const { hasRole } = useAuth()
  const location = useLocation()

  if (!hasRole(...roles)) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />
  }

  return children
}