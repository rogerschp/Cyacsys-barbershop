import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TopServiceMetricsDto } from '../dto/top-service-metrics.dto';
import { fetchTopServices } from '../utils/report-query.utils';

@Injectable()
export class ServiceMetricsService {
  constructor(private readonly dataSource: DataSource) {}

  async topServices(
    tenantId: string,
    start: Date,
    end: Date,
    limit = 5,
  ): Promise<TopServiceMetricsDto[]> {
    return fetchTopServices(this.dataSource, tenantId, start, end, limit);
  }
}
