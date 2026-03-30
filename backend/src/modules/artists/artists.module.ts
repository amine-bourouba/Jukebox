import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ArtistsService } from './artists.service';
import { ArtistsController } from './artists.controller';

@Module({
  providers: [ArtistsService, PrismaService],
  controllers: [ArtistsController],
  exports: [ArtistsService],
})
export class ArtistsModule {}
