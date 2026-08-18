export const USER_ID_COOKIE = 'bts_uid'
export const NAME_COOKIE = 'bts_name'

/** Deterministic fallback display name derived from the guest id. */
export function defaultName(userId: string): string {
  return `Player${userId.replace(/-/g, '').slice(0, 4).toUpperCase()}`
}

/** Parses a raw `Cookie` request header into a key/value map. */
export function parseCookieHeader(header?: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (key) out[key] = decodeURIComponent(value)
  }
  return out
}
