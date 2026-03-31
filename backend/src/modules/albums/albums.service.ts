import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AlbumsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Find or create an Album by title+artistId. Returns the album id. */
  async findOrCreate(
    artistId: string,
    title: string,
    coverImageUrl?: string,
    releaseYear?: number,
  ): Promise<string> {
    const trimmed = title.trim();
    const existing = await this.prisma.album.findUnique({
      where: { title_artistId: { title: trimmed, artistId } },
    });
    if (existing) return existing.id;
    const created = await this.prisma.album.create({
      data: { title: trimmed, artistId, coverImageUrl, releaseYear },
    });
    return created.id;
  }

  async getAlbumsByArtist(ownerId: string, artistId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');
    if (artist.ownerId !== ownerId) throw new ForbiddenException();

    return this.prisma.album.findMany({
      where: { artistId },
      orderBy: { title: 'asc' },
      include: {
        _count: { select: { songs: true } },
      },
    });
  }

  async getAlbumById(albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      include: {
        artist: true,
        _count: { select: { songs: true } },
      },
    });
    if (!album) throw new NotFoundException('Album not found');
    return album;
  }

  async getAlbumSongs(ownerId: string, albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      include: { artist: true },
    });
    if (!album) throw new NotFoundException('Album not found');
    if (album.artist.ownerId !== ownerId) throw new ForbiddenException();

    return this.prisma.song.findMany({
      where: { albumId, ownerId },
      orderBy: { uploadedAt: 'asc' },
    });
  }
}
