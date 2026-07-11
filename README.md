# Cadence

**A music player for your own library, with a player that keeps going as you browse.**

Cadence plays your local or remote audio, organizes it into playlists, and mirrors the current track to your OS media controls. A single persistent audio element lives at the root of the app, so moving between views never interrupts playback. Built with [Next.js](https://nextjs.org) and [Prisma](https://www.prisma.io) on Postgres, with a design system carried over from my [portfolio](https://robinrahman.pro).

It started from the ideas in [Lee Robinson's next-music-player](https://github.com/leerob/next-music-player) and was rebuilt on my own stack, with the rough edges fixed and a good deal added.

**Live demo:** [cadence.robinrahman.pro](https://cadence.robinrahman.pro)

## Features

- **Persistent playback** from one audio element at the app root, so moving between views never stops the music.
- **A full play queue** with shuffle and repeat (off, all, or one), a draggable seek bar, and persisted volume.
- **Resume on reload**, restoring the last track and its position.
- **Liked songs and a recently-played** history.
- **Typo-tolerant fuzzy search** over titles and artists, backed by Postgres `pg_trgm`.
- **Playlists** you can create, rename, delete, add to, and drag to reorder.
- **Album and artist** browse views.
- **A command palette** (Cmd/Ctrl + K) to search, play, or jump anywhere.
- **In-browser MP3 import** that reads the title, artist, album, and cover art from each file.
- **Media Session** support, so OS media keys, the lock screen, and bluetooth controls all work.
- **Sleep timer, light and dark themes**, a keyboard-shortcut overlay (`?`), and an installable PWA.
- **Mobile navigation** through a slide-in drawer on small screens.

## How it works

The app is server-rendered with the Next.js App Router. Server components read the library from Postgres through Prisma, and client components own playback. The one piece of state that has to survive navigation, the `<audio>` element, lives in the root layout outside the routed content and is driven imperatively through a React context. Reads are cached and tag-revalidated, and every database-backed page renders on demand, so nothing is prerendered against the database at build time. If the database is ever unreachable, the shell and playback stay alive and only the affected section shows a retry.

## Tech

- [Next.js](https://nextjs.org) 16 (App Router) and [React](https://react.dev) 19
- [Prisma](https://www.prisma.io) 6 with [Postgres](https://www.postgresql.org)
- [Tailwind CSS](https://tailwindcss.com) v4, [Radix](https://www.radix-ui.com) primitives, [Geist](https://vercel.com/font), [Lucide](https://lucide.dev), [Sonner](https://sonner.emilkowal.ski)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for uploaded audio and cover art

## Getting started

```bash
pnpm install
```

Set your database url in `.env`:

```bash
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
```

Push the schema (this creates the tables and the `pg_trgm` extension) and load sample data:

```bash
pnpm db:push
pnpm db:seed
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

## Deploying

Import the repo on [Vercel](https://vercel.com) and set the environment variables:

- `DATABASE_URL`, your Postgres connection string (Neon, Supabase, or Vercel Postgres).
- `BLOB_READ_WRITE_TOKEN`, a Vercel Blob token so in-app import can store uploads. Without it, import falls back to the local `tracks/` folder, which only works in dev.
- Auth0 (from the [Auth0 Vercel integration](https://vercel.com/marketplace/auth0), which provisions these): `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, and `APP_BASE_URL`. Enable the Google and GitHub connections in the Auth0 dashboard. Signing in is required for library and playlist changes; logged-out visitors get a read-only demo.
- Spotify (optional, for connecting a Spotify account): `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` from a [Spotify developer app](https://developer.spotify.com/dashboard), with `${APP_BASE_URL}/api/spotify/callback` registered as a redirect URI. Full-track playback needs Spotify Premium.

Then run `pnpm db:push` once against the production database. Pages that read the database render on demand, so nothing is prerendered against it at build.

## Credits

Started from [Lee Robinson's next-music-player](https://github.com/leerob/next-music-player). Built by [Robin](https://robinrahman.pro). MIT licensed.
