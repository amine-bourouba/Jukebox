import { Module } from '@nestjs/common';

import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [PlaylistsController],
  providers: [PlaylistsService, PrismaService],
})
export class PlaylistsModule {}
