import { motion } from 'framer-motion'
import { confidenceColor } from '../../lib/utils'

interface Props {
  value: number   // 0–100
  size?: number
  strokeWidth?: number
}

export const ConfidenceRing = ({ value, size = 100, strokeWidth = 8 }: Props) => {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  const color = confidenceColor(value)

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="#E8E0D0"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <span style={{
        fontFamily: 'Poppins, sans-serif',
        fontWeight: 700,
        fontSize: size * 0.2,
        color,
        lineHeight: 1,
      }}>
        {Math.round(value)}%
      </span>
    </div>
  )
}
