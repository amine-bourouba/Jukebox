import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('play-counts')
  getPlayCounts(@Query('songId') songId: string) {
    return this.analyticsService.getPlayCounts(songId);
  }
}
