import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomerCounts, fetchCustomerCounts } from '../utils/report-query.utils';

@Injectable()
export class CustomerMetricsService {
  constructor(private readonly dataSource: DataSource) {}

  async countInPeriod(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<CustomerCounts> {
    return fetchCustomerCounts(this.dataSource, tenantId, start, end);
  }
}
