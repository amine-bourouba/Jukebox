import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';

describe('PlaylistsController', () => {
  let controller: PlaylistsController;
  let playlistsService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    playlistsService = {
      createPlaylist: vi.fn(),
      getUserPlaylists: vi.fn(),
      getPlaylistById: vi.fn(),
      deletePlaylist: vi.fn(),
      addSongToPlaylist: vi.fn(),
      removeSongFromPlaylist: vi.fn(),
      reorderPlaylist: vi.fn(),
      updatePlaylist: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaylistsController],
      providers: [{ provide: PlaylistsService, useValue: playlistsService }],
    }).compile();

    controller = module.get<PlaylistsController>(PlaylistsController);
  });

  const mockReq = (userId = 'user-1') => ({ user: { userId } });

  describe('createPlaylist', () => {
    it('should create a playlist', async () => {
      const dto = { title: 'My Playlist' };
      const created = { id: 'pl-1', ownerId: 'user-1', ...dto };
      playlistsService.createPlaylist.mockResolvedValue(created);

      const result = await controller.createPlaylist(mockReq(), dto);

      expect(playlistsService.createPlaylist).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(created);
    });

    it('should throw BadRequestException on error', async () => {
      playlistsService.createPlaylist.mockRejectedValue(new Error('fail'));

      await expect(controller.createPlaylist(mockReq(), { title: 'X' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserPlaylists', () => {
    it('should return user playlists', async () => {
      const playlists = [{ id: 'pl-1', title: 'Playlist 1' }];
      playlistsService.getUserPlaylists.mockResolvedValue(playlists);

      const result = await controller.getUserPlaylists(mockReq());

      expect(playlistsService.getUserPlaylists).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(playlists);
    });
  });

  describe('getPlaylist', () => {
    it('should return a playlist by id', async () => {
      const playlist = { id: 'pl-1', title: 'Test', playlistSongs: [] };
      playlistsService.getPlaylistById.mockResolvedValue(playlist);

      const result = await controller.getPlaylist(mockReq(), 'pl-1');
      expect(result).toEqual(playlist);
    });

    it('should throw NotFoundException if not found', async () => {
      playlistsService.getPlaylistById.mockResolvedValue(null);

      await expect(controller.getPlaylist(mockReq(), 'pl-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePlaylist', () => {
    it('should delete a playlist and return message', async () => {
      playlistsService.deletePlaylist.mockResolvedValue(true);

      const result = await controller.deletePlaylist(mockReq(), 'pl-1');

      expect(playlistsService.deletePlaylist).toHaveBeenCalledWith('user-1', 'pl-1');
      expect(result).toEqual({ message: 'Playlist deleted' });
    });

    it('should throw NotFoundException if not found', async () => {
      playlistsService.deletePlaylist.mockResolvedValue(null);

      await expect(controller.deletePlaylist(mockReq(), 'pl-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('addSongToPlaylist', () => {
    it('should add a song to the playlist', async () => {
      const added = { playlistId: 'pl-1', songId: 'song-1', position: 1 };
      playlistsService.addSongToPlaylist.mockResolvedValue(added);

      const result = await controller.addSongToPlaylist(mockReq(), 'pl-1', { songId: 'song-1' });

      expect(playlistsService.addSongToPlaylist).toHaveBeenCalledWith('user-1', 'pl-1', 'song-1');
      expect(result).toEqual(added);
    });

    it('should throw BadRequestException on error', async () => {
      playlistsService.addSongToPlaylist.mockRejectedValue(new Error('Not found'));

      await expect(controller.addSongToPlaylist(mockReq(), 'pl-1', { songId: 'song-1' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('removeSongFromPlaylist', () => {
    it('should remove a song from the playlist', async () => {
      playlistsService.removeSongFromPlaylist.mockResolvedValue({ message: 'Song removed from playlist' });

      const result = await controller.removeSongFromPlaylist(mockReq(), 'pl-1', 'song-1');

      expect(playlistsService.removeSongFromPlaylist).toHaveBeenCalledWith('user-1', 'pl-1', 'song-1');
      expect(result).toEqual({ message: 'Song removed from playlist' });
    });

    it('should throw BadRequestException on error', async () => {
      playlistsService.removeSongFromPlaylist.mockRejectedValue(new Error('Unauthorized'));

      await expect(controller.removeSongFromPlaylist(mockReq(), 'pl-1', 'song-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('reorderPlaylist', () => {
    it('should reorder the playlist', async () => {
      playlistsService.reorderPlaylist.mockResolvedValue({ message: 'Playlist reordered' });

      const result = await controller.reorderPlaylist(mockReq(), 'pl-1', { songIds: ['s2', 's1'] });

      expect(playlistsService.reorderPlaylist).toHaveBeenCalledWith('user-1', 'pl-1', ['s2', 's1']);
      expect(result).toEqual({ message: 'Playlist reordered' });
    });
  });

  describe('updatePlaylist', () => {
    it('should update a playlist', async () => {
      const updated = { id: 'pl-1', title: 'Updated', ownerId: 'user-1' };
      playlistsService.updatePlaylist.mockResolvedValue(updated);

      const result = await controller.updatePlaylist(mockReq(), 'pl-1', { title: 'Updated' });

      expect(playlistsService.updatePlaylist).toHaveBeenCalledWith('user-1', 'pl-1', { title: 'Updated' });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if playlist not found', async () => {
      playlistsService.updatePlaylist.mockResolvedValue(null);

      await expect(controller.updatePlaylist(mockReq(), 'pl-1', { title: 'X' }))
        .rejects.toThrow(NotFoundException);
    });
  });
});
