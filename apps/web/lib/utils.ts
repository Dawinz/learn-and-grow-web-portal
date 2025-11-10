export function formatPhone(phone: string): string {
  // Mask phone: +255123456789 -> +255*****6789
  if (phone.length < 8) return phone
  const countryCode = phone.slice(0, 4)
  const last4 = phone.slice(-4)
  const masked = '*'.repeat(phone.length - 8)
  return `${countryCode}${masked}${last4}`
}

export function formatEmail(email: string): string {
  // Mask email: user@example.com -> u***@example.com
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const firstChar = local[0]
  const masked = '*'.repeat(Math.max(0, local.length - 1))
  return `${firstChar}${masked}@${domain}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

