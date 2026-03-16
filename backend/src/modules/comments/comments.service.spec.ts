import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../test/mock-prisma';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  describe('getCommentById', () => {
    it('should return a comment by id', async () => {
      const mockComment = { id: 'comment-1', content: 'Great song!', rating: 5 };
      prisma.comment.findUnique.mockResolvedValue(mockComment);

      const result = await service.getCommentById('comment-1');

      expect(prisma.comment.findUnique).toHaveBeenCalledWith({ where: { id: 'comment-1' } });
      expect(result).toEqual(mockComment);
    });

    it('should return null if comment not found', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      const result = await service.getCommentById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('addComment', () => {
    it('should create a comment with author and song', async () => {
      const dto = { songId: 'song-1', content: 'Nice track!', rating: 4 };
      const mockComment = { id: 'comment-1', authorId: 'user-1', ...dto };
      prisma.comment.create.mockResolvedValue(mockComment);

      const result = await service.addComment(dto, 'user-1');

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          songId: 'song-1',
          authorId: 'user-1',
          content: 'Nice track!',
          rating: 4,
        },
      });
      expect(result).toEqual(mockComment);
    });

    it('should create a comment without rating', async () => {
      const dto = { songId: 'song-1', content: 'No rating comment' };
      const mockComment = { id: 'comment-2', authorId: 'user-1', ...dto, rating: undefined };
      prisma.comment.create.mockResolvedValue(mockComment);

      const result = await service.addComment(dto, 'user-1');

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          songId: 'song-1',
          authorId: 'user-1',
          content: 'No rating comment',
          rating: undefined,
        },
      });
      expect(result).toEqual(mockComment);
    });
  });

  describe('updateComment', () => {
    it('should update comment content and rating', async () => {
      const dto = { content: 'Updated comment', rating: 3 };
      const updated = { id: 'comment-1', ...dto };
      prisma.comment.update.mockResolvedValue(updated);

      const result = await service.updateComment('comment-1', dto);

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { content: 'Updated comment', rating: 3 },
      });
      expect(result).toEqual(updated);
    });

    it('should update only content when rating is not provided', async () => {
      const dto = { content: 'Only content' };
      prisma.comment.update.mockResolvedValue({ id: 'comment-1', content: 'Only content' });

      const result = await service.updateComment('comment-1', dto);

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { content: 'Only content', rating: undefined },
      });
      expect(result.content).toBe('Only content');
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment by id', async () => {
      const deleted = { id: 'comment-1', content: 'Deleted' };
      prisma.comment.delete.mockResolvedValue(deleted);

      const result = await service.deleteComment('comment-1');

      expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'comment-1' } });
      expect(result).toEqual(deleted);
    });
  });
});
