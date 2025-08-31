/*
  Warnings:

  - You are about to drop the column `artists` on the `Song` table. All the data in the column will be lost.
  - Added the required column `artist` to the `Song` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Song" DROP COLUMN "artists",
ADD COLUMN     "artist" TEXT NOT NULL;
