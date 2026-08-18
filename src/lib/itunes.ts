import type { Song } from '@/types/game'

export interface ITunesTrack {
  trackId: number
  trackName: string
  artistName: string
  collectionName: string
  artworkUrl100: string
  previewUrl: string | null
  trackViewUrl: string
}

/** Upgrades iTunes' default 100x100 artwork thumbnail to a larger size. */
function upscaleArtwork(url: string | undefined): string {
  if (!url) return ''
  return url.replace('100x100bb', '600x600bb')
}

export async function searchTracks(query: string, limit = 10): Promise<ITunesTrack[]> {
  const params = new URLSearchParams({ term: query, media: 'music', entity: 'song', limit: String(limit) })
  const res = await fetch(`https://itunes.apple.com/search?${params}`, { cache: 'no-store' })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`iTunes search error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return (data.results ?? []) as ITunesTrack[]
}

export function trackToSong(track: ITunesTrack): Song {
  return {
    trackId: String(track.trackId),
    title: track.trackName,
    artist: track.artistName,
    album: track.collectionName,
    albumArt: upscaleArtwork(track.artworkUrl100),
    previewUrl: track.previewUrl ?? null,
    externalUrl: track.trackViewUrl,
  }
}
