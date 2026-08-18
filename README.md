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

## Deploying to a VPS (with your own domain)

Since rooms live in-memory in a single process, this needs to run as **one persistent
container**, not on autoscaled/serverless hosting. Any small VPS works — 2GB RAM / 2 vCPUs
is comfortable. Recommended OS: **Ubuntu 22.04 LTS**. [docker-compose.prod.yml](docker-compose.prod.yml)
adds [Caddy](https://caddyserver.com) in front of the app as a reverse proxy that gets you
free, auto-renewing HTTPS with zero config.

1. **Get into the VPS and do basic hardening** (OVHcloud emails you the root password):

   ```bash
   ssh root@<your-vps-ipv4>

   # Create a non-root sudo user instead of using root day-to-day
   adduser deploy
   usermod -aG sudo deploy
   rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy/   # if you used an SSH key
   ```

   Log back in as `ssh deploy@<your-vps-ipv4>` for everything below. Check the OVHcloud
   control panel too — if you enabled its "Network Firewall" on the VPS, allow ports
   22/80/443 there as well (the `ufw` rules below only cover the OS firewall).

2. **Point DNS at the server in Cloudflare:**
   - Add an `A` record: `boundthesound` → the VPS's IPv4 address (this is for `boundthesound.joaovicente.dev`)
   - Add an `AAAA` record: `boundthesound` → the VPS's IPv6 address (optional)
   - Set the proxy status to **DNS only** (grey cloud, not orange) for now

   Caddy needs to talk directly to the internet on port 80 to get its first HTTPS
   certificate (ACME HTTP challenge) — Cloudflare's proxy would intercept that. Once the
   site is confirmed working over plain DNS, you can switch the record to **Proxied**
   (orange cloud) for Cloudflare's CDN/DDoS protection; just also set **SSL/TLS mode** to
   **Full (strict)** in Cloudflare so it trusts Caddy's certificate, and confirm
   **WebSockets** are enabled (Network tab — on by default) since Socket.IO needs them.

   Wait for DNS to propagate (`dig boundthesound.joaovicente.dev` should show the VPS IP).

3. **Provision the server:**

   ```bash
   sudo apt update && sudo apt upgrade -y
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER   # log out/in again after this
   sudo apt install -y docker-compose-plugin ufw

   # Firewall: only SSH, HTTP, HTTPS
   sudo ufw allow OpenSSH
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw --force enable

   # A small swap file helps `npm run build` on low-RAM VPS instances
   sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

4. **Clone the repo and configure it:**

   ```bash
   git clone https://github.com/jv36/boundthesound.git
   cd boundthesound

   cp .env.example .env
   # Edit .env — set APP_URL=https://boundthesound.joaovicente.dev
   ```

   The Caddyfile is already configured for `boundthesound.joaovicente.dev`.

5. **Build and start:**

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

   Caddy will automatically request a Let's Encrypt certificate for your domain on first
   request — give it a minute, then visit `https://boundthesound.joaovicente.dev`.

6. **Useful commands:**

   ```bash
   docker compose -f docker-compose.prod.yml logs -f        # tail logs
   docker compose -f docker-compose.prod.yml down            # stop everything
   git pull && docker compose -f docker-compose.prod.yml up -d --build   # deploy an update
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

