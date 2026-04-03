import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../test/mock-prisma';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('recordPlay', () => {
    it('should run a transaction and return the created PlayHistory entry', async () => {
      const historyEntry = { id: 'h1', userId: 'user-1', songId: 'song-1' };
      prisma.$transaction.mockResolvedValue([historyEntry, { id: 'song-1', playCount: 6 }]);

      const result = await service.recordPlay('user-1', 'song-1');

      expect(prisma.$transaction).toHaveBeenCalledOnce();
      // Verify both operations were queued before the transaction ran
      expect(prisma.playHistory.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', songId: 'song-1' },
      });
      expect(prisma.song.update).toHaveBeenCalledWith({
        where: { id: 'song-1' },
        data: { playCount: { increment: 1 } },
      });
      expect(result).toEqual(historyEntry);
    });
  });

  describe('getHistory', () => {
    it('should return paginated play history with song data', async () => {
      const history = [
        { id: 'h1', userId: 'user-1', songId: 'song-1', playedAt: new Date(), song: { title: 'Test' } },
      ];
      prisma.playHistory.findMany.mockResolvedValue(history);

      const result = await service.getHistory('user-1', 0, 10);

      expect(prisma.playHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { song: true },
        orderBy: { playedAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual(history);
    });

    it('should use default pagination (skip=0, take=20)', async () => {
      prisma.playHistory.findMany.mockResolvedValue([]);

      await service.getHistory('user-1');

      expect(prisma.playHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });
  });

  describe('getPlayCount', () => {
    it('should return the real playCount from the song record', async () => {
      prisma.song.findUnique.mockResolvedValue({ playCount: 42 });

      const result = await service.getPlayCount('song-1');

      expect(prisma.song.findUnique).toHaveBeenCalledWith({
        where: { id: 'song-1' },
        select: { playCount: true },
      });
      expect(result).toEqual({ songId: 'song-1', playCount: 42 });
    });

    it('should return 0 when song is not found', async () => {
      prisma.song.findUnique.mockResolvedValue(null);

      const result = await service.getPlayCount('missing');

      expect(result).toEqual({ songId: 'missing', playCount: 0 });
    });
  });
});
