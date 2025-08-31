import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCommentById(id: string) {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  async addComment(dto: CreateCommentDto, authorId: string) {
    return this.prisma.comment.create({
      data: {
        songId: dto.songId,
        authorId,
        content: dto.content,
        rating: dto.rating,
      },
    });
  }

  async updateComment(id: string, dto: UpdateCommentDto) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        content: dto.content,
        rating: dto.rating,
      },
    });
  }

  async deleteComment(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }
}
