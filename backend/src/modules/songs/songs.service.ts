import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';

@Injectable()
export class SongsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSongById(id: string) {
    return this.prisma.song.findUnique({ where: { id } });
  }

  async createSong(userId: string, dto: CreateSongDto) {
    return this.prisma.song.create({
      data: { ...dto, ownerId: userId },
    });
  }

  async updateSong(userId: string, id: string, dto: UpdateSongDto) {
    const song = await this.prisma.song.findUnique({ where: { id } });
    if (!song || song.ownerId !== userId) throw new ForbiddenException('Unauthorized');
    return this.prisma.song.update({ where: { id }, data: dto });
  }

  async deleteSong(userId: string, id: string) {
    const song = await this.prisma.song.findUnique({ where: { id } });
    if (!song || song.ownerId !== userId) throw new ForbiddenException('Unauthorized');
    
    // Remove song from all playlists
    await this.prisma.playlistSong.deleteMany({
      where: { songId: id }
    });
    
    // Delete the song record
    await this.prisma.song.delete({ where: { id } });
    
    // Delete physical files if they exist
    if (song.filePath) {
      const fs = await import('fs/promises');
      const path = await import('path');
      try {
        const filePath = path.join(process.cwd(), song.filePath);
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Failed to delete song file:', error);
      }
    }
    
    if (song.coverImageUrl) {
      const fs = await import('fs/promises');
      const path = await import('path');
      try {
        const coverPath = path.join(process.cwd(), song.coverImageUrl);
        await fs.unlink(coverPath);
      } catch (error) {
        console.error('Failed to delete cover image:', error);
      }
    }
    
    return true;
  }

  async createSongWithUpload(
    userId: string,
    dto: CreateSongDto,
    songPath: string,
    thumbnailPath?: string
  ) {
    return this.prisma.song.create({
      data: {
        ...dto,
        ownerId: userId,
        filePath: songPath,
        coverImageUrl: thumbnailPath,
      },
    });
  }

  async searchSongs(filters: any, skip: number, take: number) {
    return this.prisma.song.findMany({
      where: filters,
      skip,
      take,
      orderBy: { uploadedAt: 'desc' }
    });
  }

  async countSongs(filters: any) {
    return this.prisma.song.count({ where: filters });
  }

  async getAllSongs(userId: string, artist?: string) {
    const where: any = { ownerId: userId };
    if (artist) where.artist = { equals: artist, mode: 'insensitive' };
    return this.prisma.song.findMany({
      where,
      orderBy: { title: 'asc' },
    });
  }

  async getDistinctArtists(userId: string) {
    const songs = await this.prisma.song.findMany({
      where: { ownerId: userId },
      select: { artist: true },
      distinct: ['artist'],
      orderBy: { artist: 'asc' },
    });
    return songs.map(s => s.artist).filter(Boolean);
  }

  async likeSong(userId: string, songId: string) {
    // Prevent duplicate likes
    const existing = await this.prisma.songLike.findUnique({
      where: { userId_songId: { userId, songId } }
    });
    if (existing) return { message: 'Already liked' };

    await this.prisma.songLike.create({
      data: { userId, songId }
    });
    return { message: 'Song liked' };
  }

  async unlikeSong(userId: string, songId: string) {
    await this.prisma.songLike.deleteMany({
      where: { userId, songId }
    });
    return { message: 'Song unliked' };
  }

  async findByFilePath(filePath: string) {
    return this.prisma.song.findFirst({ where: { filePath } });
  }

  async getLikedSongs(userId: string, skip = 0, take = 20) {
    return this.prisma.songLike.findMany({
      where: { userId },
      include: { song: true },
      skip,
      take,
      orderBy: { likedAt: 'desc' }
    });
  }
}