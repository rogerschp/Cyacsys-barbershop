import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IReviewCommentRepository,
  REVIEW_COMMENT_REPOSITORY,
} from '../interfaces/review-repository.interface';

@Injectable()
export class DeleteReviewCommentUseCase {
  constructor(
    @Inject(REVIEW_COMMENT_REPOSITORY)
    private readonly commentRepository: IReviewCommentRepository,
  ) {}

  async run(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorUserId !== userId) {
      throw new ForbiddenException('Only the author can delete this comment');
    }
    await this.commentRepository.softDelete(commentId);
  }
}
