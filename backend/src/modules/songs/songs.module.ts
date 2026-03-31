import { Module } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { AcoustIdService } from './acoustid.service';
import { ArtistsModule } from '../artists/artists.module';
import { AlbumsModule } from '../albums/albums.module';

@Module({
  imports: [ArtistsModule, AlbumsModule],
  providers: [SongsService, PrismaService, AcoustIdService],
  controllers: [SongsController],
  exports: [SongsService, AcoustIdService],
})
export class SongsModule {}