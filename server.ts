import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { setupSocket } from './src/server/socket'
import type { ServerToClientEvents, ClientToServerEvents } from './src/types/game'

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT ?? '3000', 10)
const hostname = process.env.HOSTNAME ?? 'localhost'

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const handler = (req: any, res: any) => handle(req, res, parse(req.url ?? '/', true))

  const httpServer = createServer(handler)

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: '/socket.io',
    cors: {
      origin: process.env.APP_URL ?? `http://localhost:${port}`,
      credentials: true,
    },
  })

  setupSocket(io)

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port} [${dev ? 'dev' : 'prod'}]`)
  })
})
