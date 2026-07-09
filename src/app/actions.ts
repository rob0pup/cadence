"use server";

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { put } from "@vercel/blob";
import { parseBuffer } from "music-metadata";
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

/**
 * Import mp3 files uploaded from the browser. If BLOB_READ_WRITE_TOKEN is set the
 * audio and cover art go to Vercel Blob; otherwise the file is written to the local
 * `tracks/` folder and served through /api/audio (works without any cloud token).
 */
export async function uploadTracksAction(formData: FormData) {
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File);
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  let count = 0;

  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());

    let name = file.name.replace(/\.[^.]+$/, "");
    let artist = "Unknown Artist";
    let album: string | null = null;
    let duration = 0;
    let genre: string | null = null;
    let bpm: number | null = null;
    let picture: { data: Uint8Array; format: string } | undefined;

    try {
      const meta = await parseBuffer(buf, { mimeType: "audio/mpeg" });
      const c = meta.common;
      name = c.title || name;
      artist = c.artist || artist;
      album = c.album ?? null;
      duration = Math.round(meta.format.duration || 0);
      genre = c.genre?.[0] ?? null;
      bpm = c.bpm ? Math.round(c.bpm) : null;
      if (c.picture?.[0]) {
        picture = {
          data: c.picture[0].data as unknown as Uint8Array,
          format: c.picture[0].format,
        };
      }
    } catch {
      // unparseable file; keep the filename-derived defaults
    }

    let audioUrl: string;
    let imageUrl: string | null = null;
    let isLocal = true;

    if (hasBlob) {
      const uid = randomUUID();
      const blob = await put(`audio/${uid}-${file.name}`, buf, {
        access: "public",
      });
      audioUrl = blob.url;
      isLocal = false;
      if (picture) {
        const ext = picture.format.split("/").pop() ?? "jpg";
        const cover = await put(
          `covers/${uid}.${ext}`,
          Buffer.from(picture.data),
          { access: "public" },
        );
        imageUrl = cover.url;
      }
    } else {
      const dir = path.join(process.cwd(), "tracks");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, file.name), buf);
      audioUrl = `file://${file.name}`;
    }

    await prisma.song.create({
      data: { name, artist, album, duration, genre, bpm, imageUrl, audioUrl, isLocal },
    });
    count++;
  }

  revalidateTag(TAGS.songs, "max");
  return { count };
}
