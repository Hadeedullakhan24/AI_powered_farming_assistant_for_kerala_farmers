export const cn = (...classes: (string | undefined | false | null)[]) =>
  classes.filter(Boolean).join(' ')

export const confidenceColor = (conf: number) => {
  if (conf >= 85) return 'var(--color-success)'
  if (conf >= 60) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

export const confidenceClass = (conf: number) => {
  if (conf >= 85) return 'conf-high'
  if (conf >= 60) return 'conf-medium'
  return 'conf-low'
}

export const scoreColor = (score: number) => {
  if (score >= 70) return { bg: '#E8F5E9', text: '#1B5E20', label: 'green' }
  if (score >= 40) return { bg: '#FFF8E1', text: '#F57F17', label: 'amber' }
  return { bg: '#FFEBEE', text: '#C62828', label: 'red' }
}

export const riskBadgeClass = (level: string) => {
  const l = level.toLowerCase()
  if (l === 'low') return 'badge badge-green'
  if (l === 'medium') return 'badge badge-amber'
  return 'badge badge-red'
}

export const formatDiseaseName = (name: string) =>
  name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export const parseDoesage = (dosageStr: string) => {
  const idx = dosageStr.indexOf(':')
  if (idx === -1) return { name: dosageStr, amount: '' }
  return {
    name: dosageStr.slice(0, idx).trim(),
    amount: dosageStr.slice(idx + 1).trim(),
  }
}
