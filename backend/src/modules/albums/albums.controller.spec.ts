import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';

describe('AlbumsController', () => {
  let controller: AlbumsController;
  let albumsService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    albumsService = {
      getAlbumsByArtist: vi.fn(),
      getAlbumById: vi.fn(),
      getAlbumSongs: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlbumsController],
      providers: [{ provide: AlbumsService, useValue: albumsService }],
    }).compile();

    controller = module.get<AlbumsController>(AlbumsController);
  });

  const mockReq = (userId = 'user-1') => ({ user: { userId } });

  describe('getAlbumsByArtist', () => {
    it('should return albums for an artist', async () => {
      const albums = [
        { id: 'alb-1', title: 'A Night at the Opera', artistId: 'a1', _count: { songs: 12 } },
      ];
      albumsService.getAlbumsByArtist.mockResolvedValue(albums);

      const result = await controller.getAlbumsByArtist(mockReq(), 'a1');

      expect(albumsService.getAlbumsByArtist).toHaveBeenCalledWith('user-1', 'a1');
      expect(result).toEqual(albums);
    });

    it('should return empty array when artist has no albums', async () => {
      albumsService.getAlbumsByArtist.mockResolvedValue([]);

      const result = await controller.getAlbumsByArtist(mockReq(), 'a1');
      expect(result).toEqual([]);
    });
  });

  describe('getAlbum', () => {
    it('should return album by id', async () => {
      const album = { id: 'alb-1', title: 'OK Computer', artistId: 'a2', artist: { name: 'Radiohead' } };
      albumsService.getAlbumById.mockResolvedValue(album);

      const result = await controller.getAlbum('alb-1');

      expect(albumsService.getAlbumById).toHaveBeenCalledWith('alb-1');
      expect(result).toEqual(album);
    });
  });

  describe('getAlbumSongs', () => {
    it('should return songs for an album', async () => {
      const songs = [
        { id: 's1', title: 'Airbag', albumId: 'alb-1' },
        { id: 's2', title: 'Paranoid Android', albumId: 'alb-1' },
      ];
      albumsService.getAlbumSongs.mockResolvedValue(songs);

      const result = await controller.getAlbumSongs(mockReq(), 'alb-1');

      expect(albumsService.getAlbumSongs).toHaveBeenCalledWith('user-1', 'alb-1');
      expect(result).toEqual(songs);
    });

    it('should return empty array for an album with no songs', async () => {
      albumsService.getAlbumSongs.mockResolvedValue([]);

      const result = await controller.getAlbumSongs(mockReq(), 'alb-1');
      expect(result).toEqual([]);
    });
  });
});
