import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn().mockResolvedValue('hashed-new-password'),
}));
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

  describe('changePassword', () => {
    it('should update password when currentPassword is correct', async () => {
      const { compare } = await import('bcrypt');
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', password: 'hashed-old' });
      (compare as any).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({});

      await service.changePassword('user-1', 'old-pass', 'new-pass-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: 'hashed-new-password' },
      });
    });

    it('should throw ForbiddenException when currentPassword is wrong', async () => {
      const { compare } = await import('bcrypt');
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', password: 'hashed-old' });
      (compare as any).mockResolvedValue(false);

      await expect(service.changePassword('user-1', 'wrong', 'new-pass-123'))
        .rejects.toThrow(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('updateAvatar', () => {
    it('should update avatarUrl and return the user', async () => {
      const updated = { id: 'user-1', avatarUrl: 'uploads/avatars/pic.jpg' };
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.updateAvatar('user-1', 'uploads/avatars/pic.jpg');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { avatarUrl: 'uploads/avatars/pic.jpg' },
      });
      expect(result).toEqual(updated);
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
