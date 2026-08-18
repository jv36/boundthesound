import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Normalise a guess for comparison: lowercase, trim, collapse whitespace */
export function normaliseGuess(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

/** Simple similarity check — true if strings match after normalisation */
export function isSimilarEnough(a: string, b: string): boolean {
  return normaliseGuess(a) === normaliseGuess(b)
}

/** Format seconds as mm:ss */
export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
