import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getIdentity, NAME_COOKIE } from '@/lib/identity'

const NameSchema = z.object({ name: z.string().trim().min(1).max(24) })

/** POST /api/identity — rename the current guest */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = NameSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid name' }, { status: 400 })

  const { userId } = getIdentity()
  const res = NextResponse.json({ userId, name: parsed.data.name })
  res.cookies.set(NAME_COOKIE, parsed.data.name, {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return res
}
