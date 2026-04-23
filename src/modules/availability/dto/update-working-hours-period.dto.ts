import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
export class UpdateWorkingHoursPeriodDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    startTime?: string;
    @ApiProperty({ required: false })
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    endTime?: string;
}
