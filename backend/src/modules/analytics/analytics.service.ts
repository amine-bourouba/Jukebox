import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordPlay(userId: string, songId: string) {
    const [history] = await this.prisma.$transaction([
      this.prisma.playHistory.create({ data: { userId, songId } }),
      this.prisma.song.update({
        where: { id: songId },
        data: { playCount: { increment: 1 } },
      }),
    ]);
    return history;
  }

  async getHistory(userId: string, skip = 0, take = 20) {
    return this.prisma.playHistory.findMany({
      where: { userId },
      include: { song: true },
      orderBy: { playedAt: 'desc' },
      skip,
      take,
    });
  }

  async getPlayCount(songId: string) {
    const song = await this.prisma.song.findUnique({
      where: { id: songId },
      select: { playCount: true },
    });
    return { songId, playCount: song?.playCount ?? 0 };
  }
}
