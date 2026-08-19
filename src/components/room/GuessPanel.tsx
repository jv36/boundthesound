'use client'
import { useState } from 'react'
import { useSocket } from '@/hooks/useSocket'
import type { Guess } from '@/types/game'
import { Check, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GuessPanelProps {
  guesses: Guess[]
  roomId: string
  isPicker: boolean
  currentUserId: string
  /** 'idle' = can submit a guess, 'pending' = awaiting picker validation, 'correct' = already got it */
  guessStatus: 'idle' | 'pending' | 'correct'
  /** How many guesses this player has already made this round (for the "more guesses = fewer points" hint) */
  myGuessCount: number
  disabled?: boolean
}

export function GuessPanel({
  guesses,
  roomId,
  isPicker,
  currentUserId,
  guessStatus,
  myGuessCount,
  disabled,
}: GuessPanelProps) {
  const socket = useSocket()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function submitGuess(e: React.FormEvent) {
    e.preventDefault()
    if (!socket || !text.trim() || submitting) return
    setSubmitting(true)
    setError('')
    socket.emit('game:guess', { text: text.trim() }, (res) => {
      if (res.error) setError(res.error)
      else setText('')
      setSubmitting(false)
    })
  }

  function validate(guessPlayerId: string, isCorrect: boolean) {
    socket?.emit('game:validate', { guessPlayerId, isCorrect }, () => {})
  }

  return (
    <div className="glass p-4 flex flex-col gap-3">
      <p className="text-xs font-medium text-white/40 uppercase tracking-wide">
        Guesses ({guesses.length})
      </p>

      {/* Guess list */}
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {guesses.length === 0 && (
          <p className="text-sm text-white/30 text-center py-4">No guesses yet…</p>
        )}
        {guesses.map((guess) => {
          const isOwn = guess.playerId === currentUserId
          const isHiddenFromMe = guess.isCorrect === true && !isOwn && !guess.text
          return (
          <div
            key={`${guess.playerId}-${guess.timestamp}`}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm animate-slide-up',
              guess.isCorrect === true
                ? 'bg-green-500/10 border border-green-500/30'
                : guess.isCorrect === false
                ? 'bg-white/3 border border-white/5 opacity-50'
                : 'bg-white/5 border border-white/10',
            )}
          >
            <div className="flex-1 min-w-0">
              <span className="text-white/50 text-xs">{guess.playerName}: </span>
              {isHiddenFromMe ? (
                <span className="italic text-white/40">guessed correctly (hidden)</span>
              ) : (
                <span className={guess.isCorrect === false ? 'line-through text-white/40' : ''}>
                  {guess.text}
                </span>
              )}
              {guess.points ? (
                <span className="ml-2 text-xs text-green-400 font-semibold">+{guess.points}</span>
              ) : null}
            </div>

            {/* Picker validation buttons — only for unvalidated guesses */}
            {isPicker && guess.isCorrect === undefined && (
              <div className="flex gap-1 flex-none">
                <button
                  onClick={() => validate(guess.playerId, true)}
                  className="p-1 rounded-md bg-green-500/20 hover:bg-green-500/40 text-green-400 transition-colors"
                  title="Mark correct"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => validate(guess.playerId, false)}
                  className="p-1 rounded-md bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                  title="Mark wrong"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          )
        })}
      </div>

      {/* Input (non-pickers only) */}
      {!isPicker && guessStatus === 'idle' && (
        <>
          <form onSubmit={submitGuess} className="flex gap-2 mt-1">
            <input
              className="input flex-1"
              placeholder="What's the connection?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={disabled || submitting}
            />
            <button type="submit" className="btn-primary px-3" disabled={!text.trim() || submitting}>
              <Send className="h-4 w-4" />
            </button>
          </form>
          {myGuessCount > 0 && (
            <p className="text-xs text-white/30">
              Guess #{myGuessCount + 1} — the more guesses it takes, the fewer points it's worth.
            </p>
          )}
        </>
      )}

      {guessStatus === 'pending' && !isPicker && (
        <p className="text-sm text-white/40 text-center py-1">
          Waiting for the picker to validate…
        </p>
      )}

      {guessStatus === 'correct' && !isPicker && (
        <p className="text-sm text-green-400 text-center py-1">You got it! 🎉</p>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
