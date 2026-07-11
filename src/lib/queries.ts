import "server-only";

import { unstable_cache } from "next/cache";

import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { GroupSummary, PlaylistWithSongs, Song } from "@/lib/types";

export const TAGS = {
  songs: "songs",
  playlists: "playlists",
  likes: "likes",
  history: "history",
} as const;

/**
 * Scope content to the viewer: a signed-in user sees only their own rows,
 * a logged-out visitor sees the shared demo library.
 */
function ownerWhere(userId: string | null) {
  return userId ? { userId } : { isDemo: true };
}

export const getAllSongs = unstable_cache(
  async (userId: string | null): Promise<Song[]> => {
    return prisma.song.findMany({
      where: ownerWhere(userId),
      orderBy: { name: "asc" },
    });
  },
  ["all-songs"],
  { tags: [TAGS.songs] },
);

export const searchSongs = unstable_cache(
  async (term: string, userId: string | null): Promise<Song[]> => {
    const q = term.trim();
    if (!q) return [];
    const owner = userId
      ? Prisma.sql`"userId" = ${userId}`
      : Prisma.sql`"isDemo" = true`;
    return prisma.$queryRaw<Song[]>`
      SELECT
        id, name, artist, album, duration, genre, bpm, "key",
        "imageUrl", "audioUrl", "isLocal", "isDemo", "userId",
        "createdAt", "updatedAt"
      FROM songs
      WHERE (${owner}) AND (
        similarity(name, ${q}) > 0.1
        OR similarity(artist, ${q}) > 0.1
        OR similarity(COALESCE(album, ''), ${q}) > 0.1
        OR name ILIKE ${"%" + q + "%"}
        OR artist ILIKE ${"%" + q + "%"}
      )
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
  async (userId: string | null) => {
    return prisma.playlist.findMany({
      where: ownerWhere(userId),
      orderBy: { createdAt: "desc" },
    });
  },
  ["all-playlists"],
  { tags: [TAGS.playlists] },
);

export const getPlaylistWithSongs = unstable_cache(
  async (
    id: string,
    userId: string | null,
  ): Promise<PlaylistWithSongs | null> => {
    const playlist = await prisma.playlist.findFirst({
      where: { id, ...ownerWhere(userId) },
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

export type { GroupSummary };

export const getAlbums = unstable_cache(
  async (userId: string | null): Promise<GroupSummary[]> => {
    const songs = await prisma.song.findMany({
      where: ownerWhere(userId),
      orderBy: { name: "asc" },
    });
    const map = new Map<string, GroupSummary>();
    for (const s of songs) {
      if (!s.album) continue;
      const e = map.get(s.album);
      if (e) {
        e.count++;
        if (!e.coverUrl && s.imageUrl) e.coverUrl = s.imageUrl;
      } else {
        map.set(s.album, {
          name: s.album,
          subtitle: s.artist,
          count: 1,
          coverUrl: s.imageUrl,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  },
  ["albums"],
  { tags: [TAGS.songs] },
);

export const getArtists = unstable_cache(
  async (userId: string | null): Promise<GroupSummary[]> => {
    const songs = await prisma.song.findMany({
      where: ownerWhere(userId),
      orderBy: { name: "asc" },
    });
    const map = new Map<string, GroupSummary>();
    for (const s of songs) {
      const e = map.get(s.artist);
      if (e) {
        e.count++;
        if (!e.coverUrl && s.imageUrl) e.coverUrl = s.imageUrl;
      } else {
        map.set(s.artist, {
          name: s.artist,
          subtitle: "Artist",
          count: 1,
          coverUrl: s.imageUrl,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  },
  ["artists"],
  { tags: [TAGS.songs] },
);

export const getAlbumSongs = unstable_cache(
  async (album: string, userId: string | null): Promise<Song[]> => {
    return prisma.song.findMany({
      where: { album, ...ownerWhere(userId) },
      orderBy: { name: "asc" },
    });
  },
  ["album-songs"],
  { tags: [TAGS.songs] },
);

export const getArtistSongs = unstable_cache(
  async (artist: string, userId: string | null): Promise<Song[]> => {
    return prisma.song.findMany({
      where: { artist, ...ownerWhere(userId) },
      orderBy: { name: "asc" },
    });
  },
  ["artist-songs"],
  { tags: [TAGS.songs] },
);

export const getLikedSongIds = unstable_cache(
  async (userId: string | null): Promise<string[]> => {
    if (!userId) return [];
    const rows = await prisma.likedSong.findMany({
      where: { userId },
      select: { songId: true },
    });
    return rows.map((r) => r.songId);
  },
  ["liked-song-ids"],
  { tags: [TAGS.likes] },
);

export const getLikedSongs = unstable_cache(
  async (userId: string | null): Promise<Song[]> => {
    if (!userId) return [];
    const rows = await prisma.likedSong.findMany({
      where: { userId },
      orderBy: { likedAt: "desc" },
      include: { song: true },
    });
    return rows.map((r) => r.song);
  },
  ["liked-songs"],
  { tags: [TAGS.likes, TAGS.songs] },
);

export const getRecentlyPlayed = unstable_cache(
  async (userId: string | null, limit = 30): Promise<Song[]> => {
    if (!userId) return [];
    const rows = await prisma.playHistory.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      take: limit * 3,
      include: { song: true },
    });
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
