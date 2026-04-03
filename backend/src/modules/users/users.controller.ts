import {
  Controller, Get, Put, Post, Param, Body,
  NotFoundException, BadRequestException, ForbiddenException,
  Req, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req: any) {
    try {
      const user = await this.usersService.getCurrentUser(req.user.userId);
      if (!user) throw new NotFoundException('User not found');
      const { password, refreshToken, ...safeUser } = user;
      return safeUser;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  // PUT /users/me
  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateCurrentUser(@Req() req: any, @Body() dto: UpdateUserDto) {
    try {
      const updated = await this.usersService.updateCurrentUser(req.user.userId, dto);
      if (!updated) throw new NotFoundException('User not found');
      const { password, refreshToken, ...safeUser } = updated;
      return safeUser;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  // PUT /users/me/password
  @UseGuards(JwtAuthGuard)
  @Put('me/password')
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    try {
      await this.usersService.changePassword(req.user.userId, dto.currentPassword, dto.newPassword);
      return { message: 'Password updated' };
    } catch (error: any) {
      if (error instanceof ForbiddenException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  // POST /users/me/avatar
  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new BadRequestException('Only image files are allowed'), false);
    },
  }))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const avatarUrl = `uploads/avatars/${file.filename}`;
    const updated = await this.usersService.updateAvatar(req.user.userId, avatarUrl);
    const { password, refreshToken, ...safeUser } = updated;
    return safeUser;
  }

  // GET /users/:id
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.usersService.getUserById(id);
      if (!user) throw new NotFoundException('User not found');
      const { password, refreshToken, ...safeUser } = user;
      return safeUser;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  // GET /users/me/library/songs
  @UseGuards(JwtAuthGuard)
  @Get('me/library/songs')
  async getUserLibrarySongs(@Req() req: any) {
    try {
      return await this.usersService.getUserLibrarySongs(req.user.userId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  // GET /users/me/library/playlists
  @UseGuards(JwtAuthGuard)
  @Get('me/library/playlists')
  async getUserLibraryPlaylists(@Req() req: any) {
    try {
      return await this.usersService.getUserLibraryPlaylists(req.user.userId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
