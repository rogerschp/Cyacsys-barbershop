import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { BearerAuthGuard } from '../../auth/guards/bearer-auth.guard';
import { TenantRoles } from '../../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../../common/guards/tenant-roles.guard';
import { TenantResolverGuard } from '../../../common/guards/tenant-resolver.guard';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { CreateReviewDto } from '../dto/create-review.dto';
import { ReplyReviewDto } from '../dto/reply-review.dto';
import {
  ReviewListResponseDto,
  ReviewResponseDto,
} from '../dto/review-response.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewTargetType } from '../entities/review-target-type.enum';
import { CreateReviewUseCase } from '../use-cases/create-review.use-case';
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
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly listReviewsUseCase: ListReviewsUseCase,
    private readonly editReviewUseCase: EditReviewUseCase,
    private readonly replyReviewUseCase: ReplyReviewUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
  ) {}

  @Post()
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Cria avaliação do estabelecimento' })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, type: ReviewResponseDto })
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateReviewDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    const review = await this.createReviewUseCase.run(
      userId,
      ReviewTargetType.TENANT,
      tenantId,
      dto,
    );
    return ReviewMapper.toResponse(review);
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
  @ApiOperation({ summary: 'Edita avaliação (apenas autor, uma vez)' })
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
