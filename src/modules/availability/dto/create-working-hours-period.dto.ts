import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
export class CreateWorkingHoursPeriodDto {
    @ApiProperty({ example: '14:00' })
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    startTime: string;
    @ApiProperty({ example: '19:00' })
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    endTime: string;
}
