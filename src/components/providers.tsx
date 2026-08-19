'use client'
import { SocketProvider } from '@/hooks/useSocket'
import { IdentityProvider } from '@/hooks/useIdentity'
import { AudioSettingsProvider } from '@/hooks/useAudioSettings'

export function Providers({
  children,
  identity,
}: {
  children: React.ReactNode
  identity: { userId: string; name: string }
}) {
  return (
    <IdentityProvider initial={identity}>
      <AudioSettingsProvider>
        <SocketProvider>{children}</SocketProvider>
      </AudioSettingsProvider>
    </IdentityProvider>
  )
}
