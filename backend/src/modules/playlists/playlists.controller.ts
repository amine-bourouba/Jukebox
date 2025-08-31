import {
  Controller, Get, Post, Delete, Param, Body, UseGuards, Req, NotFoundException, BadRequestException,
  Put
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPlaylist(@Req() req: any, @Body() dto: CreatePlaylistDto) {
    try {
      return await this.playlistsService.createPlaylist(req.user.userId, dto);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserPlaylists(@Req() req: any) {
    return await this.playlistsService.getUserPlaylists(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getPlaylist(@Req() req: any, @Param('id') id: string) {
    const playlist = await this.playlistsService.getPlaylistById(req.user.userId, id);
    if (!playlist) throw new NotFoundException('Playlist not found or unauthorized');
    return playlist;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePlaylist(@Req() req: any, @Param('id') id: string) {
    const deleted = await this.playlistsService.deletePlaylist(req.user.userId, id);
    if (!deleted) throw new NotFoundException('Playlist not found or unauthorized');
    return { message: 'Playlist deleted' };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/songs')
  async addSongToPlaylist(@Req() req: any, @Param('id') id: string, @Body() body: { songId: string }) {
    try {
      return await this.playlistsService.addSongToPlaylist(req.user.userId, id, body.songId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/songs/:songId')
  async removeSongFromPlaylist(@Req() req: any, @Param('id') id: string, @Param('songId') songId: string) {
    try {
      return await this.playlistsService.removeSongFromPlaylist(req.user.userId, id, songId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/reorder')
  async reorderPlaylist(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { songIds: string[] }
  ) {
    return await this.playlistsService.reorderPlaylist(req.user.userId, id, body.songIds);
  }
}