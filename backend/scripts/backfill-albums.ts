/**
 * Backfill script: create Album entities for existing songs that have an album
 * string but no albumId FK, then patch the song records.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register scripts/backfill-albums.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Only process songs that have an album string but no albumId yet, and have an artistId
  const songs = await prisma.song.findMany({
    where: {
      album: { not: null },
      albumId: null,
      artistId: { not: null },
    },
    select: { id: true, album: true, artistId: true, coverImageUrl: true },
  });

  console.log(`Found ${songs.length} songs to backfill albums for.`);

  let created = 0;
  let linked = 0;

  for (const song of songs) {
    const title = song.album!.trim();
    const artistId = song.artistId!;

    // Upsert the album
    const existing = await prisma.album.findUnique({
      where: { title_artistId: { title, artistId } },
    });

    const album = await prisma.album.upsert({
      where: { title_artistId: { title, artistId } },
      create: { title, artistId, coverImageUrl: song.coverImageUrl ?? undefined },
      update: {},
    });

    if (!existing) created++;

    await prisma.song.update({
      where: { id: song.id },
      data: { albumId: album.id },
    });
    linked++;
  }

  console.log(`Done. Albums created: ${created}, songs linked: ${linked}.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
