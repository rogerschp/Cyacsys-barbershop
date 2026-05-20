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
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { FindUserByEmailUseCase } from './use-cases/find-user-by-email.use-case';
import { FindUserByIdUseCase } from './use-cases/find-user-by-id.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';
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
  @Get('by-email')
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
  async findMe(
    @Req()
    req: {
      user?: {
        dbUser?: {
          id: string;
        };
      };
    },
  ) {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    return this.findUserByIdUseCase.run(userId);
  }

  @Post()
  @ApiOperation({
    summary: 'Cria um novo usuário (banco primeiro, depois sync Firebase)',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'E-mail já em uso' })
  async create(
    @Body()
    dto: CreateUserDto,
  ) {
    console.log(dto);
    return await this.createUserUseCase.run(dto);
  }
  @Get(':id')
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
  @ApiOperation({
    summary: 'Atualiza usuário (alterações sincronizadas no Firebase)',
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
