import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BearerAuthGuard } from '../../auth/guards/bearer-auth.guard';
import { GetProfessionalProfileByUserUseCase } from '../../professional-profile/use-cases/get-professional-profile-by-user.use-case';
import { CreateReviewCommentDto } from '../dto/create-review-comment.dto';
import { CreateReviewDto } from '../dto/create-review.dto';
import { ReplyReviewDto } from '../dto/reply-review.dto';
import {
  ReviewCommentResponseDto,
  ReviewListResponseDto,
  ReviewResponseDto,
} from '../dto/review-response.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewTargetType } from '../entities/review-target-type.enum';
import { UpsertReviewUseCase } from '../use-cases/create-review.use-case';
import { CreateReviewCommentUseCase } from '../use-cases/create-review-comment.use-case';
import { DeleteReviewCommentUseCase } from '../use-cases/delete-review-comment.use-case';
import { DeleteReviewUseCase } from '../use-cases/delete-review.use-case';
import { EditReviewUseCase } from '../use-cases/edit-review.use-case';
import { ListReviewsUseCase } from '../use-cases/list-reviews.use-case';
import { ReplyReviewUseCase } from '../use-cases/reply-review.use-case';
import { ReviewMapper } from '../mappers/review.mapper';

interface RequestWithUser {
  user?: { dbUser?: { id: string } };
}

@ApiTags('reviews')
@Controller('users/:userId/professional-profile/reviews')
export class ProfessionalReviewByUserController {
  constructor(
    private readonly upsertReviewUseCase: UpsertReviewUseCase,
    private readonly listReviewsUseCase: ListReviewsUseCase,
    private readonly getProfessionalProfileByUserUseCase: GetProfessionalProfileByUserUseCase,
    private readonly createReviewCommentUseCase: CreateReviewCommentUseCase,
    private readonly deleteReviewCommentUseCase: DeleteReviewCommentUseCase,
  ) {}

  @Post()
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Cria ou atualiza avaliação do perfil profissional (UPSERT)',
  })
  @ApiParam({ name: 'userId', description: 'UUID do usuário dono do perfil' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, type: ReviewResponseDto })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async create(
    @Param('userId') userId: string,
    @Body() dto: CreateReviewDto,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const profile = await this.getProfessionalProfileByUserUseCase.run(userId);
    const reviewerUserId = req.user?.dbUser?.id ?? '';
    const result = await this.upsertReviewUseCase.run(
      reviewerUserId,
      ReviewTargetType.PROFESSIONAL,
      profile.id,
      dto,
    );
    res.status(result.created ? 201 : 200);
    return ReviewMapper.toResponse(result.review);
  }

  @Get()
  @ApiOperation({ summary: 'Lista avaliações do profissional (público)' })
  @ApiParam({ name: 'userId', description: 'UUID do usuário dono do perfil' })
  @ApiResponse({ status: 200, type: ReviewListResponseDto })
  async list(@Param('userId') userId: string) {
    const profile = await this.getProfessionalProfileByUserUseCase.run(userId);
    return this.listReviewsUseCase.run(
      ReviewTargetType.PROFESSIONAL,
      profile.id,
    );
  }

  @Post(':id/comments')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Adiciona comentário à avaliação (autor)' })
  @ApiBody({ type: CreateReviewCommentDto })
  @ApiResponse({ status: 201, type: ReviewCommentResponseDto })
  async addComment(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateReviewCommentDto,
    @Req() req: RequestWithUser,
  ) {
    const profile = await this.getProfessionalProfileByUserUseCase.run(userId);
    const authorId = req.user?.dbUser?.id ?? '';
    const comment = await this.createReviewCommentUseCase.run(
      id,
      authorId,
      ReviewTargetType.PROFESSIONAL,
      profile.id,
      dto,
    );
    return ReviewMapper.toCommentResponse(comment);
  }

  @Delete(':id/comments/:commentId')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove comentário (autor)' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: RequestWithUser,
  ) {
    const authorId = req.user?.dbUser?.id ?? '';
    await this.deleteReviewCommentUseCase.run(commentId, authorId);
    return { message: 'Comment deleted successfully' };
  }
}

@ApiTags('reviews')
@Controller('users/me/professional-profile/reviews')
@UseGuards(BearerAuthGuard)
@ApiBearerAuth('bearer')
export class MyProfessionalReviewController {
  constructor(
    private readonly editReviewUseCase: EditReviewUseCase,
    private readonly replyReviewUseCase: ReplyReviewUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
    private readonly getProfessionalProfileByUserUseCase: GetProfessionalProfileByUserUseCase,
  ) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Edita avaliação do profissional (autor)' })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async edit(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    const profile = await this.getProfessionalProfileByUserUseCase.run(userId);
    const review = await this.editReviewUseCase.run(
      id,
      userId,
      ReviewTargetType.PROFESSIONAL,
      profile.id,
      dto,
    );
    return ReviewMapper.toResponse(review);
  }

  @Patch(':id/reply')
  @ApiOperation({ summary: 'Responde avaliação (próprio profissional)' })
  @ApiBody({ type: ReplyReviewDto })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async reply(
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    const profile = await this.getProfessionalProfileByUserUseCase.run(userId);
    const review = await this.replyReviewUseCase.run(
      id,
      userId,
      ReviewTargetType.PROFESSIONAL,
      profile.id,
      dto,
    );
    return ReviewMapper.toResponse(review);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove avaliação (autor ou profissional)' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user?.dbUser?.id ?? '';
    const profile = await this.getProfessionalProfileByUserUseCase.run(userId);
    await this.deleteReviewUseCase.run(
      id,
      userId,
      ReviewTargetType.PROFESSIONAL,
      profile.id,
    );
    return { message: 'Review deleted successfully' };
  }
}
