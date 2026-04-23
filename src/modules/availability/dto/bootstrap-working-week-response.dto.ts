import { ApiProperty } from '@nestjs/swagger';

export class BootstrapWorkingWeekResponseDto {
  @ApiProperty()
  created: number;

  @ApiProperty()
  updated: number;

  @ApiProperty()
  skipped: number;
}
