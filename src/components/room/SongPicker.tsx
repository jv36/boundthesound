'use client'
import { useState, useCallback } from 'react'
import type { Song } from '@/types/game'
import { SongCard } from '@/components/game/SongCard'
import { Search, Loader2 } from 'lucide-react'

interface SongPickerProps {
  maxSongs: number
  onSubmit: (songs: Song[], topic: string) => void
  disabled?: boolean
}

export function SongPicker({ maxSongs, onSubmit, disabled }: SongPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Song[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Song[]>([])
  const [topic, setTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const search = useCallback(async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/itunes/search?q=${encodeURIComponent(query)}&limit=8`)
      const songs: Song[] = await res.json()
      setResults(songs)
    } finally {
      setSearching(false)
    }
  }, [query])

  function selectSong(song: Song) {
    if (selected.length >= maxSongs) return
    if (selected.some((s) => s.trackId === song.trackId)) return
    setSelected((prev) => [...prev, song])
  }

  function removeSong(trackId: string) {
    setSelected((prev) => prev.filter((s) => s.trackId !== trackId))
  }

  async function submit() {
    if (selected.length < 3 || !topic.trim() || submitting) return
    setSubmitting(true)
    await onSubmit(selected, topic.trim())
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="glass p-5">
        <h2 className="font-semibold text-lg mb-1">Your turn to pick!</h2>
        <p className="text-sm text-white/50">
          Choose {maxSongs} songs with a hidden common theme. Only you can see the topic until the round ends.
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Search iTunes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button onClick={search} className="btn-secondary" disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wide">Results</p>
          {results.map((song) => (
            <SongCard
              key={song.trackId}
              song={song}
              selectable
              selected={selected.some((s) => s.trackId === song.trackId)}
              onSelect={() => selectSong(song)}
            />
          ))}
        </div>
      )}

      {/* Selected songs */}
      <div>
        <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">
          Selected ({selected.length}/{maxSongs})
        </p>
        {selected.length === 0 ? (
          <div className="glass py-8 text-center text-white/30 text-sm">
            Select songs from the search results
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {selected.map((song, i) => (
              <SongCard
                key={song.trackId}
                song={song}
                index={i}
                onRemove={() => removeSong(song.trackId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Topic */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Common topic <span className="text-white/40">(only you can see this)</span>
        </label>
        <input
          className="input"
          placeholder="e.g. Songs about heartbreak, 90s boyband hits, …"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={100}
        />
      </div>

      <button
        onClick={submit}
        className="btn-primary"
        disabled={selected.length < 3 || !topic.trim() || submitting || disabled}
      >
        {submitting ? 'Revealing…' : `Reveal ${selected.length} songs to everyone`}
      </button>
    </div>
  )
}
