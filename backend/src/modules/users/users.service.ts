import { Injectable, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new ForbiddenException('Current password is incorrect');
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { password: hashed } });
  }

  async updateAvatar(id: string, avatarUrl: string) {
    return this.prisma.user.update({ where: { id }, data: { avatarUrl } });
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