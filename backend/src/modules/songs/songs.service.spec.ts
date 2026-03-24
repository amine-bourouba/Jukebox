import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SongsService } from './songs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../test/mock-prisma';

// Mock fs/promises and path for file deletion tests
vi.mock('fs/promises', () => ({
  unlink: vi.fn().mockResolvedValue(undefined),
}));

describe('SongsService', () => {
  let service: SongsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SongsService>(SongsService);
  });

  describe('getSongById', () => {
    it('should return a song by id', async () => {
      const mockSong = { id: 'song-1', title: 'Test Song', ownerId: 'user-1' };
      prisma.song.findUnique.mockResolvedValue(mockSong);

      const result = await service.getSongById('song-1');

      expect(prisma.song.findUnique).toHaveBeenCalledWith({ where: { id: 'song-1' } });
      expect(result).toEqual(mockSong);
    });

    it('should return null if song not found', async () => {
      prisma.song.findUnique.mockResolvedValue(null);

      const result = await service.getSongById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createSong', () => {
    it('should create a song with the owner id', async () => {
      const dto = { title: 'New Song', artist: ['Artist 1'], filePath: '/path/to/file.mp3' };
      const mockSong = { id: 'song-1', ...dto, ownerId: 'user-1' };
      prisma.song.create.mockResolvedValue(mockSong);

      const result = await service.createSong('user-1', dto);

      expect(prisma.song.create).toHaveBeenCalledWith({
        data: { ...dto, ownerId: 'user-1' },
      });
      expect(result).toEqual(mockSong);
    });
  });

  describe('updateSong', () => {
    it('should update a song owned by the user', async () => {
      const existingSong = { id: 'song-1', title: 'Old Title', ownerId: 'user-1' };
      const dto = { title: 'Updated Title' };
      const updatedSong = { ...existingSong, ...dto };

      prisma.song.findUnique.mockResolvedValue(existingSong);
      prisma.song.update.mockResolvedValue(updatedSong);

      const result = await service.updateSong('user-1', 'song-1', dto);

      expect(prisma.song.update).toHaveBeenCalledWith({
        where: { id: 'song-1' },
        data: dto,
      });
      expect(result.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException if user does not own the song', async () => {
      prisma.song.findUnique.mockResolvedValue({ id: 'song-1', ownerId: 'other-user' });

      await expect(service.updateSong('user-1', 'song-1', { title: 'Hack' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if song not found', async () => {
      prisma.song.findUnique.mockResolvedValue(null);

      await expect(service.updateSong('user-1', 'song-1', { title: 'X' }))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteSong', () => {
    it('should delete owned song, remove from playlists, and delete files', async () => {
      const song = {
        id: 'song-1',
        ownerId: 'user-1',
        filePath: 'uploads/song.mp3',
        coverImageUrl: 'uploads/cover.jpg',
      };

      prisma.song.findUnique.mockResolvedValue(song);
      prisma.playlistSong.deleteMany.mockResolvedValue({ count: 2 });
      prisma.song.delete.mockResolvedValue(song);

      const result = await service.deleteSong('user-1', 'song-1');

      expect(prisma.playlistSong.deleteMany).toHaveBeenCalledWith({
        where: { songId: 'song-1' },
      });
      expect(prisma.song.delete).toHaveBeenCalledWith({ where: { id: 'song-1' } });
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user does not own the song', async () => {
      prisma.song.findUnique.mockResolvedValue({ id: 'song-1', ownerId: 'other-user' });

      await expect(service.deleteSong('user-1', 'song-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if song not found', async () => {
      prisma.song.findUnique.mockResolvedValue(null);

      await expect(service.deleteSong('user-1', 'song-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should still succeed if song has no files', async () => {
      const song = { id: 'song-1', ownerId: 'user-1', filePath: null, coverImageUrl: null };
      prisma.song.findUnique.mockResolvedValue(song);
      prisma.playlistSong.deleteMany.mockResolvedValue({ count: 0 });
      prisma.song.delete.mockResolvedValue(song);

      const result = await service.deleteSong('user-1', 'song-1');
      expect(result).toBe(true);
    });
  });

  describe('createSongWithUpload', () => {
    it('should create a song with file paths', async () => {
      const dto = { title: 'Upload Song', artist: ['Artist'], filePath: '' };
      const mockSong = {
        id: 'song-1',
        ...dto,
        ownerId: 'user-1',
        filePath: '/uploads/song.mp3',
        coverImageUrl: '/uploads/cover.jpg',
      };
      prisma.song.create.mockResolvedValue(mockSong);

      const result = await service.createSongWithUpload(
        'user-1', dto, '/uploads/song.mp3', '/uploads/cover.jpg'
      );

      expect(prisma.song.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          ownerId: 'user-1',
          filePath: '/uploads/song.mp3',
          coverImageUrl: '/uploads/cover.jpg',
        },
      });
      expect(result).toEqual(mockSong);
    });
  });

  describe('searchSongs', () => {
    it('should return paginated songs matching filters', async () => {
      const songs = [{ id: 'song-1', title: 'Test' }];
      prisma.song.findMany.mockResolvedValue(songs);

      const result = await service.searchSongs({ title: 'Test' }, 0, 10);

      expect(prisma.song.findMany).toHaveBeenCalledWith({
        where: { title: 'Test' },
        skip: 0,
        take: 10,
        orderBy: { uploadedAt: 'desc' },
      });
      expect(result).toEqual(songs);
    });
  });

  describe('countSongs', () => {
    it('should return count of songs matching filters', async () => {
      prisma.song.count.mockResolvedValue(5);

      const result = await service.countSongs({ title: 'Test' });

      expect(prisma.song.count).toHaveBeenCalledWith({ where: { title: 'Test' } });
      expect(result).toBe(5);
    });
  });

  describe('likeSong', () => {
    it('should like a song if not already liked', async () => {
      prisma.songLike.findUnique.mockResolvedValue(null);
      prisma.songLike.create.mockResolvedValue({});

      const result = await service.likeSong('user-1', 'song-1');

      expect(prisma.songLike.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', songId: 'song-1' },
      });
      expect(result).toEqual({ message: 'Song liked' });
    });

    it('should return "Already liked" if duplicate', async () => {
      prisma.songLike.findUnique.mockResolvedValue({ userId: 'user-1', songId: 'song-1' });

      const result = await service.likeSong('user-1', 'song-1');

      expect(prisma.songLike.create).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Already liked' });
    });
  });

  describe('unlikeSong', () => {
    it('should remove a like', async () => {
      prisma.songLike.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.unlikeSong('user-1', 'song-1');

      expect(prisma.songLike.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', songId: 'song-1' },
      });
      expect(result).toEqual({ message: 'Song unliked' });
    });
  });

  describe('getAllSongs', () => {
    it('should return all songs for user ordered by title', async () => {
      const songs = [
        { id: 's1', title: 'Alpha', ownerId: 'user-1' },
        { id: 's2', title: 'Beta', ownerId: 'user-1' },
      ];
      prisma.song.findMany.mockResolvedValue(songs);

      const result = await service.getAllSongs('user-1');

      expect(prisma.song.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' },
        orderBy: { title: 'asc' },
      });
      expect(result).toEqual(songs);
    });

    it('should filter by artist when provided', async () => {
      prisma.song.findMany.mockResolvedValue([]);

      await service.getAllSongs('user-1', 'Drake');

      expect(prisma.song.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'user-1', artist: { equals: 'Drake', mode: 'insensitive' } },
        orderBy: { title: 'asc' },
      });
    });
  });

  describe('getDistinctArtists', () => {
    it('should return distinct artist names', async () => {
      prisma.song.findMany.mockResolvedValue([
        { artist: 'Adele' },
        { artist: 'Drake' },
      ]);

      const result = await service.getDistinctArtists('user-1');

      expect(prisma.song.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' },
        select: { artist: true },
        distinct: ['artist'],
        orderBy: { artist: 'asc' },
      });
      expect(result).toEqual(['Adele', 'Drake']);
    });

    it('should filter out falsy artist values', async () => {
      prisma.song.findMany.mockResolvedValue([
        { artist: 'Adele' },
        { artist: '' },
        { artist: null },
      ]);

      const result = await service.getDistinctArtists('user-1');

      expect(result).toEqual(['Adele']);
    });
  });

  describe('getLikedSongs', () => {
    it('should return paginated liked songs', async () => {
      const likedSongs = [{ userId: 'user-1', songId: 'song-1', song: { title: 'Test' } }];
      prisma.songLike.findMany.mockResolvedValue(likedSongs);

      const result = await service.getLikedSongs('user-1', 0, 10);

      expect(prisma.songLike.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { song: true },
        skip: 0,
        take: 10,
        orderBy: { likedAt: 'desc' },
      });
      expect(result).toEqual(likedSongs);
    });

    it('should use default pagination values', async () => {
      prisma.songLike.findMany.mockResolvedValue([]);

      await service.getLikedSongs('user-1');

      expect(prisma.songLike.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });
  });
});
