import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { AcoustIdService } from './acoustid.service';

describe('SongsController', () => {
  let controller: SongsController;
  let songsService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    songsService = {
      createSong: vi.fn(),
      updateSong: vi.fn(),
      deleteSong: vi.fn(),
      getSongById: vi.fn(),
      searchSongs: vi.fn(),
      countSongs: vi.fn(),
      getLikedSongs: vi.fn(),
      likeSong: vi.fn(),
      unlikeSong: vi.fn(),
      createSongWithUpload: vi.fn(),
      getAllSongs: vi.fn(),
      getDistinctArtists: vi.fn(),
    };

    const acoustIdService = {
      lookup: vi.fn(),
      fingerprint: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongsController],
      providers: [
        { provide: SongsService, useValue: songsService },
        { provide: AcoustIdService, useValue: acoustIdService },
      ],
    }).compile();

    controller = module.get<SongsController>(SongsController);
  });

  const mockReq = (userId = 'user-1') => ({ user: { userId } });

  describe('createSong', () => {
    it('should create a song', async () => {
      const dto = { title: 'Song', artist: ['Artist'], filePath: '/path' };
      const created = { id: 'song-1', ...dto };
      songsService.createSong.mockResolvedValue(created);

      const result = await controller.createSong(mockReq(), dto);

      expect(songsService.createSong).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(created);
    });

    it('should throw BadRequestException on error', async () => {
      songsService.createSong.mockRejectedValue(new Error('fail'));

      await expect(controller.createSong(mockReq(), {} as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateSong', () => {
    it('should update a song', async () => {
      const updated = { id: 'song-1', title: 'Updated' };
      songsService.updateSong.mockResolvedValue(updated);

      const result = await controller.updateSong(mockReq(), 'song-1', { title: 'Updated' });

      expect(songsService.updateSong).toHaveBeenCalledWith('user-1', 'song-1', { title: 'Updated' });
      expect(result).toEqual(updated);
    });

    it('should throw BadRequestException when service throws', async () => {
      songsService.updateSong.mockRejectedValue(new Error('Unauthorized'));

      await expect(controller.updateSong(mockReq(), 'song-1', { title: 'X' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteSong', () => {
    it('should delete a song and return message', async () => {
      songsService.deleteSong.mockResolvedValue(true);

      const result = await controller.deleteSong(mockReq(), 'song-1');

      expect(songsService.deleteSong).toHaveBeenCalledWith('user-1', 'song-1');
      expect(result).toEqual({ message: 'Song deleted' });
    });

    it('should throw BadRequestException when service throws', async () => {
      songsService.deleteSong.mockRejectedValue(new Error('Unauthorized'));

      await expect(controller.deleteSong(mockReq(), 'song-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getSong', () => {
    it('should return a song by id', async () => {
      const song = { id: 'song-1', title: 'Test' };
      songsService.getSongById.mockResolvedValue(song);

      const result = await controller.getSong('song-1');
      expect(result).toEqual(song);
    });

    it('should throw NotFoundException if song not found', async () => {
      songsService.getSongById.mockResolvedValue(null);

      await expect(controller.getSong('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('searchSongs', () => {
    it('should return paginated search results', async () => {
      const songs = [{ id: 'song-1', title: 'Match' }];
      songsService.searchSongs.mockResolvedValue(songs);
      songsService.countSongs.mockResolvedValue(1);

      const result = await controller.searchSongs(mockReq(), {
        title: 'Match',
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toEqual(songs);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should use defaults for page and pageSize', async () => {
      songsService.searchSongs.mockResolvedValue([]);
      songsService.countSongs.mockResolvedValue(0);

      const result = await controller.searchSongs(mockReq(), {});

      expect(songsService.searchSongs).toHaveBeenCalledWith({}, 0, 20);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });
  });

  describe('getLikedSongs', () => {
    it('should return liked songs mapped to song objects', async () => {
      const likes = [
        { song: { id: 'song-1', title: 'Liked' } },
        { song: { id: 'song-2', title: 'Also Liked' } },
      ];
      songsService.getLikedSongs.mockResolvedValue(likes);

      const result = await controller.getLikedSongs(mockReq(), {});

      expect(result).toEqual([
        { id: 'song-1', title: 'Liked' },
        { id: 'song-2', title: 'Also Liked' },
      ]);
    });

    it('should parse page and pageSize from query', async () => {
      songsService.getLikedSongs.mockResolvedValue([]);

      await controller.getLikedSongs(mockReq(), { page: '2', pageSize: '5' });

      expect(songsService.getLikedSongs).toHaveBeenCalledWith('user-1', 5, 5);
    });
  });

  describe('likeSong', () => {
    it('should like a song', async () => {
      songsService.likeSong.mockResolvedValue({ message: 'Song liked' });

      const result = await controller.likeSong(mockReq(), 'song-1');

      expect(songsService.likeSong).toHaveBeenCalledWith('user-1', 'song-1');
      expect(result).toEqual({ message: 'Song liked' });
    });
  });

  describe('unlikeSong', () => {
    it('should unlike a song', async () => {
      songsService.unlikeSong.mockResolvedValue({ message: 'Song unliked' });

      const result = await controller.unlikeSong(mockReq(), 'song-1');

      expect(songsService.unlikeSong).toHaveBeenCalledWith('user-1', 'song-1');
      expect(result).toEqual({ message: 'Song unliked' });
    });
  });

  describe('getSongs', () => {
    it('should return all songs for user', async () => {
      const songs = [{ id: 's1', title: 'Song A' }];
      songsService.getAllSongs.mockResolvedValue(songs);

      const result = await controller.getSongs(mockReq());

      expect(songsService.getAllSongs).toHaveBeenCalledWith('user-1', undefined);
      expect(result).toEqual(songs);
    });

    it('should pass artist filter to service', async () => {
      songsService.getAllSongs.mockResolvedValue([]);

      await controller.getSongs(mockReq(), 'Drake');

      expect(songsService.getAllSongs).toHaveBeenCalledWith('user-1', 'Drake');
    });
  });

  describe('getArtists', () => {
    it('should return distinct artists', async () => {
      const artists = ['Adele', 'Drake'];
      songsService.getDistinctArtists.mockResolvedValue(artists);

      const result = await controller.getArtists(mockReq());

      expect(songsService.getDistinctArtists).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(artists);
    });
  });
});
