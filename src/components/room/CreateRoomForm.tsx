'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRoom } from '@/hooks/useRoom'
import type { RoomSettings } from '@/types/game'
import { Eye, EyeOff, Lock, Users, Hash, Clock, RefreshCw, ListOrdered } from 'lucide-react'

const DEFAULTS: Partial<RoomSettings> = {
  maxPlayers: 8,
  totalRounds: 5,
  songsPerRound: 5,
  guessTimeSecs: 60,
  hideArtist: false,
  hideSongTitle: false,
  sequentialReveal: false,
  isPrivate: false,
}

export function CreateRoomForm() {
  const router = useRouter()
  const { createRoom } = useRoom()
  const [name, setName] = useState('')
  const [settings, setSettings] = useState<Partial<RoomSettings>>(DEFAULTS)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function toggle(key: keyof RoomSettings) {
    setSettings((s) => ({ ...s, [key]: !s[key as keyof typeof s] }))
  }

  function num(key: keyof RoomSettings, value: number) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const room = await createRoom(name.trim(), settings)
      router.push(`/rooms/${room.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="glass p-6 flex flex-col gap-5">
      {/* Room name */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Room name</label>
        <input
          className="input"
          placeholder="e.g. Friday night vibes"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Max players */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
            <Users className="h-4 w-4 text-white/40" /> Max players
          </label>
          <select
            className="input"
            value={settings.maxPlayers}
            onChange={(e) => num('maxPlayers', Number(e.target.value))}
          >
            {[2, 4, 6, 8, 10, 12, 16].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Rounds */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
            <RefreshCw className="h-4 w-4 text-white/40" /> Rounds
          </label>
          <select
            className="input"
            value={settings.totalRounds}
            onChange={(e) => num('totalRounds', Number(e.target.value))}
          >
            {[3, 5, 7, 10, 15, 20].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Songs per round */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
            <Hash className="h-4 w-4 text-white/40" /> Songs per round
          </label>
          <select
            className="input"
            value={settings.songsPerRound}
            onChange={(e) => num('songsPerRound', Number(e.target.value))}
          >
            {[3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Guess time */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
            <Clock className="h-4 w-4 text-white/40" /> Guess time (s)
          </label>
          <select
            className="input"
            value={settings.guessTimeSecs}
            onChange={(e) => num('guessTimeSecs', Number(e.target.value))}
          >
            {[30, 45, 60, 90, 120, 180].map((n) => (
              <option key={n} value={n}>{n}s</option>
            ))}
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-3">
        <Toggle
          icon={EyeOff}
          label="Hide artist names"
          checked={!!settings.hideArtist}
          onChange={() => toggle('hideArtist')}
        />
        <Toggle
          icon={Eye}
          label="Hide song titles"
          checked={!!settings.hideSongTitle}
          onChange={() => toggle('hideSongTitle')}
        />
        <Toggle
          icon={ListOrdered}
          label="Reveal songs one by one"
          checked={!!settings.sequentialReveal}
          onChange={() => toggle('sequentialReveal')}
        />
        <Toggle
          icon={Lock}
          label="Private room (invite only)"
          checked={!!settings.isPrivate}
          onChange={() => toggle('isPrivate')}
        />
      </div>

      {/* Password (only if private) */}
      {settings.isPrivate && (
        <div>
          <label className="block text-sm font-medium mb-1.5">Room password</label>
          <input
            className="input"
            placeholder="Leave empty for no password"
            value={settings.password ?? ''}
            onChange={(e) => setSettings((s) => ({ ...s, password: e.target.value }))}
            maxLength={50}
          />
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" className="btn-primary" disabled={!name.trim() || loading}>
        {loading ? 'Creating…' : 'Create room'}
      </button>
    </form>
  )
}

function Toggle({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ElementType
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-white/40" />
        {label}
      </span>
      <div
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? 'bg-green-500' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </div>
    </label>
  )
}
