import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, NotFoundException, BadRequestException,
  UseInterceptors, UploadedFiles,
  Res,
  StreamableFile,
  Query
} from '@nestjs/common';
import type { Response } from 'express';
import { extname, join } from 'path';
import { FilesInterceptor } from '@nestjs/platform-express';

import { MusicBrainzService } from './musicbrainz.service';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { diskStorage } from 'multer';
import * as mm from 'music-metadata';
import { createReadStream, existsSync } from 'fs';



function fileName(req: any, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  callback(null, uniqueSuffix + extname(file.originalname));
}

function resolveSongFilePath(song: any): string {
  if (!song) throw new NotFoundException('Song not found');
  if (!song.filePath) throw new BadRequestException('Song file not available');
  const filePath = join(process.cwd(), song.filePath.replace(/\\/g, '/'));
  if (!existsSync(filePath)) throw new NotFoundException('Song file does not exist');
  return filePath;
}

@Controller('songs')
export class SongsController {
  constructor(
    private readonly songsService: SongsService,
    private readonly musicBrainzService: MusicBrainzService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createSong(@Req() req: any, @Body() dto: CreateSongDto) {
    try {
      return await this.songsService.createSong(req.user.userId, dto);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateSong(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSongDto) {
    try {
      const updated = await this.songsService.updateSong(req.user.userId, id, dto);
      if (!updated) throw new NotFoundException('Song not found or unauthorized');
      return updated;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteSong(@Req() req: any, @Param('id') id: string) {
    try {
      const deleted = await this.songsService.deleteSong(req.user.userId, id);
      if (!deleted) throw new NotFoundException('Song not found or unauthorized');
      return { message: 'Song deleted' };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 2, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const audioTypes = [
          'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
          'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/ogg', 'audio/x-ms-wma'
        ];
        if (audioTypes.includes(file.mimetype)) {
          cb(null, './uploads/songs');
        } else if (file.mimetype.startsWith('image/')) {
          cb(null, './uploads/thumbnails');
        } else {
          cb(new BadRequestException('Invalid file type'), '');
        }
      },
      filename: fileName,
    }),
    fileFilter: (req, file, cb) => {
      const audioTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
        'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/ogg', 'audio/x-ms-wma'
      ];
      if (audioTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type'), false);
      }
    },
    // limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  }))
  async uploadSong(
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: CreateSongDto
  ) {
    try {
      const audioTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
        'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/ogg', 'audio/x-ms-wma'
      ];
      const songFile = files.find(f => audioTypes.includes(f.mimetype));
      const thumbnailFile = files.find(f => f.mimetype.startsWith('image/'));
      if (!songFile) throw new BadRequestException('Song file is required');

      let finalData: any = {};
      let mbData: any = null;

      if (body.title && body.title.trim()) {
        try {
          mbData = await this.musicBrainzService.searchRecording(body.title.trim(), body.artist.trim());
        } catch (err) {
          mbData = null;
        }
      }

      if (mbData) {
        // Use MusicBrainz metadata
        finalData = {
          title: mbData.title,
          artist: mbData.artist || '',
          album: mbData.release || undefined,
          duration: mbData.length ? Math.round(mbData.length / 1000) : undefined,
        };
      } else {
        let metadata;
        try {
          metadata = await mm.parseFile(songFile.path);
        } catch (err) {
          metadata = null;
        }

        let artist = '';
        if (metadata) {
          if (Array.isArray(metadata.common.artists) && metadata.common.artists.length > 0) {
            artist = metadata.common.artists[0];
          } else if (metadata.common.artist) {
            artist = metadata.common.artist;
          }
        }

        finalData = {
          title: body.title || metadata?.common.title || songFile.originalname.replace(/\.[^/.]+$/, ''),
          artist,
          album: metadata?.common.album,
          duration: metadata?.format.duration ? Math.round(metadata.format.duration) : undefined,
        };
      }

      if (!finalData.title || !finalData.title.trim()) {
        finalData.title = body.title || songFile.originalname.replace(/\.[^/.]+$/, '');
        finalData.artist = '';
        finalData.album = undefined;
      }

      return await this.songsService.createSongWithUpload(
        req.user.userId,
        finalData,
        songFile.path,
        thumbnailFile?.path
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

    @UseGuards(JwtAuthGuard)
    @Get('search')
    async searchSongs(@Req() req: any, @Body() body: any) {
    try {
      const {
        title,
        artist,
        album,
        page = 1,
        pageSize = 20
      } = body;

      const filters: any = {};
      if (title) filters.title = { contains: title, mode: 'insensitive' };
      if (artist) filters.artist = { contains: artist, mode: 'insensitive' };
      if (album) filters.album = { contains: album, mode: 'insensitive' };

      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      const [songs, total] = await Promise.all([
        this.songsService.searchSongs(filters, skip, take),
        this.songsService.countSongs(filters)
      ]);

      return {
        data: songs,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('liked')
  async getLikedSongs(@Req() req: any, @Query() query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const liked = await this.songsService.getLikedSongs(req.user.userId, skip, pageSize);
    return liked.map((like: any) => like.song);
  }
  
  @Get(':id')
  async getSong(@Param('id') id: string) {
    const song = await this.songsService.getSongById(id);
    if (!song) throw new NotFoundException('Song not found');
    return song;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/stream')
  async streamSong(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    const song = await this.songsService.getSongById(id);
    const filePath = resolveSongFilePath(song);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `inline; filename="${song?.title}.mp3"`,
    });

    const fileStream = createReadStream(filePath);
    return new StreamableFile(fileStream);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/download')
  async downloadSong(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    const song = await this.songsService.getSongById(id);
    const filePath = resolveSongFilePath(song);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${song?.title}.mp3"`,
    });

    const fileStream = createReadStream(filePath);
    return new StreamableFile(fileStream);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async likeSong(@Req() req: any, @Param('id') id: string) {
    try {
      return await this.songsService.likeSong(req.user.userId, id);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  async unlikeSong(@Req() req: any, @Param('id') id: string) {
    try {
      return await this.songsService.unlikeSong(req.user.userId, id);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
