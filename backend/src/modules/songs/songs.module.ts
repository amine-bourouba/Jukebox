import { Module } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { MusicBrainzService } from './musicbrainz.service';


@Module({
  providers: [SongsService, PrismaService, MusicBrainzService],
  controllers: [SongsController],
  exports: [SongsService, MusicBrainzService],
})
export class SongsModule {}