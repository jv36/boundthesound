'use client'
import { createContext, useCallback, useContext, useState } from 'react'

interface Identity {
  userId: string
  name: string
}

interface IdentityContextValue extends Identity {
  renaming: boolean
  setName: (name: string) => Promise<void>
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export function IdentityProvider({
  children,
  initial,
}: {
  children: React.ReactNode
  initial: Identity
}) {
  const [identity, setIdentity] = useState<Identity>(initial)
  const [renaming, setRenaming] = useState(false)

  const setName = useCallback(async (name: string) => {
    setRenaming(true)
    try {
      const res = await fetch('/api/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) setIdentity(await res.json())
    } finally {
      setRenaming(false)
    }
  }, [])

  return (
    <IdentityContext.Provider value={{ ...identity, renaming, setName }}>
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext)
  if (!ctx) throw new Error('useIdentity must be used within IdentityProvider')
  return ctx
}
