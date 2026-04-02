import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { IngestService } from './ingest.service';
import { SongsModule } from '../songs/songs.module';
import { ArtistsModule } from '../artists/artists.module';
import { AlbumsModule } from '../albums/albums.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SongsModule,
    ArtistsModule,
    AlbumsModule,
  ],
  providers: [IngestService],
})
export class IngestModule {}
