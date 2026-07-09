# cadence

a music player for your own library. built with next.js, it plays local or remote
audio, organizes tracks into playlists, and keeps playing while you browse.

this started from the ideas in lee robinson's next-music-player and was rebuilt on my
own stack (prisma instead of drizzle) with a design system carried over from my
portfolio, plus fixes and features of my own.

## features

- a single persistent audio element, so playback never stops when you navigate
- play queue with shuffle and repeat (off / all / one)
- liked songs and recently played
- fuzzy search over title and artist (postgres pg_trgm)
- playlists: create, rename, delete, add and reorder tracks
- resume the last track and position on reload, with persisted volume
- media session support, so os media keys and the lock screen control playback
- keyboard shortcuts (space to play or pause, "/" to search)
- light and dark themes
- graceful error and loading states, the app shell stays alive even if the database is down

## stack

- next.js 16 (app router) and react 19
- prisma 6 with postgres
- tailwind css v4, radix primitives, geist, lucide, sonner
- vercel blob for uploaded audio and cover art

## getting started

```bash
pnpm install
```

set your database url in `.env`:

```bash
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
```

push the schema (creates the tables and the pg_trgm extension) and seed sample data:

```bash
pnpm db:push
pnpm db:seed
```

run the dev server:

```bash
pnpm dev
```

open http://localhost:3000.

## scripts

- `pnpm dev` start the dev server
- `pnpm build` production build
- `pnpm db:push` sync the schema to the database
- `pnpm db:seed` load sample tracks and playlists
- `pnpm db:studio` open prisma studio

## license

mit
