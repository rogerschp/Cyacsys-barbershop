import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReviewCommentDto {
  @ApiProperty({
    maxLength: 1000,
    example: 'Voltei hoje e o atendimento melhorou!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  body: string;
}
