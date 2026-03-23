import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateBarberServiceLinkDto {
  @ApiProperty({ description: 'UUID do serviço do tenant' })
  @IsUUID()
  serviceId: string;
}
