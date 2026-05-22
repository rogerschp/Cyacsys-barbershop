import { ApiProperty } from '@nestjs/swagger';
import { IsIn, Matches } from 'class-validator';
import { BlockReason } from '../entities/block-reason.enum';
export class CreateBlockDto {
    @ApiProperty({ example: '2026-03-21' })
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    date: string;
    @ApiProperty({ example: '12:00' })
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    startTime: string;
    @ApiProperty({ example: '14:00' })
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    endTime: string;
    @ApiProperty({
        enum: [BlockReason.LUNCH, BlockReason.PERSONAL],
        description: 'BOOKING é reservado ao módulo de agendamento.',
    })
    @IsIn([BlockReason.LUNCH, BlockReason.PERSONAL])
    reason: BlockReason.LUNCH | BlockReason.PERSONAL;
}
