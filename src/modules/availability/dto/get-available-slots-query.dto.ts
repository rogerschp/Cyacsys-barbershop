import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches } from 'class-validator';
export class GetAvailableSlotsQueryDto {
    @ApiProperty()
    @IsUUID()
    serviceId: string;
    @ApiProperty({
        example: '2026-03-21',
        description: 'Data civil no fuso do tenant',
    })
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    date: string;
}
