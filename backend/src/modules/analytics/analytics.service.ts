import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  getPlayCounts(songId: string) {
    return { songId, playCount: 42 };
  }
}
