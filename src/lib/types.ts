// Plain types mirroring the Prisma models, used by client components so the
// Prisma client is never pulled into the browser bundle. Server queries return
// structurally-compatible objects.

export type Song = {
  id: string;
  name: string;
  artist: string;
  album: string | null;
  duration: number;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  imageUrl: string | null;
  audioUrl: string;
  isLocal: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type Playlist = {
  id: string;
  name: string;
  coverUrl: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type PlaylistWithSongs = Playlist & {
  songs: Song[];
  trackCount: number;
  duration: number;
};

export type RepeatMode = "off" | "all" | "one";

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
};
