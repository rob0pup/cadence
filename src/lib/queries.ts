import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { PlaylistWithSongs, Song } from "@/lib/types";

export const TAGS = {
  songs: "songs",
  playlists: "playlists",
  likes: "likes",
  history: "history",
} as const;

export const getAllSongs = unstable_cache(
  async (): Promise<Song[]> => {
    return prisma.song.findMany({ orderBy: { name: "asc" } });
  },
  ["all-songs"],
  { tags: [TAGS.songs] },
);

export const getSongById = unstable_cache(
  async (id: string): Promise<Song | null> => {
    return prisma.song.findUnique({ where: { id } });
  },
  ["song-by-id"],
  { tags: [TAGS.songs] },
);

/**
 * Fuzzy search over name/artist/album using the pg_trgm similarity() function.
 * Falls back gracefully to an empty result if the term is blank.
 */
export const searchSongs = unstable_cache(
  async (term: string): Promise<Song[]> => {
    const q = term.trim();
    if (!q) return [];
    // Columns are camelCase (Prisma maps fields 1:1 unless @map is used), so
    // they must be double-quoted to preserve case in raw SQL.
    return prisma.$queryRaw<Song[]>`
      SELECT
        id, name, artist, album, duration, genre, bpm, "key",
        "imageUrl", "audioUrl", "isLocal", "createdAt", "updatedAt"
      FROM songs
      WHERE
        similarity(name, ${q}) > 0.1
        OR similarity(artist, ${q}) > 0.1
        OR similarity(COALESCE(album, ''), ${q}) > 0.1
        OR name ILIKE ${"%" + q + "%"}
        OR artist ILIKE ${"%" + q + "%"}
      ORDER BY GREATEST(
        similarity(name, ${q}),
        similarity(artist, ${q}),
        similarity(COALESCE(album, ''), ${q})
      ) DESC, name ASC
      LIMIT 50;
    `;
  },
  ["search-songs"],
  { tags: [TAGS.songs] },
);

export const getAllPlaylists = unstable_cache(
  async () => {
    return prisma.playlist.findMany({ orderBy: { createdAt: "desc" } });
  },
  ["all-playlists"],
  { tags: [TAGS.playlists] },
);

export const getPlaylistWithSongs = unstable_cache(
  async (id: string): Promise<PlaylistWithSongs | null> => {
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        playlistSongs: {
          orderBy: { order: "asc" },
          include: { song: true },
        },
      },
    });
    if (!playlist) return null;
    const songs = playlist.playlistSongs.map((ps) => ps.song);
    return {
      id: playlist.id,
      name: playlist.name,
      coverUrl: playlist.coverUrl,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      songs,
      trackCount: songs.length,
      duration: songs.reduce((t, s) => t + s.duration, 0),
    };
  },
  ["playlist-with-songs"],
  { tags: [TAGS.playlists, TAGS.songs] },
);

export const getLikedSongIds = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await prisma.likedSong.findMany({ select: { songId: true } });
    return rows.map((r) => r.songId);
  },
  ["liked-song-ids"],
  { tags: [TAGS.likes] },
);

export const getLikedSongs = unstable_cache(
  async (): Promise<Song[]> => {
    const rows = await prisma.likedSong.findMany({
      orderBy: { likedAt: "desc" },
      include: { song: true },
    });
    return rows.map((r) => r.song);
  },
  ["liked-songs"],
  { tags: [TAGS.likes, TAGS.songs] },
);

export const getRecentlyPlayed = unstable_cache(
  async (limit = 30): Promise<Song[]> => {
    const rows = await prisma.playHistory.findMany({
      orderBy: { playedAt: "desc" },
      take: limit * 3,
      include: { song: true },
    });
    // de-dupe by song, keep most recent
    const seen = new Set<string>();
    const out: Song[] = [];
    for (const r of rows) {
      if (seen.has(r.songId)) continue;
      seen.add(r.songId);
      out.push(r.song);
      if (out.length >= limit) break;
    }
    return out;
  },
  ["recently-played"],
  { tags: [TAGS.history] },
);
