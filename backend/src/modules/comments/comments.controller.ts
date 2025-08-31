import { Controller, Get, Post, Put, Delete, Param, Body, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id')
  async getComment(@Param('id') id: string) {
    try {
      const comment = await this.commentsService.getCommentById(id);
      if (!comment) throw new NotFoundException('Comment not found');
      return comment;
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post()
  async addComment(@Body() dto: CreateCommentDto) {
    try {
      return await this.commentsService.addComment(dto, 'demo-author-id');
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  async updateComment(@Param('id') id: string, @Body() dto: UpdateCommentDto) {
    try {
      return await this.commentsService.updateComment(id, dto);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  async deleteComment(@Param('id') id: string) {
    try {
      return await this.commentsService.deleteComment(id);
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }
}