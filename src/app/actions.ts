"use server";

import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/queries";

export async function createPlaylistAction(name = "New Playlist") {
  const playlist = await prisma.playlist.create({ data: { name } });
  revalidateTag(TAGS.playlists, "max");
  return playlist;
}

export async function renamePlaylistAction(id: string, name: string) {
  await prisma.playlist.update({ where: { id }, data: { name } });
  revalidateTag(TAGS.playlists, "max");
}

export async function deletePlaylistAction(id: string) {
  // playlist_songs rows cascade on delete via the schema relation
  await prisma.playlist.delete({ where: { id } });
  revalidateTag(TAGS.playlists, "max");
}

export async function addSongToPlaylistAction(
  playlistId: string,
  songId: string,
) {
  const existing = await prisma.playlistSong.findUnique({
    where: { playlistId_songId: { playlistId, songId } },
  });
  if (existing) return { ok: false, message: "already in playlist" };

  const max = await prisma.playlistSong.aggregate({
    where: { playlistId },
    _max: { order: true },
  });
  await prisma.playlistSong.create({
    data: { playlistId, songId, order: (max._max.order ?? -1) + 1 },
  });
  revalidateTag(TAGS.playlists, "max");
  return { ok: true, message: "added to playlist" };
}

export async function removeSongFromPlaylistAction(
  playlistId: string,
  songId: string,
) {
  await prisma.playlistSong.deleteMany({ where: { playlistId, songId } });
  revalidateTag(TAGS.playlists, "max");
}

export async function reorderPlaylistAction(
  playlistId: string,
  orderedSongIds: string[],
) {
  await prisma.$transaction(
    orderedSongIds.map((songId, order) =>
      prisma.playlistSong.updateMany({
        where: { playlistId, songId },
        data: { order },
      }),
    ),
  );
  revalidateTag(TAGS.playlists, "max");
}

export async function toggleLikeAction(songId: string) {
  const existing = await prisma.likedSong.findUnique({ where: { songId } });
  if (existing) {
    await prisma.likedSong.delete({ where: { songId } });
  } else {
    await prisma.likedSong.create({ data: { songId } });
  }
  revalidateTag(TAGS.likes, "max");
  return { liked: !existing };
}

export async function recordPlayAction(songId: string) {
  await prisma.playHistory.create({ data: { songId } });
  revalidateTag(TAGS.history, "max");
}

export async function updateTrackAction(
  id: string,
  data: Partial<{
    name: string;
    artist: string;
    album: string;
    genre: string;
    bpm: number;
    key: string;
  }>,
) {
  await prisma.song.update({ where: { id }, data });
  revalidateTag(TAGS.songs, "max");
}
