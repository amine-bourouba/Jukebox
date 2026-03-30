/**
 * One-time backfill script: creates Artist records from existing song artist strings
 * and links each Song to its Artist via artistId.
 *
 * Run with:  npx ts-node -r tsconfig-paths/register scripts/backfill-artists.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const songs = await prisma.song.findMany({
    where: { artistId: null, artist: { not: '' } },
    select: { id: true, artist: true, ownerId: true },
  });

  console.log(`Found ${songs.length} songs without an Artist link.`);

  // Group by ownerId so the @@unique([name, ownerId]) constraint is respected
  const byOwner = new Map<string, typeof songs>();
  for (const song of songs) {
    const list = byOwner.get(song.ownerId) ?? [];
    list.push(song);
    byOwner.set(song.ownerId, list);
  }

  let created = 0;
  let linked = 0;

  for (const [ownerId, ownerSongs] of byOwner) {
    const artistNames = [...new Set(ownerSongs.map(s => s.artist.trim()).filter(Boolean))];

    for (const name of artistNames) {
      const artist = await prisma.artist.upsert({
        where: { name_ownerId: { name, ownerId } },
        create: { name, ownerId },
        update: {},
      });
      created++;

      const { count } = await prisma.song.updateMany({
        where: { ownerId, artist: name, artistId: null },
        data: { artistId: artist.id },
      });
      linked += count;
    }
  }

  console.log(`Done. Artists upserted: ${created} | Songs linked: ${linked}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
