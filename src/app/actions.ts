"use server";

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { put } from "@vercel/blob";
import { parseBuffer } from "music-metadata";
import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/queries";
import { getAuthUser, requireUser } from "@/lib/session";

export async function createPlaylistAction(name = "New Playlist") {
  const user = await requireUser();
  const playlist = await prisma.playlist.create({
    data: { name, userId: user.id },
  });
  revalidateTag(TAGS.playlists, "max");
  return playlist;
}

export async function renamePlaylistAction(id: string, name: string) {
  const user = await requireUser();
  await prisma.playlist.updateMany({
    where: { id, userId: user.id },
    data: { name },
  });
  revalidateTag(TAGS.playlists, "max");
}

export async function deletePlaylistAction(id: string) {
  const user = await requireUser();
  // playlist_songs rows cascade on delete via the schema relation
  await prisma.playlist.deleteMany({ where: { id, userId: user.id } });
  revalidateTag(TAGS.playlists, "max");
}

export async function setPlaylistPublicAction(id: string, isPublic: boolean) {
  const user = await requireUser();
  await prisma.playlist.updateMany({
    where: { id, userId: user.id },
    data: { isPublic },
  });
  revalidateTag(TAGS.playlists, "max");
  return { isPublic };
}

export async function addSongToPlaylistAction(
  playlistId: string,
  songId: string,
) {
  const user = await requireUser();
  // both the playlist and the song must belong to the user
  const [playlist, song] = await Promise.all([
    prisma.playlist.findFirst({
      where: { id: playlistId, userId: user.id },
      select: { id: true },
    }),
    prisma.song.findFirst({
      where: { id: songId, userId: user.id },
      select: { id: true },
    }),
  ]);
  if (!playlist || !song) return { ok: false, message: "Not found" };

  const existing = await prisma.playlistSong.findUnique({
    where: { playlistId_songId: { playlistId, songId } },
  });
  if (existing) return { ok: false, message: "Already in playlist" };

  const max = await prisma.playlistSong.aggregate({
    where: { playlistId },
    _max: { order: true },
  });
  await prisma.playlistSong.create({
    data: { playlistId, songId, order: (max._max.order ?? -1) + 1 },
  });
  revalidateTag(TAGS.playlists, "max");
  return { ok: true, message: "Added to playlist" };
}

export async function removeSongFromPlaylistAction(
  playlistId: string,
  songId: string,
) {
  const user = await requireUser();
  await prisma.playlistSong.deleteMany({
    where: { playlistId, songId, playlist: { userId: user.id } },
  });
  revalidateTag(TAGS.playlists, "max");
}

export async function reorderPlaylistAction(
  playlistId: string,
  orderedSongIds: string[],
) {
  const user = await requireUser();
  const owned = await prisma.playlist.findFirst({
    where: { id: playlistId, userId: user.id },
    select: { id: true },
  });
  if (!owned) return;
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
  const user = await requireUser();
  const key = { userId_songId: { userId: user.id, songId } };
  const existing = await prisma.likedSong.findUnique({ where: key });
  if (existing) {
    await prisma.likedSong.delete({ where: key });
  } else {
    await prisma.likedSong.create({ data: { userId: user.id, songId } });
  }
  revalidateTag(TAGS.likes, "max");
  return { liked: !existing };
}

export async function recordPlayAction(songId: string) {
  // silent no-op for logged-out demo listeners
  const user = await getAuthUser();
  if (!user) return;
  await prisma.playHistory.create({ data: { userId: user.id, songId } });
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
  const user = await requireUser();
  await prisma.song.updateMany({ where: { id, userId: user.id }, data });
  revalidateTag(TAGS.songs, "max");
}

/**
 * Store an audio buffer (Vercel Blob when a token is set, otherwise the local
 * `tracks/` folder) and create a Song owned by the user. Returns the song name.
 */
async function storeAndCreateTrack(
  buf: Buffer,
  filename: string,
  userId: string,
  bpmHint?: number | null,
) {
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  let name = filename.replace(/\.[^.]+$/, "");
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
    // unparseable; keep the filename-derived defaults
  }

  // fall back to a detected bpm when the file's own tags don't carry one
  if (bpm == null && bpmHint != null) bpm = bpmHint;

  let audioUrl: string;
  let imageUrl: string | null = null;
  let isLocal = true;

  if (hasBlob) {
    const uid = randomUUID();
    const blob = await put(`audio/${uid}-${filename}`, buf, {
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
    await fs.writeFile(path.join(dir, filename), buf);
    audioUrl = `file://${filename}`;
  }

  await prisma.song.create({
    data: {
      name,
      artist,
      album,
      duration,
      genre,
      bpm,
      imageUrl,
      audioUrl,
      isLocal,
      userId,
    },
  });
  return name;
}

/** Import mp3 files uploaded from the browser into the signed-in user's library. */
export async function uploadTracksAction(formData: FormData) {
  const user = await requireUser();
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File);

  // optional client-detected bpm hints, one per file in order
  let bpms: (number | null)[] = [];
  try {
    const raw = formData.get("bpms");
    if (raw) bpms = JSON.parse(String(raw));
  } catch {
    bpms = [];
  }

  let count = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buf = Buffer.from(await file.arrayBuffer());
    await storeAndCreateTrack(buf, file.name, user.id, bpms[i] ?? null);
    count++;
  }
  revalidateTag(TAGS.songs, "max");
  return { count };
}

const MAX_IMPORT_BYTES = 50 * 1024 * 1024; // 50 MB

/** Turn a Google Drive / Dropbox share link into a direct-download url. */
function normalizeCloudUrl(url: URL): URL {
  const host = url.hostname;
  if (host.endsWith("dropbox.com")) {
    url.searchParams.set("dl", "1");
    return url;
  }
  if (host.endsWith("drive.google.com")) {
    const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get("id");
    if (id) {
      return new URL(`https://drive.google.com/uc?export=download&id=${id}`);
    }
  }
  return url;
}

/**
 * Import a track from a public audio url (including Google Drive / Dropbox
 * share links) into the signed-in user's library.
 */
export async function importFromUrlAction(rawUrl: string) {
  const user = await requireUser();

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, message: "Enter a valid URL" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, message: "Only http(s) links are supported" };
  }

  const direct = normalizeCloudUrl(url);
  let res: Response;
  try {
    res = await fetch(direct, {
      redirect: "follow",
      // a browser-like user agent; some hosts reject header-less requests
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        accept: "audio/*,application/octet-stream;q=0.9,*/*;q=0.5",
      },
    });
  } catch {
    return { ok: false, message: "Couldn't reach that link" };
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message:
          "The site blocked the download. Paste a direct link to the audio file, or download it and use Upload files.",
      };
    }
    if (res.status === 404) {
      return { ok: false, message: "Nothing found at that link (404)." };
    }
    return { ok: false, message: `Couldn't fetch the file (${res.status}).` };
  }

  const type = res.headers.get("content-type") ?? "";
  if (type.includes("text/html")) {
    return {
      ok: false,
      message:
        "That's a web page, not an audio file. Use a direct link to the file (it usually ends in .mp3), or download it and use Upload files.",
    };
  }

  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared && declared > MAX_IMPORT_BYTES) {
    return { ok: false, message: "File is too large (50MB max)" };
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_IMPORT_BYTES) {
    return { ok: false, message: "File is too large (50MB max)" };
  }

  // confirm it is really audio: trust the content type / extension, else sniff
  // the bytes (cloud links often serve octet-stream with no file extension)
  let isAudio =
    type.startsWith("audio/") ||
    /\.(mp3|m4a|aac|ogg|wav|flac)$/i.test(url.pathname);
  if (!isAudio) {
    try {
      const meta = await parseBuffer(buf, { mimeType: "audio/mpeg" });
      isAudio = !!(meta.format.container || (meta.format.duration ?? 0) > 0);
    } catch {
      isAudio = false;
    }
  }
  if (!isAudio) {
    return {
      ok: false,
      message: "That doesn't look like an audio file. Use a direct link to the file.",
    };
  }

  let filename = decodeURIComponent(url.pathname.split("/").pop() || "");
  if (!/\.[a-z0-9]{2,4}$/i.test(filename)) filename = `${randomUUID()}.mp3`;

  const name = await storeAndCreateTrack(buf, filename, user.id);
  revalidateTag(TAGS.songs, "max");
  return { ok: true, message: `Imported ${name}` };
}
