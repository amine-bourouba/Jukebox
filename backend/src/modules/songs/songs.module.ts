import { Module } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { AcoustIdService } from './acoustid.service';
import { ArtistsModule } from '../artists/artists.module';

@Module({
  imports: [ArtistsModule],
  providers: [SongsService, PrismaService, AcoustIdService],
  controllers: [SongsController],
  exports: [SongsService, AcoustIdService],
})
export class SongsModule {}