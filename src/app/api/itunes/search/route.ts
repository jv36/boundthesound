import { NextRequest, NextResponse } from 'next/server'
import { searchTracks, trackToSong } from '@/lib/itunes'

/** GET /api/itunes/search?q=... */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 10), 20)

  try {
    const tracks = await searchTracks(q, limit)
    return NextResponse.json(tracks.map(trackToSong))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'iTunes error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
