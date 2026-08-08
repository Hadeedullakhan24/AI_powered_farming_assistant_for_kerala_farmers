import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMyRequests, getMyRequestsSent } from '../../api/equipment'

export const EquipmentNotifications = () => {
  const { user } = useAuth(); const navigate = useNavigate()
  const received = useQuery({ queryKey: ['equipment', 'requests'], queryFn: getMyRequests, enabled: !!user, refetchInterval: 30000 })
  const sent = useQuery({ queryKey: ['equipment', 'sent'], queryFn: getMyRequestsSent, enabled: !!user, refetchInterval: 30000 })
  if (!user) return null
  const count = (received.data?.reduce((total, listing) => total + listing.requests.filter(request => request.status === 'pending').length, 0) || 0) + (sent.data?.filter(item => item.request.status === 'pending').length || 0)
  return <button aria-label="Equipment requests" onClick={() => navigate('/equipment-sharing?tab=listings')} style={{ position: 'relative', border: 'none', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 5, display: 'flex' }}><Bell size={18} />{count > 0 && <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 99, background: '#C62828', color: '#fff', fontSize: 10, display: 'grid', placeItems: 'center', fontWeight: 700 }}>{count}</span>}</button>
}
