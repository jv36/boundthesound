import Link from 'next/link'
import { Plus } from 'lucide-react'
import { RoomsBrowser } from '@/components/room/RoomsBrowser'

export default function RoomsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Rooms</h1>
          <p className="text-white/50 mt-1">Join a public room or create your own</p>
        </div>
        <Link href="/rooms/create" className="btn-primary">
          <Plus className="h-4 w-4" />
          New room
        </Link>
      </div>

      <RoomsBrowser />
    </div>
  )
}
