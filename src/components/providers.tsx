'use client'
import { SocketProvider } from '@/hooks/useSocket'
import { IdentityProvider } from '@/hooks/useIdentity'

export function Providers({
  children,
  identity,
}: {
  children: React.ReactNode
  identity: { userId: string; name: string }
}) {
  return (
    <IdentityProvider initial={identity}>
      <SocketProvider>{children}</SocketProvider>
    </IdentityProvider>
  )
}
