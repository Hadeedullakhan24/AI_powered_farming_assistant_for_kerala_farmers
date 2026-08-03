import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  message?: string
  onRetry?: () => void
}

export const ErrorCard = ({ message, onRetry }: Props) => {
  const { t } = useTranslation()
  return (
    <div className="card" style={{ padding: '32px', textAlign: 'center', maxWidth: 400, margin: '40px auto' }}>
      <div style={{ color: 'var(--color-danger)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
        <AlertCircle size={40} />
      </div>
      <p style={{ color: 'var(--color-text)', marginBottom: 20, fontSize: '0.95rem' }}>
        {message ?? t('error_generic')}
      </p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry} id="error-retry-btn">
          {t('error_retry')}
        </button>
      )}
    </div>
  )
}
