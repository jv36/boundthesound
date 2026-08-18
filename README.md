# BoundTheSound

Five songs. One hidden connection. Host real-time multiplayer rooms and guess the theme before anyone else.

- **No accounts required** — every visitor gets an anonymous guest identity (a display name you can change any time) stored in a cookie.
- **Song search & previews** are powered by Apple's public [iTunes Search API](https://performance-partners.apple.com/search-api) (no API key needed).
- **Multiplayer rooms** are powered by Socket.IO running on a custom Next.js server. Room/game state is entirely in-memory — no database required.

## Requirements

- Node.js 20+
- npm

## Quick start (local, no Docker)

```bash
# 1. Install dependencies
npm install

# 2. Copy the example environment file and adjust as needed
cp .env.example .env

# 3. Start the dev server (http://localhost:3000)
npm run dev
```

## Quick start (Docker Compose)

```bash
cp .env.example .env   # then edit as needed

docker compose up --build

# App available at http://localhost:3000
```

Stop everything with `docker compose down`.

## Environment variables

Copy [.env.example](.env.example) to `.env` and fill in as needed:

| Variable   | Description                                          | Default |
| ---------- | ----------------------------------------------------- | ------- |
| `APP_URL`  | Public origin of the app, used for Socket.IO CORS      | `http://localhost:3000` |
| `PORT`     | Port the server listens on                             | `3000` |
| `NODE_ENV` | `development` or `production`                          | `development` |

No API keys are required — the iTunes Search API is public and unauthenticated.

## npm scripts

| Command          | Description |
| ------------------| ------------ |
| `npm run dev`      | Start the app in development mode (custom server + hot reload) |
| `npm run build`    | Build the app for production |
| `npm run start`    | Run the production build (`NODE_ENV=production`) |
| `npm run lint`     | Run ESLint |

## Docker / production commands

```bash
# Build the production image
docker build -t boundthesound .

# Start the production server directly (outside Docker Compose)
npm run build
npm run start
```

## Project structure

```
server.ts                  # Custom HTTP + Socket.IO server (wraps Next.js)
src/app/                    # Next.js App Router pages & API routes
src/app/api/itunes/search    # Song search endpoint (iTunes API)
src/app/api/identity         # Guest display-name endpoint
src/app/rooms                # Room browser/create/lobby/game pages
src/components/              # UI components (rooms, game)
src/hooks/                    # useSocket, useRoom, useIdentity client hooks
src/lib/itunes.ts             # iTunes Search API client
src/lib/identity.ts           # Server-side guest identity helpers
src/middleware.ts             # Ensures every visitor has a guest id/name cookie
src/server/                   # Socket.IO room + game logic (in-memory RoomManager)
```

## How guest identity works

There's no login flow. `src/middleware.ts` sets two cookies (`bts_uid`, `bts_name`) on
a visitor's first request. The display name can be changed at any time from the navbar
(pencil icon) via `POST /api/identity`.

## How multiplayer rooms work

Rooms and their game state live entirely in memory in `src/server/rooms/RoomManager.ts` —
restarting the server clears all rooms. Players take turns picking songs with a hidden
topic; everyone else guesses the topic in a text box, and the picker manually marks each
guess correct or incorrect (there's no exact-match requirement — the picker uses their
judgement, e.g. accepting "FIFA" for a topic of "FIFA songs").

