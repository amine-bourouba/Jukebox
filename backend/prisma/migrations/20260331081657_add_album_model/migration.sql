-- AlterTable
ALTER TABLE "public"."Song" ADD COLUMN     "albumId" TEXT;

-- CreateTable
CREATE TABLE "public"."Album" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "releaseYear" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'Album',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Album_title_artistId_key" ON "public"."Album"("title", "artistId");

-- AddForeignKey
ALTER TABLE "public"."Song" ADD CONSTRAINT "Song_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "public"."Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Album" ADD CONSTRAINT "Album_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "public"."Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
