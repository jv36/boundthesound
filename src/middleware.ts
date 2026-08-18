import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { USER_ID_COOKIE, NAME_COOKIE, defaultName } from '@/lib/cookies'

const ONE_YEAR = 60 * 60 * 24 * 365

// Ensures every visitor has a stable anonymous guest id + display name (no accounts, no login).
export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  let userId = req.cookies.get(USER_ID_COOKIE)?.value

  if (!userId) {
    userId = crypto.randomUUID()
    res.cookies.set(USER_ID_COOKIE, userId, { sameSite: 'lax', maxAge: ONE_YEAR, path: '/' })
  }

  if (!req.cookies.get(NAME_COOKIE)?.value) {
    res.cookies.set(NAME_COOKIE, defaultName(userId), { sameSite: 'lax', maxAge: ONE_YEAR, path: '/' })
  }

  return res
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
