import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { CreateProfessionalProfileDto } from './dto/create-professional-profile.dto';
import { ProfessionalProfileResponseDto } from './dto/professional-profile-response.dto';
import { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';
import { CreateProfessionalProfileUseCase } from './use-cases/create-professional-profile.use-case';
import { DeactivateProfessionalProfileUseCase } from './use-cases/deactivate-professional-profile.use-case';
import { GetProfessionalProfileByUserUseCase } from './use-cases/get-professional-profile-by-user.use-case';
import { UpdateProfessionalProfileUseCase } from './use-cases/update-professional-profile.use-case';
import { ProfessionalProfileMapper } from './mappers/professional-profile.mapper';

interface RequestWithUser {
  user?: {
    dbUser?: {
      id: string;
    };
  };
}

@ApiTags('professional-profile')
@Controller('users/me/professional-profile')
@UseGuards(BearerAuthGuard)
@ApiBearerAuth('bearer')
export class ProfessionalProfileController {
  constructor(
    private readonly createProfessionalProfileUseCase: CreateProfessionalProfileUseCase,
    private readonly updateProfessionalProfileUseCase: UpdateProfessionalProfileUseCase,
    private readonly deactivateProfessionalProfileUseCase: DeactivateProfessionalProfileUseCase,
    private readonly getProfessionalProfileByUserUseCase: GetProfessionalProfileByUserUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cria o perfil profissional global do usuário autenticado',
    description:
      'Qualquer usuário autenticado pode criar um perfil profissional. Um usuário só pode ter um perfil ativo (não deletado).',
  })
  @ApiBody({ type: CreateProfessionalProfileDto })
  @ApiResponse({
    status: 201,
    description: 'Perfil profissional criado',
    type: ProfessionalProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Regra de negócio (PROFESSIONAL_PROFILE_ALREADY_EXISTS, INVALID_EXPERIENCE_YEARS, INVALID_WHATSAPP_NUMBER, INVALID_INSTAGRAM_USERNAME)',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async create(
    @Body() dto: CreateProfessionalProfileDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    const profile = await this.createProfessionalProfileUseCase.run(
      userId,
      dto,
    );
    return ProfessionalProfileMapper.toResponse(profile);
  }

  @Get()
  @ApiOperation({
    summary: 'Retorna o perfil profissional do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil encontrado',
    type: ProfessionalProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Professional profile not found' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getMine(@Req() req: RequestWithUser) {
    const userId = req.user?.dbUser?.id ?? '';
    const profile = await this.getProfessionalProfileByUserUseCase.run(userId);
    return ProfessionalProfileMapper.toResponse(profile);
  }

  @Patch()
  @ApiOperation({
    summary: 'Atualiza o perfil profissional do usuário autenticado',
  })
  @ApiBody({ type: UpdateProfessionalProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado',
    type: ProfessionalProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Regra de negócio (INVALID_EXPERIENCE_YEARS, INVALID_WHATSAPP_NUMBER, INVALID_INSTAGRAM_USERNAME)',
  })
  @ApiResponse({ status: 404, description: 'Professional profile not found' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async update(
    @Body() dto: UpdateProfessionalProfileDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    const profile = await this.updateProfessionalProfileUseCase.run(
      userId,
      dto,
    );
    return ProfessionalProfileMapper.toResponse(profile);
  }

  @Patch('deactivate')
  @ApiOperation({
    summary: 'Desativa o perfil profissional do usuário autenticado',
    description: 'Define isActive = false.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil desativado',
    type: ProfessionalProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Professional profile not found' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async deactivate(@Req() req: RequestWithUser) {
    const userId = req.user?.dbUser?.id ?? '';
    const profile = await this.deactivateProfessionalProfileUseCase.run(userId);
    return ProfessionalProfileMapper.toResponse(profile);
  }
}
