import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PlaylistsService } from './playlists.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../test/mock-prisma';

describe('PlaylistsService', () => {
  let service: PlaylistsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PlaylistsService>(PlaylistsService);
  });

  describe('createPlaylist', () => {
    it('should create a playlist without an initial song', async () => {
      const mockPlaylist = { id: 'pl-1', ownerId: 'user-1', title: 'My Playlist', description: null };
      prisma.playlist.create.mockResolvedValue(mockPlaylist);

      const result = await service.createPlaylist('user-1', { title: 'My Playlist' });

      expect(prisma.playlist.create).toHaveBeenCalledWith({
        data: { ownerId: 'user-1', title: 'My Playlist', description: undefined },
      });
      expect(prisma.playlistSong.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockPlaylist);
    });

    it('should create a playlist and add an initial song', async () => {
      const mockPlaylist = { id: 'pl-1', ownerId: 'user-1', title: 'My Playlist' };
      prisma.playlist.create.mockResolvedValue(mockPlaylist);
      prisma.playlistSong.create.mockResolvedValue({});

      const result = await service.createPlaylist('user-1', {
        title: 'My Playlist',
        songId: 'song-1',
      });

      expect(prisma.playlistSong.create).toHaveBeenCalledWith({
        data: { playlistId: 'pl-1', songId: 'song-1', position: 1 },
      });
      expect(result).toEqual(mockPlaylist);
    });
  });

  describe('getUserPlaylists', () => {
    it('should return playlists ordered by createdAt desc', async () => {
      const playlists = [{ id: 'pl-1', title: 'Playlist 1' }];
      prisma.playlist.findMany.mockResolvedValue(playlists);

      const result = await service.getUserPlaylists('user-1');

      expect(prisma.playlist.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(playlists);
    });
  });

  describe('getPlaylistById', () => {
    it('should return a playlist with songs included', async () => {
      const playlist = {
        id: 'pl-1',
        ownerId: 'user-1',
        playlistSongs: [{ song: { id: 'song-1', title: 'Song' } }],
      };
      prisma.playlist.findFirst.mockResolvedValue(playlist);

      const result = await service.getPlaylistById('user-1', 'pl-1');

      expect(prisma.playlist.findFirst).toHaveBeenCalledWith({
        where: { id: 'pl-1', ownerId: 'user-1' },
        include: { playlistSongs: { include: { song: true } } },
      });
      expect(result).toEqual(playlist);
    });

    it('should return null if playlist not found or not owned', async () => {
      prisma.playlist.findFirst.mockResolvedValue(null);

      const result = await service.getPlaylistById('user-1', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('deletePlaylist', () => {
    it('should delete an owned playlist', async () => {
      prisma.playlist.findFirst.mockResolvedValue({ id: 'pl-1', ownerId: 'user-1' });
      prisma.playlist.delete.mockResolvedValue({});

      const result = await service.deletePlaylist('user-1', 'pl-1');

      expect(prisma.playlist.delete).toHaveBeenCalledWith({ where: { id: 'pl-1' } });
      expect(result).toBe(true);
    });

    it('should return null if playlist not found or not owned', async () => {
      prisma.playlist.findFirst.mockResolvedValue(null);

      const result = await service.deletePlaylist('user-1', 'pl-1');
      expect(result).toBeNull();
    });
  });

  describe('addSongToPlaylist', () => {
    it('should add a song at the next position', async () => {
      prisma.playlist.findFirst.mockResolvedValue({ id: 'pl-1', ownerId: 'user-1' });
      prisma.playlistSong.count.mockResolvedValue(3);
      prisma.playlistSong.create.mockResolvedValue({
        playlistId: 'pl-1',
        songId: 'song-1',
        position: 4,
      });

      const result = await service.addSongToPlaylist('user-1', 'pl-1', 'song-1');

      expect(prisma.playlistSong.create).toHaveBeenCalledWith({
        data: { playlistId: 'pl-1', songId: 'song-1', position: 4 },
      });
      expect(result.position).toBe(4);
    });

    it('should throw if playlist not found or not owned', async () => {
      prisma.playlist.findFirst.mockResolvedValue(null);

      await expect(service.addSongToPlaylist('user-1', 'pl-1', 'song-1'))
        .rejects.toThrow('Playlist not found or unauthorized');
    });
  });

  describe('removeSongFromPlaylist', () => {
    it('should remove a song from the playlist', async () => {
      prisma.playlist.findFirst.mockResolvedValue({ id: 'pl-1', ownerId: 'user-1' });
      prisma.playlistSong.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.removeSongFromPlaylist('user-1', 'pl-1', 'song-1');

      expect(prisma.playlistSong.deleteMany).toHaveBeenCalledWith({
        where: { playlistId: 'pl-1', songId: 'song-1' },
      });
      expect(result).toEqual({ message: 'Song removed from playlist' });
    });

    it('should throw if playlist not found or not owned', async () => {
      prisma.playlist.findFirst.mockResolvedValue(null);

      await expect(service.removeSongFromPlaylist('user-1', 'pl-1', 'song-1'))
        .rejects.toThrow('Playlist not found or unauthorized');
    });
  });

  describe('reorderPlaylist', () => {
    it('should update positions for all songs in order', async () => {
      prisma.playlist.findFirst.mockResolvedValue({ id: 'pl-1', ownerId: 'user-1' });
      prisma.playlistSong.updateMany.mockResolvedValue({ count: 1 });

      const songIds = ['song-3', 'song-1', 'song-2'];
      const result = await service.reorderPlaylist('user-1', 'pl-1', songIds);

      expect(prisma.playlistSong.updateMany).toHaveBeenCalledTimes(3);
      expect(prisma.playlistSong.updateMany).toHaveBeenNthCalledWith(1, {
        where: { playlistId: 'pl-1', songId: 'song-3' },
        data: { position: 1 },
      });
      expect(prisma.playlistSong.updateMany).toHaveBeenNthCalledWith(2, {
        where: { playlistId: 'pl-1', songId: 'song-1' },
        data: { position: 2 },
      });
      expect(prisma.playlistSong.updateMany).toHaveBeenNthCalledWith(3, {
        where: { playlistId: 'pl-1', songId: 'song-2' },
        data: { position: 3 },
      });
      expect(result).toEqual({ message: 'Playlist reordered' });
    });

    it('should throw if playlist not found or not owned', async () => {
      prisma.playlist.findFirst.mockResolvedValue(null);

      await expect(service.reorderPlaylist('user-1', 'pl-1', ['song-1']))
        .rejects.toThrow('Playlist not found or unauthorized');
    });
  });

  describe('updatePlaylist', () => {
    it('should update an owned playlist', async () => {
      const existing = { id: 'pl-1', ownerId: 'user-1', title: 'Old', description: null };
      const updated = { ...existing, title: 'New Title' };
      prisma.playlist.findFirst.mockResolvedValue(existing);
      prisma.playlist.update.mockResolvedValue(updated);

      const result = await service.updatePlaylist('user-1', 'pl-1', { title: 'New Title' });

      expect(prisma.playlist.update).toHaveBeenCalledWith({
        where: { id: 'pl-1' },
        data: { title: 'New Title' },
      });
      expect(result).toEqual(updated);
    });

    it('should update description only', async () => {
      const existing = { id: 'pl-1', ownerId: 'user-1', title: 'My Playlist', description: null };
      const updated = { ...existing, description: 'A great playlist' };
      prisma.playlist.findFirst.mockResolvedValue(existing);
      prisma.playlist.update.mockResolvedValue(updated);

      const result = await service.updatePlaylist('user-1', 'pl-1', { description: 'A great playlist' });

      expect(prisma.playlist.update).toHaveBeenCalledWith({
        where: { id: 'pl-1' },
        data: { description: 'A great playlist' },
      });
      expect(result).toEqual(updated);
    });

    it('should return null if playlist not found or not owned', async () => {
      prisma.playlist.findFirst.mockResolvedValue(null);

      const result = await service.updatePlaylist('user-1', 'pl-1', { title: 'X' });

      expect(prisma.playlist.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
