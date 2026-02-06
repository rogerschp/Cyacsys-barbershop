import { ApiProperty } from '@nestjs/swagger';
import { PaginatedOptionsDto } from './paginated-options.dto';

export class PaginatedResponseDto<T> {
  constructor(
    data: {
      data: T[];
      total: number;
    },
    options: PaginatedOptionsDto,
  ) {
    const { first = 0, rows = 10 } = options;
    const page = Math.floor(first / rows) + 1;
    const pageCount = Math.ceil(data.total / rows);
    this.data = data.data;
    this.total = data.total;
    this.first = first;
    this.rows = rows;
    this.page = page;
    this.pageCount = pageCount;
  }

  @ApiProperty({
    description: 'Array of items for the current page',
    isArray: true,
    type: 'array',
  })
  data: T[];

  @ApiProperty({
    description: 'Total number of records (across all pages)',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'First record index (0-based). Used by PrimeReact Table.',
    example: 0,
  })
  first: number;

  @ApiProperty({
    description: 'Number of records per page',
    example: 10,
  })
  rows: number;

  @ApiProperty({
    description: 'Current page number (1-based)',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  pageCount: number;
}
