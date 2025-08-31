import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { SongsModule } from '../modules/songs/songs.module';
import { PlaylistsModule } from '../modules/playlists/playlists.module';
import { CommentsModule } from '../modules/comments/comments.module';
import { SearchModule } from '../modules/search/search.module';
import { RecommendationsModule } from '../modules/recommendations/recommendations.module';
import { MediaModule } from '../modules/media/media.module';
import { AnalyticsModule } from '../modules/analytics/analytics.module';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../modules/auth/auth.service';
import { JwtStrategy } from '../modules/auth/jwt.strategy';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: '1d' },
    }),
    AuthModule,
    UsersModule,
    SongsModule,
    PlaylistsModule,
    CommentsModule,
    SearchModule,
    RecommendationsModule,
    MediaModule,
    AnalyticsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    AuthService,
    JwtStrategy,
    JwtAuthGuard
  ],
})
export class AppModule {}
