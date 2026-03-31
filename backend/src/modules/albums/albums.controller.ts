import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get('artists/:artistId/albums')
  getAlbumsByArtist(@Req() req: any, @Param('artistId') artistId: string) {
    return this.albumsService.getAlbumsByArtist(req.user.userId, artistId);
  }

  @Get('albums/:id')
  getAlbum(@Param('id') id: string) {
    return this.albumsService.getAlbumById(id);
  }

  @Get('albums/:id/songs')
  getAlbumSongs(@Req() req: any, @Param('id') id: string) {
    return this.albumsService.getAlbumSongs(req.user.userId, id);
  }
}
