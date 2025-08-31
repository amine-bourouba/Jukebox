import { Controller, Get, Put, Param, Body, NotFoundException, BadRequestException, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
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