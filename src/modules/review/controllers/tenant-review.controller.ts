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
import { TenantRoles } from '../../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../../common/guards/tenant-roles.guard';
import { TenantResolverGuard } from '../../../common/guards/tenant-resolver.guard';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
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
@Controller('tenants/:tenantId/reviews')
export class TenantReviewController {
  constructor(
    private readonly upsertReviewUseCase: UpsertReviewUseCase,
    private readonly listReviewsUseCase: ListReviewsUseCase,
    private readonly editReviewUseCase: EditReviewUseCase,
    private readonly replyReviewUseCase: ReplyReviewUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
    private readonly createReviewCommentUseCase: CreateReviewCommentUseCase,
    private readonly deleteReviewCommentUseCase: DeleteReviewCommentUseCase,
  ) {}

  @Post()
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Cria ou atualiza avaliação do estabelecimento (UPSERT)',
    description:
      '201 se criada, 200 se atualizada. Exige booking COMPLETED e plano com reviews.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, type: ReviewResponseDto })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateReviewDto,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    const result = await this.upsertReviewUseCase.run(
      userId,
      ReviewTargetType.TENANT,
      tenantId,
      dto,
    );
    res.status(result.created ? 201 : 200);
    return ReviewMapper.toResponse(result.review);
  }

  @Get()
  @ApiOperation({ summary: 'Lista avaliações do estabelecimento (público)' })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiResponse({ status: 200, type: ReviewListResponseDto })
  async list(@Param('tenantId') tenantId: string) {
    return this.listReviewsUseCase.run(ReviewTargetType.TENANT, tenantId);
  }

  @Patch(':id')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Edita avaliação (autor; quantas vezes quiser)',
  })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async edit(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    const review = await this.editReviewUseCase.run(
      id,
      userId,
      ReviewTargetType.TENANT,
      tenantId,
      dto,
    );
    return ReviewMapper.toResponse(review);
  }

  @Post(':id/comments')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Adiciona comentário à avaliação (autor)' })
  @ApiBody({ type: CreateReviewCommentDto })
  @ApiResponse({ status: 201, type: ReviewCommentResponseDto })
  async addComment(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateReviewCommentDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    const comment = await this.createReviewCommentUseCase.run(
      id,
      userId,
      ReviewTargetType.TENANT,
      tenantId,
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
    const userId = req.user?.dbUser?.id ?? '';
    await this.deleteReviewCommentUseCase.run(commentId, userId);
    return { message: 'Comment deleted successfully' };
  }

  @Patch(':id/reply')
  @UseGuards(
    BearerAuthGuard,
    TenantResolverGuard,
    TenantMembershipGuard,
    TenantRolesGuard,
  )
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Responde avaliação (OWNER ou ADMIN)' })
  @ApiBody({ type: ReplyReviewDto })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async reply(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    const review = await this.replyReviewUseCase.run(
      id,
      userId,
      ReviewTargetType.TENANT,
      tenantId,
      dto,
    );
    return ReviewMapper.toResponse(review);
  }

  @Delete(':id')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Remove avaliação (autor ou OWNER/ADMIN)' })
  @ApiResponse({ status: 200, description: 'Avaliação removida' })
  async delete(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    await this.deleteReviewUseCase.run(
      id,
      userId,
      ReviewTargetType.TENANT,
      tenantId,
    );
    return { message: 'Review deleted successfully' };
  }
}
