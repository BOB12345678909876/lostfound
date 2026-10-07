export function timeAgo(dateString) {
  const days = Math.floor((Date.now() - new Date(dateString)) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

export function fullDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}
