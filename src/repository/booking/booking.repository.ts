import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { BookingEntity } from '../../modules/booking/entities/booking.entity';
import { BookingStatus } from '../../modules/booking/entities/booking-status.enum';
import { CustomerIdentity } from '../../modules/booking/domain/customer-identity';
import {
  ActiveBookingTimeRange,
  CreateBookingDraftData,
  CustomerActiveQuery,
  CustomerTimeOverlapQuery,
  IBookingRepository,
  ListOpsBookingsQuery,
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

  async findActiveByTenantProfessionalBetween(
    tenantId: string,
    tenantProfessionalId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<ActiveBookingTimeRange[]> {
    const rows = await this.bookingRepo
      .createQueryBuilder('b')
      .select(['b.startsAt', 'b.endsAt'])
      .where('b.tenant_id = :tenantId', { tenantId })
      .andWhere('b.tenant_professional_id = :tenantProfessionalId', {
        tenantProfessionalId,
      })
      .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_STATUSES })
      .andWhere('b.starts_at < :rangeEnd AND b.ends_at > :rangeStart', {
        rangeStart,
        rangeEnd,
      })
      .getMany();

    return rows.map((row) => ({
      startsAt: row.startsAt,
      endsAt: row.endsAt,
    }));
  }

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
        clientUserId: data.clientUserId,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail,
      });
      return manager.getRepository(BookingEntity).save(e);
    });
  }

  async findByClientUserId(
    clientUserId: string,
    options?: { status?: BookingStatus },
  ): Promise<BookingEntity[]> {
    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.tenant', 'tenant')
      .leftJoinAndSelect('tenant.address', 'tenantAddress')
      .leftJoinAndSelect('b.tenantProfessional', 'tp')
      .leftJoinAndSelect('tp.professionalProfile', 'pp')
      .leftJoinAndSelect('b.service', 'service')
      .leftJoin('b.createdByTenantUser', 'creator')
      .where(
        '(b.client_user_id = :clientUserId OR creator.user_id = :clientUserId)',
        { clientUserId },
      )
      .orderBy('b.starts_at', 'DESC');

    if (options?.status) {
      qb.andWhere('b.status = :status', { status: options.status });
    }

    return qb.getMany();
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

  async findActiveCustomerTimeOverlap(
    query: CustomerTimeOverlapQuery,
  ): Promise<ActiveBookingTimeRange | null> {
    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .select(['b.startsAt', 'b.endsAt'])
      .where('b.tenant_id = :tenantId', { tenantId: query.tenantId })
      .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_STATUSES })
      .andWhere('b.starts_at < :endsAt AND b.ends_at > :startsAt', {
        startsAt: query.startsAt,
        endsAt: query.endsAt,
      });

    this.applyCustomerIdentityFilter(qb, query.identity);

    if (query.excludeBookingId) {
      qb.andWhere('b.id != :excludeBookingId', {
        excludeBookingId: query.excludeBookingId,
      });
    }

    const row = await qb.getOne();
    if (!row) return null;
    return { startsAt: row.startsAt, endsAt: row.endsAt };
  }

  async countActiveByCustomerIdentity(
    query: CustomerActiveQuery,
  ): Promise<number> {
    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .where('b.tenant_id = :tenantId', { tenantId: query.tenantId })
      .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_STATUSES });

    this.applyCustomerIdentityFilter(qb, query.identity);

    if (query.excludeBookingId) {
      qb.andWhere('b.id != :excludeBookingId', {
        excludeBookingId: query.excludeBookingId,
      });
    }

    return qb.getCount();
  }

  async listOpsBookings(query: ListOpsBookingsQuery): Promise<BookingEntity[]> {
    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.tenantProfessional', 'tp')
      .leftJoinAndSelect('tp.professionalProfile', 'pp')
      .leftJoinAndSelect('b.service', 'service')
      .where('b.tenant_id = :tenantId', { tenantId: query.tenantId })
      .orderBy('b.starts_at', 'ASC');

    if (query.tenantProfessionalId) {
      qb.andWhere('b.tenant_professional_id = :tpId', {
        tpId: query.tenantProfessionalId,
      });
    }
    if (query.rangeStart && query.rangeEnd) {
      qb.andWhere('b.starts_at >= :rangeStart AND b.starts_at < :rangeEnd', {
        rangeStart: query.rangeStart,
        rangeEnd: query.rangeEnd,
      });
    }
    if (query.status) {
      qb.andWhere('b.status = :status', { status: query.status });
    }

    return qb.getMany();
  }

  private applyCustomerIdentityFilter(
    qb: SelectQueryBuilder<BookingEntity>,
    identity: CustomerIdentity,
  ): void {
    if (identity.kind === 'USER') {
      qb.andWhere('b.client_user_id = :clientUserId', {
        clientUserId: identity.userId,
      });
      return;
    }
    qb.andWhere('b.guest_phone = :guestPhone', {
      guestPhone: identity.phone,
    });
  }
}
