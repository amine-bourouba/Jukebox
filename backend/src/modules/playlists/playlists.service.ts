import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlaylist(userId: string, dto: CreatePlaylistDto) {
    const playlist = await this.prisma.playlist.create({
      data: {
        ownerId: userId,
        title: dto.title,
        description: dto.description,
      },
    });

    if (dto.songId) {
      await this.prisma.playlistSong.create({
        data: {
          playlistId: playlist.id,
          songId: dto.songId,
          position: 1,
        },
      });
    }

    return playlist;
  }

  async getUserPlaylists(userId: string) {
    return this.prisma.playlist.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlaylistById(userId: string, id: string) {
    return this.prisma.playlist.findFirst({
      where: { id, ownerId: userId },
      include: {
        playlistSongs: {
          include: { song: true }
        }
      }
    });
  }

  async deletePlaylist(userId: string, id: string) {
    const playlist = await this.prisma.playlist.findFirst({ where: { id, ownerId: userId } });
    if (!playlist) return null;
    await this.prisma.playlist.delete({ where: { id } });
    return true;
  }

  async addSongToPlaylist(userId: string, playlistId: string, songId: string) {
    const playlist = await this.prisma.playlist.findFirst({ where: { id: playlistId, ownerId: userId } });
    if (!playlist) throw new Error('Playlist not found or unauthorized');
    const count = await this.prisma.playlistSong.count({ where: { playlistId } });
    return this.prisma.playlistSong.create({
      data: {
        playlistId,
        songId,
        position: count + 1,
      },
    });
  }

  async removeSongFromPlaylist(userId: string, playlistId: string, songId: string) {
    const playlist = await this.prisma.playlist.findFirst({ where: { id: playlistId, ownerId: userId } });
    if (!playlist) throw new Error('Playlist not found or unauthorized');
    await this.prisma.playlistSong.deleteMany({
      where: { playlistId, songId },
    });
    return { message: 'Song removed from playlist' };
  }

  async reorderPlaylist(userId: string, playlistId: string, songIds: string[]) {
    const playlist = await this.prisma.playlist.findFirst({ where: { id: playlistId, ownerId: userId } });
    if (!playlist) throw new Error('Playlist not found or unauthorized');

    for (let i = 0; i < songIds.length; i++) {
      await this.prisma.playlistSong.updateMany({
        where: { playlistId, songId: songIds[i] },
        data: { position: i + 1 },
      });
    }
    return { message: 'Playlist reordered' };
  }
}