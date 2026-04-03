import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('play')
  recordPlay(@Request() req: any, @Body('songId') songId: string) {
    return this.analyticsService.recordPlay(req.user.userId, songId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  getHistory(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.analyticsService.getHistory(
      req.user.userId,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
  }

  @Get('play-counts')
  getPlayCounts(@Query('songId') songId: string) {
    return this.analyticsService.getPlayCount(songId);
  }
}
