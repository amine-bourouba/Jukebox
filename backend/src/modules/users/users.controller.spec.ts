import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    usersService = {
      getCurrentUser: vi.fn(),
      updateCurrentUser: vi.fn(),
      getUserById: vi.fn(),
      getUserLibrarySongs: vi.fn(),
      getUserLibraryPlaylists: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  const mockReq = (userId = 'user-1') => ({ user: { userId } });

  describe('getCurrentUser', () => {
    it('should return user without password and refreshToken', async () => {
      usersService.getCurrentUser.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        displayName: 'Test',
        password: 'hashed',
        refreshToken: 'rt',
      });

      const result = await controller.getCurrentUser(mockReq());

      expect(result).toEqual({ id: 'user-1', email: 'a@b.com', displayName: 'Test' });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('should throw BadRequestException when user not found', async () => {
      usersService.getCurrentUser.mockResolvedValue(null);

      await expect(controller.getCurrentUser(mockReq()))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateCurrentUser', () => {
    it('should update and return user without sensitive fields', async () => {
      usersService.updateCurrentUser.mockResolvedValue({
        id: 'user-1',
        displayName: 'New Name',
        password: 'hashed',
        refreshToken: 'rt',
      });

      const result = await controller.updateCurrentUser(mockReq(), { displayName: 'New Name' });

      expect(usersService.updateCurrentUser).toHaveBeenCalledWith('user-1', { displayName: 'New Name' });
      expect(result).toEqual({ id: 'user-1', displayName: 'New Name' });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw BadRequestException when update fails', async () => {
      usersService.updateCurrentUser.mockResolvedValue(null);

      await expect(controller.updateCurrentUser(mockReq(), { displayName: 'X' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserById', () => {
    it('should return user without sensitive fields', async () => {
      usersService.getUserById.mockResolvedValue({
        id: 'user-2',
        email: 'other@b.com',
        password: 'hashed',
        refreshToken: 'rt',
      });

      const result = await controller.getUserById('user-2');

      expect(result).toEqual({ id: 'user-2', email: 'other@b.com' });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw BadRequestException when user not found', async () => {
      usersService.getUserById.mockResolvedValue(null);

      await expect(controller.getUserById('nonexistent'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserLibrarySongs', () => {
    it('should return liked songs', async () => {
      const songs = [{ id: 'song-1', title: 'Song' }];
      usersService.getUserLibrarySongs.mockResolvedValue(songs);

      const result = await controller.getUserLibrarySongs(mockReq());

      expect(usersService.getUserLibrarySongs).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(songs);
    });
  });

  describe('getUserLibraryPlaylists', () => {
    it('should return followed playlists', async () => {
      const playlists = [{ id: 'pl-1', title: 'Playlist' }];
      usersService.getUserLibraryPlaylists.mockResolvedValue(playlists);

      const result = await controller.getUserLibraryPlaylists(mockReq());

      expect(usersService.getUserLibraryPlaylists).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(playlists);
    });
  });
});
