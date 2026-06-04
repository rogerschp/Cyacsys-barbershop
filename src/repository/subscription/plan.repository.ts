import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntity } from '../../modules/subscription/entities/plan.entity';
import { PlanName } from '../../modules/subscription/enums/plan-name.enum';
import { IPlanRepository } from '../../modules/subscription/interfaces/plan-repository.interface';

@Injectable()
export class PlanRepository implements IPlanRepository {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly repo: Repository<PlanEntity>,
  ) {}

  async findAllActive(): Promise<PlanEntity[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { sortWeight: 'ASC' },
      withDeleted: false,
    });
  }

  async findByName(name: PlanName): Promise<PlanEntity | null> {
    return this.repo.findOne({
      where: { name },
      withDeleted: false,
    });
  }

  async findById(id: string): Promise<PlanEntity | null> {
    return this.repo.findOne({
      where: { id },
      withDeleted: false,
    });
  }
}
