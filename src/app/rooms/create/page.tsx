import { CreateRoomForm } from '@/components/room/CreateRoomForm'

export default function CreateRoomPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Create a room</h1>
      <p className="text-white/50 mb-8">Set up your game options and invite friends</p>
      <CreateRoomForm />
    </div>
  )
}
