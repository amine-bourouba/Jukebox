import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Find or create an Artist by name for a given user. Returns the artist id. */
  async findOrCreate(ownerId: string, name: string): Promise<string> {
    const trimmed = name.trim();
    const existing = await this.prisma.artist.findUnique({
      where: { name_ownerId: { name: trimmed, ownerId } },
    });
    if (existing) return existing.id;
    const created = await this.prisma.artist.create({
      data: { name: trimmed, ownerId },
    });
    return created.id;
  }

  async getArtists(ownerId: string) {
    return this.prisma.artist.findMany({
      where: { ownerId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { songs: true, followers: true } },
      },
    });
  }

  async getArtistById(ownerId: string, artistId: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        _count: { select: { songs: true, followers: true } },
      },
    });
    if (!artist) throw new NotFoundException('Artist not found');
    if (artist.ownerId !== ownerId) throw new ForbiddenException();
    return artist;
  }

  async getArtistSongs(ownerId: string, artistId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');
    if (artist.ownerId !== ownerId) throw new ForbiddenException();
    return this.prisma.song.findMany({
      where: { artistId, ownerId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async updateArtist(ownerId: string, artistId: string, data: { imageUrl?: string; bio?: string }) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');
    if (artist.ownerId !== ownerId) throw new ForbiddenException();
    return this.prisma.artist.update({
      where: { id: artistId },
      data,
    });
  }

  async followArtist(userId: string, artistId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');
    await this.prisma.artistFollow.upsert({
      where: { userId_artistId: { userId, artistId } },
      create: { userId, artistId },
      update: {},
    });
    return { followed: true };
  }

  async unfollowArtist(userId: string, artistId: string) {
    await this.prisma.artistFollow.deleteMany({ where: { userId, artistId } });
    return { followed: false };
  }

  async isFollowing(userId: string, artistId: string): Promise<boolean> {
    const follow = await this.prisma.artistFollow.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });
    return !!follow;
  }

  async getFollowedArtists(userId: string) {
    const follows = await this.prisma.artistFollow.findMany({
      where: { userId },
      include: {
        artist: { include: { _count: { select: { songs: true, followers: true } } } },
      },
    });
    return follows.map(f => f.artist);
  }
}
