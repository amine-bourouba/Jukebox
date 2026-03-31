import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../test/mock-prisma';

describe('AlbumsService', () => {
  let service: AlbumsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlbumsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AlbumsService>(AlbumsService);
  });

  describe('findOrCreate', () => {
    it('should return existing album id without creating', async () => {
      prisma.album.findUnique.mockResolvedValue({ id: 'alb-1', title: 'OK Computer', artistId: 'a1' });

      const result = await service.findOrCreate('a1', 'OK Computer');

      expect(prisma.album.create).not.toHaveBeenCalled();
      expect(result).toBe('alb-1');
    });

    it('should create and return new album id when not found', async () => {
      prisma.album.findUnique.mockResolvedValue(null);
      prisma.album.create.mockResolvedValue({ id: 'alb-2', title: 'The Bends', artistId: 'a1' });

      const result = await service.findOrCreate('a1', 'The Bends');

      expect(prisma.album.create).toHaveBeenCalledWith({
        data: { title: 'The Bends', artistId: 'a1', coverImageUrl: undefined, releaseYear: undefined },
      });
      expect(result).toBe('alb-2');
    });

    it('should trim whitespace from album title before lookup', async () => {
      prisma.album.findUnique.mockResolvedValue({ id: 'alb-1', title: 'OK Computer', artistId: 'a1' });

      await service.findOrCreate('a1', '  OK Computer  ');

      expect(prisma.album.findUnique).toHaveBeenCalledWith({
        where: { title_artistId: { title: 'OK Computer', artistId: 'a1' } },
      });
    });

    it('should pass optional coverImageUrl and releaseYear on create', async () => {
      prisma.album.findUnique.mockResolvedValue(null);
      prisma.album.create.mockResolvedValue({ id: 'alb-3', title: 'Pablo Honey', artistId: 'a1' });

      await service.findOrCreate('a1', 'Pablo Honey', '/cover.jpg', 1993);

      expect(prisma.album.create).toHaveBeenCalledWith({
        data: { title: 'Pablo Honey', artistId: 'a1', coverImageUrl: '/cover.jpg', releaseYear: 1993 },
      });
    });
  });

  describe('getAlbumsByArtist', () => {
    it('should return albums for an owned artist', async () => {
      const albums = [
        { id: 'alb-1', title: 'OK Computer', artistId: 'a1', _count: { songs: 12 } },
      ];
      prisma.artist.findUnique.mockResolvedValue({ id: 'a1', ownerId: 'user-1' });
      prisma.album.findMany.mockResolvedValue(albums);

      const result = await service.getAlbumsByArtist('user-1', 'a1');

      expect(prisma.album.findMany).toHaveBeenCalledWith({
        where: { artistId: 'a1' },
        orderBy: { title: 'asc' },
        include: { _count: { select: { songs: true } } },
      });
      expect(result).toEqual(albums);
    });

    it('should throw NotFoundException when artist does not exist', async () => {
      prisma.artist.findUnique.mockResolvedValue(null);

      await expect(service.getAlbumsByArtist('user-1', 'nonexistent'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when artist belongs to another user', async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: 'a1', ownerId: 'user-2' });

      await expect(service.getAlbumsByArtist('user-1', 'a1'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAlbumById', () => {
    it('should return album with artist and count', async () => {
      const album = {
        id: 'alb-1', title: 'OK Computer', artistId: 'a1',
        artist: { id: 'a1', name: 'Radiohead' },
        _count: { songs: 12 },
      };
      prisma.album.findUnique.mockResolvedValue(album);

      const result = await service.getAlbumById('alb-1');

      expect(prisma.album.findUnique).toHaveBeenCalledWith({
        where: { id: 'alb-1' },
        include: { artist: true, _count: { select: { songs: true } } },
      });
      expect(result).toEqual(album);
    });

    it('should throw NotFoundException when album does not exist', async () => {
      prisma.album.findUnique.mockResolvedValue(null);

      await expect(service.getAlbumById('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getAlbumSongs', () => {
    it('should return songs for an album when owner matches', async () => {
      const songs = [
        { id: 's1', title: 'Airbag', albumId: 'alb-1', ownerId: 'user-1' },
        { id: 's2', title: 'Paranoid Android', albumId: 'alb-1', ownerId: 'user-1' },
      ];
      prisma.album.findUnique.mockResolvedValue({
        id: 'alb-1', title: 'OK Computer',
        artist: { id: 'a1', ownerId: 'user-1' },
      });
      prisma.song.findMany.mockResolvedValue(songs);

      const result = await service.getAlbumSongs('user-1', 'alb-1');

      expect(prisma.song.findMany).toHaveBeenCalledWith({
        where: { albumId: 'alb-1', ownerId: 'user-1' },
        orderBy: { uploadedAt: 'asc' },
      });
      expect(result).toEqual(songs);
    });

    it('should throw NotFoundException when album does not exist', async () => {
      prisma.album.findUnique.mockResolvedValue(null);

      await expect(service.getAlbumSongs('user-1', 'nonexistent'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when album artist belongs to another user', async () => {
      prisma.album.findUnique.mockResolvedValue({
        id: 'alb-1', title: 'OK Computer',
        artist: { id: 'a1', ownerId: 'user-2' },
      });

      await expect(service.getAlbumSongs('user-1', 'alb-1'))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
