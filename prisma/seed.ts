import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const SAMPLES = [
  { name: "Nightdrive", artist: "Aria Vale", album: "Neon Coast", genre: "Synthwave", bpm: 118 },
  { name: "Paper Planes", artist: "The Foldouts", album: "Origami", genre: "Indie", bpm: 102 },
  { name: "Deep End", artist: "Mira Sol", album: "Undertow", genre: "House", bpm: 124 },
  { name: "Glass Hours", artist: "Kepler", album: "Orbit", genre: "Ambient", bpm: 90 },
  { name: "Runaway Signal", artist: "Static Garden", album: "Frequencies", genre: "Electronic", bpm: 128 },
  { name: "Golden Static", artist: "Aria Vale", album: "Neon Coast", genre: "Synthwave", bpm: 115 },
  { name: "Low Tide", artist: "Mira Sol", album: "Undertow", genre: "House", bpm: 122 },
  { name: "Cassette Dreams", artist: "The Foldouts", album: "Origami", genre: "Indie", bpm: 98 },
  { name: "Meridian", artist: "Kepler", album: "Orbit", genre: "Ambient", bpm: 86 },
  { name: "Afterglow", artist: "Static Garden", album: "Frequencies", genre: "Electronic", bpm: 126 },
];

async function main() {
  console.log("clearing existing data...");
  await prisma.playHistory.deleteMany();
  await prisma.likedSong.deleteMany();
  await prisma.playlistSong.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.song.deleteMany();

  console.log("seeding songs...");
  const songs: { id: string; imageUrl: string | null }[] = [];
  for (let i = 0; i < SAMPLES.length; i++) {
    const s = SAMPLES[i];
    const song = await prisma.song.create({
      data: {
        name: s.name,
        artist: s.artist,
        album: s.album,
        genre: s.genre,
        bpm: s.bpm,
        duration: 180 + ((i * 37) % 160),
        imageUrl: `https://picsum.photos/seed/cadence-${i}/300/300`,
        audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(i % 12) + 1}.mp3`,
        isLocal: false,
      },
    });
    songs.push(song);
  }

  console.log("seeding playlists...");
  const playlistDefs = [
    { name: "late night drive", pick: [0, 5, 4, 9] },
    { name: "focus / ambient", pick: [3, 8, 1] },
    { name: "house sessions", pick: [2, 6, 4, 9, 0] },
  ];
  for (const def of playlistDefs) {
    const playlist = await prisma.playlist.create({
      data: {
        name: def.name,
        coverUrl: songs[def.pick[0]].imageUrl,
      },
    });
    await prisma.playlistSong.createMany({
      data: def.pick.map((songIdx, order) => ({
        playlistId: playlist.id,
        songId: songs[songIdx].id,
        order,
      })),
    });
  }

  console.log("seeding likes + history...");
  for (const idx of [0, 3, 5]) {
    await prisma.likedSong.create({ data: { songId: songs[idx].id } });
  }
  for (const idx of [5, 2, 8, 0]) {
    await prisma.playHistory.create({ data: { songId: songs[idx].id } });
  }

  console.log("seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
