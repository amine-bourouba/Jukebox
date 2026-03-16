import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    commentsService = {
      getCommentById: vi.fn(),
      addComment: vi.fn(),
      updateComment: vi.fn(),
      deleteComment: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [{ provide: CommentsService, useValue: commentsService }],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
  });

  describe('getComment', () => {
    it('should return a comment by id', async () => {
      const comment = { id: 'c-1', content: 'Nice!', rating: 5 };
      commentsService.getCommentById.mockResolvedValue(comment);

      const result = await controller.getComment('c-1');
      expect(result).toEqual(comment);
    });

    it('should throw InternalServerErrorException when comment not found', async () => {
      commentsService.getCommentById.mockResolvedValue(null);

      await expect(controller.getComment('nonexistent'))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('addComment', () => {
    it('should create a comment with demo author id', async () => {
      const dto = { songId: 'song-1', content: 'Great track!', rating: 4 };
      const created = { id: 'c-1', authorId: 'demo-author-id', ...dto };
      commentsService.addComment.mockResolvedValue(created);

      const result = await controller.addComment(dto);

      expect(commentsService.addComment).toHaveBeenCalledWith(dto, 'demo-author-id');
      expect(result).toEqual(created);
    });

    it('should throw BadRequestException on error', async () => {
      commentsService.addComment.mockRejectedValue(new Error('fail'));

      await expect(controller.addComment({ songId: 's', content: 'x' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateComment', () => {
    it('should update a comment', async () => {
      const dto = { content: 'Updated', rating: 3 };
      const updated = { id: 'c-1', ...dto };
      commentsService.updateComment.mockResolvedValue(updated);

      const result = await controller.updateComment('c-1', dto);

      expect(commentsService.updateComment).toHaveBeenCalledWith('c-1', dto);
      expect(result).toEqual(updated);
    });

    it('should throw BadRequestException on error', async () => {
      commentsService.updateComment.mockRejectedValue(new Error('fail'));

      await expect(controller.updateComment('c-1', { content: 'x' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const deleted = { id: 'c-1', content: 'Deleted' };
      commentsService.deleteComment.mockResolvedValue(deleted);

      const result = await controller.deleteComment('c-1');
      expect(result).toEqual(deleted);
    });

    it('should throw NotFoundException on error', async () => {
      commentsService.deleteComment.mockRejectedValue(new Error('not found'));

      await expect(controller.deleteComment('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
