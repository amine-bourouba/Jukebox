import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentUser(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateCurrentUser(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getUserLibrarySongs(userId: string) {
    // Example: fetch songs liked by the user
    return this.prisma.song.findMany({
      where: { songLikes: { some: { userId } } },
    });
  }

  async getUserLibraryPlaylists(userId: string) {
    // Example: fetch playlists followed by the user
    return this.prisma.playlist.findMany({
      where: { playlistFollowers: { some: { userId } } },
    });
  }
}