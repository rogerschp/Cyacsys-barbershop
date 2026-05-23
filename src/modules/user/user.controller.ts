import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';
import { UserRoles } from '../../common/decorators/user-roles.decorator';
import { UserRolesGuard } from '../../common/guards/user-roles.guard';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateMyUserDto } from './dto/update-my-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { FindUserByEmailUseCase } from './use-cases/find-user-by-email.use-case';
import { FindUserByIdUseCase } from './use-cases/find-user-by-id.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';
import { RequestUser } from '../auth/strategies/bearer-token.strategy';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastro público de usuário (sempre role CLIENT)',
    description:
      'Cria usuário no banco e no Firebase. Não exige autenticação. O papel é sempre CLIENT.',
  })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'E-mail já em uso' })
  async register(
    @Body()
    dto: RegisterUserDto,
  ) {
    return await this.createUserUseCase.run(dto);
  }

  @Get('by-email')
  @UseGuards(BearerAuthGuard, UserRolesGuard)
  @UserRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Busca usuário por e-mail' })
  @ApiQuery({ name: 'email', required: true, description: 'E-mail do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findByEmail(
    @Query('email')
    email: string,
  ) {
    const user = await this.findUserByEmailUseCase.run(email);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Get('me')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Retorna o usuário autenticado (inclui professionalProfile quando existir)',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário autenticado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  async findMe(@Req() req: { user?: RequestUser }) {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    return this.findUserByIdUseCase.run(userId);
  }

  @Patch('me')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Atualiza o perfil do usuário autenticado',
    description:
      'Permite alterar name, telephone, password e address. Não altera role nem status.',
  })
  @ApiBody({ type: UpdateMyUserDto })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  async updateMe(
    @Req() req: { user?: RequestUser },
    @Body() dto: UpdateMyUserDto,
  ) {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    return this.updateUserUseCase.run(userId, dto);
  }

  @Get(':id')
  @UseGuards(BearerAuthGuard, UserRolesGuard)
  @UserRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Busca usuário por ID' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findById(
    @Param('id')
    id: string,
  ) {
    return await this.findUserByIdUseCase.run(id);
  }

  @Patch(':id')
  @UseGuards(BearerAuthGuard, UserRolesGuard)
  @UserRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Atualiza usuário (admin; alterações sincronizadas no Firebase)',
  })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async update(
    @Param('id')
    id: string,
    @Body()
    dto: UpdateUserDto,
  ) {
    return await this.updateUserUseCase.run(id, dto);
  }

  @Delete(':id')
  @UseGuards(BearerAuthGuard, UserRolesGuard)
  @UserRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Remove usuário (soft delete + desabilita no Firebase)',
  })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário removido' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async delete(
    @Param('id')
    id: string,
  ) {
    await this.deleteUserUseCase.run(id);
  }
}
