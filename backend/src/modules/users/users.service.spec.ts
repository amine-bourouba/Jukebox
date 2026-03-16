import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../test/mock-prisma';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getCurrentUser', () => {
    it('should return the user by id', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', displayName: 'Test' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getCurrentUser('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getCurrentUser('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateCurrentUser', () => {
    it('should update and return the user', async () => {
      const updatedUser = { id: 'user-1', displayName: 'New Name' };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateCurrentUser('user-1', { displayName: 'New Name' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { displayName: 'New Name' },
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: 'user-2', email: 'other@example.com' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserById('user-2');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-2' } });
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserLibrarySongs', () => {
    it('should return songs liked by the user', async () => {
      const songs = [{ id: 'song-1', title: 'Liked Song' }];
      prisma.song.findMany.mockResolvedValue(songs);

      const result = await service.getUserLibrarySongs('user-1');

      expect(prisma.song.findMany).toHaveBeenCalledWith({
        where: { songLikes: { some: { userId: 'user-1' } } },
      });
      expect(result).toEqual(songs);
    });
  });

  describe('getUserLibraryPlaylists', () => {
    it('should return playlists followed by the user', async () => {
      const playlists = [{ id: 'pl-1', title: 'Followed Playlist' }];
      prisma.playlist.findMany.mockResolvedValue(playlists);

      const result = await service.getUserLibraryPlaylists('user-1');

      expect(prisma.playlist.findMany).toHaveBeenCalledWith({
        where: { playlistFollowers: { some: { userId: 'user-1' } } },
      });
      expect(result).toEqual(playlists);
    });
  });
});
