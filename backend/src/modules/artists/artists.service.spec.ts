import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../test/mock-prisma';

describe('ArtistsService', () => {
  let service: ArtistsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtistsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ArtistsService>(ArtistsService);
  });

  describe('findOrCreate', () => {
    it('should return existing artist id without creating', async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: 'a1', name: 'Queen', ownerId: 'user-1' });

      const result = await service.findOrCreate('user-1', 'Queen');

      expect(prisma.artist.create).not.toHaveBeenCalled();
      expect(result).toBe('a1');
    });

    it('should create and return new artist id when not found', async () => {
      prisma.artist.findUnique.mockResolvedValue(null);
      prisma.artist.create.mockResolvedValue({ id: 'a2', name: 'Radiohead', ownerId: 'user-1' });

      const result = await service.findOrCreate('user-1', 'Radiohead');

      expect(prisma.artist.create).toHaveBeenCalledWith({
        data: { name: 'Radiohead', ownerId: 'user-1' },
      });
      expect(result).toBe('a2');
    });

    it('should trim whitespace from artist name before lookup', async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: 'a1', name: 'Queen', ownerId: 'user-1' });

      await service.findOrCreate('user-1', '  Queen  ');

      expect(prisma.artist.findUnique).toHaveBeenCalledWith({
        where: { name_ownerId: { name: 'Queen', ownerId: 'user-1' } },
      });
    });
  });

  describe('getArtists', () => {
    it('should return artists ordered alphabetically', async () => {
      const artists = [
        { id: 'a1', name: 'Adele', _count: { songs: 3, followers: 1 } },
        { id: 'a2', name: 'Zara', _count: { songs: 1, followers: 0 } },
      ];
      prisma.artist.findMany.mockResolvedValue(artists);

      const result = await service.getArtists('user-1');

      expect(prisma.artist.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' },
        orderBy: { name: 'asc' },
        include: { _count: { select: { songs: true, followers: true } } },
      });
      expect(result).toEqual(artists);
    });
  });

  describe('getArtistById', () => {
    it('should return the artist when found and owned', async () => {
      const artist = { id: 'a1', name: 'Queen', ownerId: 'user-1', _count: { songs: 5, followers: 2 } };
      prisma.artist.findUnique.mockResolvedValue(artist);

      const result = await service.getArtistById('user-1', 'a1');
      expect(result).toEqual(artist);
    });

    it('should throw NotFoundException when artist does not exist', async () => {
      prisma.artist.findUnique.mockResolvedValue(null);

      await expect(service.getArtistById('user-1', 'nonexistent'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when artist belongs to another user', async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: 'a1', name: 'Queen', ownerId: 'user-2' });

      await expect(service.getArtistById('user-1', 'a1'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getArtistSongs', () => {
    it('should return songs for an owned artist', async () => {
      const songs = [{ id: 's1', title: 'Bohemian Rhapsody', artistId: 'a1' }];
      prisma.artist.findUnique.mockResolvedValue({ id: 'a1', ownerId: 'user-1' });
      prisma.song.findMany.mockResolvedValue(songs);

      const result = await service.getArtistSongs('user-1', 'a1');

      expect(prisma.song.findMany).toHaveBeenCalledWith({
        where: { artistId: 'a1', ownerId: 'user-1' },
        orderBy: { uploadedAt: 'desc' },
      });
      expect(result).toEqual(songs);
    });

    it('should throw NotFoundException when artist does not exist', async () => {
      prisma.artist.findUnique.mockResolvedValue(null);

      await expect(service.getArtistSongs('user-1', 'nonexistent'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when artist belongs to another user', async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: 'a1', ownerId: 'user-2' });

      await expect(service.getArtistSongs('user-1', 'a1'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateArtist', () => {
    it('should update and return the artist', async () => {
      const existing = { id: 'a1', name: 'Queen', ownerId: 'user-1' };
      const updated = { ...existing, bio: 'British rock band', imageUrl: '/queen.jpg' };
      prisma.artist.findUnique.mockResolvedValue(existing);
      prisma.artist.update.mockResolvedValue(updated);

      const result = await service.updateArtist('user-1', 'a1', { bio: 'British rock band', imageUrl: '/queen.jpg' });

      expect(prisma.artist.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { bio: 'British rock band', imageUrl: '/queen.jpg' },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when artist does not exist', async () => {
      prisma.artist.findUnique.mockResolvedValue(null);

      await expect(service.updateArtist('user-1', 'nonexistent', { bio: 'x' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when artist belongs to another user', async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: 'a1', ownerId: 'user-2' });

      await expect(service.updateArtist('user-1', 'a1', { bio: 'x' }))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('followArtist', () => {
    it('should upsert a follow and return followed:true', async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: 'a1', name: 'Queen' });
      prisma.artistFollow.upsert.mockResolvedValue({});

      const result = await service.followArtist('user-1', 'a1');

      expect(prisma.artistFollow.upsert).toHaveBeenCalledWith({
        where: { userId_artistId: { userId: 'user-1', artistId: 'a1' } },
        create: { userId: 'user-1', artistId: 'a1' },
        update: {},
      });
      expect(result).toEqual({ followed: true });
    });

    it('should throw NotFoundException when artist does not exist', async () => {
      prisma.artist.findUnique.mockResolvedValue(null);

      await expect(service.followArtist('user-1', 'nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('unfollowArtist', () => {
    it('should delete the follow record and return followed:false', async () => {
      prisma.artistFollow.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.unfollowArtist('user-1', 'a1');

      expect(prisma.artistFollow.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', artistId: 'a1' },
      });
      expect(result).toEqual({ followed: false });
    });

    it('should succeed gracefully when follow record does not exist', async () => {
      prisma.artistFollow.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.unfollowArtist('user-1', 'a1');
      expect(result).toEqual({ followed: false });
    });
  });

  describe('isFollowing', () => {
    it('should return true when a follow record exists', async () => {
      prisma.artistFollow.findUnique.mockResolvedValue({ userId: 'user-1', artistId: 'a1' });

      const result = await service.isFollowing('user-1', 'a1');
      expect(result).toBe(true);
    });

    it('should return false when no follow record exists', async () => {
      prisma.artistFollow.findUnique.mockResolvedValue(null);

      const result = await service.isFollowing('user-1', 'a1');
      expect(result).toBe(false);
    });
  });

  describe('getFollowedArtists', () => {
    it('should return artist objects from follow records', async () => {
      const follows = [
        { artist: { id: 'a1', name: 'Queen', _count: { songs: 5, followers: 2 } } },
        { artist: { id: 'a2', name: 'Radiohead', _count: { songs: 3, followers: 1 } } },
      ];
      prisma.artistFollow.findMany.mockResolvedValue(follows);

      const result = await service.getFollowedArtists('user-1');

      expect(result).toEqual([
        { id: 'a1', name: 'Queen', _count: { songs: 5, followers: 2 } },
        { id: 'a2', name: 'Radiohead', _count: { songs: 3, followers: 1 } },
      ]);
    });

    it('should return empty array when user follows no artists', async () => {
      prisma.artistFollow.findMany.mockResolvedValue([]);

      const result = await service.getFollowedArtists('user-1');
      expect(result).toEqual([]);
    });
  });
});
