import { cookies } from 'next/headers'
import { USER_ID_COOKIE, NAME_COOKIE, defaultName } from './cookies'

export { USER_ID_COOKIE, NAME_COOKIE, defaultName }

export interface Identity {
  userId: string
  name: string
}

/** Reads the guest identity cookies set by middleware.ts. Server components/route handlers only. */
export function getIdentity(): Identity {
  const store = cookies()
  const userId = store.get(USER_ID_COOKIE)?.value ?? 'anonymous'
  const name = store.get(NAME_COOKIE)?.value ?? defaultName(userId)
  return { userId, name }
}
