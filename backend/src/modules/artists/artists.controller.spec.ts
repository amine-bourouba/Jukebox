import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ArtistsController } from './artists.controller';
import { ArtistsService } from './artists.service';

describe('ArtistsController', () => {
  let controller: ArtistsController;
  let artistsService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    artistsService = {
      getArtists: vi.fn(),
      getFollowedArtists: vi.fn(),
      getArtistById: vi.fn(),
      getArtistSongs: vi.fn(),
      updateArtist: vi.fn(),
      followArtist: vi.fn(),
      unfollowArtist: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArtistsController],
      providers: [{ provide: ArtistsService, useValue: artistsService }],
    }).compile();

    controller = module.get<ArtistsController>(ArtistsController);
  });

  const mockReq = (userId = 'user-1') => ({ user: { userId } });

  describe('getArtists', () => {
    it('should return all artists for the user', async () => {
      const artists = [{ id: 'a1', name: 'Queen', _count: { songs: 5, followers: 2 } }];
      artistsService.getArtists.mockResolvedValue(artists);

      const result = await controller.getArtists(mockReq());

      expect(artistsService.getArtists).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(artists);
    });
  });

  describe('getFollowedArtists', () => {
    it('should return artists followed by the user', async () => {
      const artists = [{ id: 'a2', name: 'Radiohead' }];
      artistsService.getFollowedArtists.mockResolvedValue(artists);

      const result = await controller.getFollowedArtists(mockReq());

      expect(artistsService.getFollowedArtists).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(artists);
    });
  });

  describe('getArtist', () => {
    it('should return a single artist by id', async () => {
      const artist = { id: 'a1', name: 'Queen', _count: { songs: 5, followers: 2 } };
      artistsService.getArtistById.mockResolvedValue(artist);

      const result = await controller.getArtist(mockReq(), 'a1');

      expect(artistsService.getArtistById).toHaveBeenCalledWith('user-1', 'a1');
      expect(result).toEqual(artist);
    });
  });

  describe('getArtistSongs', () => {
    it('should return songs for an artist', async () => {
      const songs = [{ id: 's1', title: 'Bohemian Rhapsody', artistId: 'a1' }];
      artistsService.getArtistSongs.mockResolvedValue(songs);

      const result = await controller.getArtistSongs(mockReq(), 'a1');

      expect(artistsService.getArtistSongs).toHaveBeenCalledWith('user-1', 'a1');
      expect(result).toEqual(songs);
    });
  });

  describe('updateArtist', () => {
    it('should update artist metadata', async () => {
      const updated = { id: 'a1', name: 'Queen', bio: 'British rock band', imageUrl: '/queen.jpg' };
      artistsService.updateArtist.mockResolvedValue(updated);

      const result = await controller.updateArtist(mockReq(), 'a1', { bio: 'British rock band', imageUrl: '/queen.jpg' });

      expect(artistsService.updateArtist).toHaveBeenCalledWith('user-1', 'a1', { bio: 'British rock band', imageUrl: '/queen.jpg' });
      expect(result).toEqual(updated);
    });
  });

  describe('followArtist', () => {
    it('should follow an artist and return followed status', async () => {
      artistsService.followArtist.mockResolvedValue({ followed: true });

      const result = await controller.followArtist(mockReq(), 'a1');

      expect(artistsService.followArtist).toHaveBeenCalledWith('user-1', 'a1');
      expect(result).toEqual({ followed: true });
    });
  });

  describe('unfollowArtist', () => {
    it('should unfollow an artist and return unfollowed status', async () => {
      artistsService.unfollowArtist.mockResolvedValue({ followed: false });

      const result = await controller.unfollowArtist(mockReq(), 'a1');

      expect(artistsService.unfollowArtist).toHaveBeenCalledWith('user-1', 'a1');
      expect(result).toEqual({ followed: false });
    });
  });
});
