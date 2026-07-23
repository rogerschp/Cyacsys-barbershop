import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BearerAuthGuard } from '../../auth/guards/bearer-auth.guard';
import { RequestUser } from '../../auth/strategies/bearer-token.strategy';
import { CreateMediaDto } from '../dto/create-media.dto';
import { MediaResponseDto } from '../dto/media-response.dto';
import { UploadMediaBinaryDto } from '../dto/upload-media-binary.dto';
import { CreateMediaUseCase } from '../use-cases/create-media.use-case';
import { DeleteMediaUseCase } from '../use-cases/delete-media.use-case';
import { FindMediaByIdUseCase } from '../use-cases/find-media-by-id.use-case';
import { UploadMediaBinaryUseCase } from '../use-cases/upload-media-binary.use-case';

@ApiTags('media')
@Controller('media')
@UseGuards(BearerAuthGuard)
@ApiBearerAuth('bearer')
export class MediaController {
  constructor(
    private readonly uploadMediaBinaryUseCase: UploadMediaBinaryUseCase,
    private readonly createMediaUseCase: CreateMediaUseCase,
    private readonly findMediaByIdUseCase: FindMediaByIdUseCase,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload binário de mídia',
    description:
      'storagePath é montado no backend a partir de mediaType + contexto. Nunca envie storagePath.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'mediaType'],
      properties: {
        file: { type: 'string', format: 'binary' },
        mediaType: {
          type: 'string',
          enum: [
            'AVATAR',
            'USER_AVATAR',
            'LOGO',
            'BANNER',
            'COVER',
            'SERVICE_IMAGE',
            'GALLERY',
            'DOCUMENT',
            'OTHER',
          ],
        },
        tenantId: { type: 'string', format: 'uuid' },
        professionalId: { type: 'string', format: 'uuid' },
        serviceId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({ status: 201, type: MediaResponseDto })
  async upload(
    @UploadedFile()
    file:
      | {
          buffer: Buffer;
          mimetype: string;
          originalname: string;
          size: number;
        }
      | undefined,
    @Body() dto: UploadMediaBinaryDto,
    @Req() req: { user?: RequestUser },
  ) {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    return this.uploadMediaBinaryUseCase.run(
      file
        ? {
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname,
            size: file.size,
          }
        : undefined,
      dto,
      userId,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Registra mídia já existente no provider (sem upload de bytes)',
  })
  @ApiBody({ type: CreateMediaDto })
  @ApiResponse({ status: 201, type: MediaResponseDto })
  async create(
    @Body() dto: CreateMediaDto,
    @Req() req: { user?: RequestUser },
  ) {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    return this.createMediaUseCase.run(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca mídia por id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: MediaResponseDto })
  async findById(@Param('id') id: string) {
    return this.findMediaByIdUseCase.run(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove mídia (storage + soft delete)',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: MediaResponseDto })
  async delete(@Param('id') id: string) {
    return this.deleteMediaUseCase.run(id);
  }
}
