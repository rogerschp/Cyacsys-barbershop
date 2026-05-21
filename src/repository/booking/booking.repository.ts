import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BookingEntity } from '../../modules/booking/entities/booking.entity';
import { BookingStatus } from '../../modules/booking/entities/booking-status.enum';
import {
  CreateBookingDraftData,
  IBookingRepository,
} from '../../modules/booking/interfaces/booking-repository.interface';

const ACTIVE_STATUSES = [BookingStatus.DRAFT, BookingStatus.CONFIRMED];

@Injectable()
export class BookingRepository implements IBookingRepository {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepo: Repository<BookingEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createDraft(data: CreateBookingDraftData): Promise<BookingEntity> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT id FROM tenant_professionals WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
        [data.tenantProfessionalId, data.tenantId],
      );
      const qb = manager
        .getRepository(BookingEntity)
        .createQueryBuilder('b')
        .where('b.tenant_professional_id = :tpid', {
          tpid: data.tenantProfessionalId,
        })
        .andWhere('b.tenant_id = :tid', { tid: data.tenantId })
        .andWhere('b.status IN (:...st)', { st: ACTIVE_STATUSES })
        .andWhere('b.starts_at < :endsAt AND b.ends_at > :startsAt', {
          startsAt: data.startsAt,
          endsAt: data.endsAt,
        });
      const conflict = await qb.getOne();
      if (conflict) {
        throw new Error('BOOKING_SLOT_CONFLICT');
      }
      const e = manager.getRepository(BookingEntity).create({
        tenantId: data.tenantId,
        tenantProfessionalId: data.tenantProfessionalId,
        serviceId: data.serviceId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        status: BookingStatus.DRAFT,
        createdByTenantUserId: data.createdByTenantUserId,
      });
      return manager.getRepository(BookingEntity).save(e);
    });
  }

  async findByIdForTenantProfessional(
    id: string,
    tenantId: string,
    tenantProfessionalId: string,
  ): Promise<BookingEntity | null> {
    return this.bookingRepo.findOne({
      where: { id, tenantId, tenantProfessionalId },
    });
  }

  async updateStatus(
    id: string,
    tenantId: string,
    tenantProfessionalId: string,
    expectedStatus: BookingStatus,
    newStatus: BookingStatus,
  ): Promise<BookingEntity> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT id FROM tenant_professionals WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
        [tenantProfessionalId, tenantId],
      );
      const repo = manager.getRepository(BookingEntity);
      const current = await repo.findOne({
        where: { id, tenantId, tenantProfessionalId },
      });
      if (!current) {
        throw new Error('BOOKING_NOT_FOUND');
      }
      if (current.status !== expectedStatus) {
        throw new Error('BOOKING_INVALID_STATUS');
      }
      if (newStatus === BookingStatus.CONFIRMED) {
        const overlap = await repo
          .createQueryBuilder('b')
          .where('b.tenant_professional_id = :tpid', {
            tpid: tenantProfessionalId,
          })
          .andWhere('b.tenant_id = :tid', { tid: tenantId })
          .andWhere('b.status IN (:...st)', { st: ACTIVE_STATUSES })
          .andWhere('b.id != :ex', { ex: id })
          .andWhere('b.starts_at < :endsAt AND b.ends_at > :startsAt', {
            startsAt: current.startsAt,
            endsAt: current.endsAt,
          })
          .getOne();
        if (overlap) {
          throw new Error('BOOKING_SLOT_CONFLICT');
        }
      }
      current.status = newStatus;
      return repo.save(current);
    });
  }
}
