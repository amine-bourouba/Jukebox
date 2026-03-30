import { Controller, Get, Put, Post, Delete, Param, Body, UseGuards, Req, HttpCode } from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('artists')
@UseGuards(JwtAuthGuard)
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Get()
  getArtists(@Req() req: any) {
    return this.artistsService.getArtists(req.user.userId);
  }

  @Get('followed')
  getFollowedArtists(@Req() req: any) {
    return this.artistsService.getFollowedArtists(req.user.userId);
  }

  @Get(':id')
  getArtist(@Req() req: any, @Param('id') id: string) {
    return this.artistsService.getArtistById(req.user.userId, id);
  }

  @Get(':id/songs')
  getArtistSongs(@Req() req: any, @Param('id') id: string) {
    return this.artistsService.getArtistSongs(req.user.userId, id);
  }

  @Put(':id')
  updateArtist(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { imageUrl?: string; bio?: string },
  ) {
    return this.artistsService.updateArtist(req.user.userId, id, body);
  }

  @Post(':id/follow')
  @HttpCode(200)
  followArtist(@Req() req: any, @Param('id') id: string) {
    return this.artistsService.followArtist(req.user.userId, id);
  }

  @Delete(':id/follow')
  @HttpCode(200)
  unfollowArtist(@Req() req: any, @Param('id') id: string) {
    return this.artistsService.unfollowArtist(req.user.userId, id);
  }
}
