import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { BookingRepository } from 'src/repository/booking/booking.repository';
import { BookingEntity } from 'src/modules/booking/entities/booking.entity';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';

describe('BookingRepository', () => {
  let repository: BookingRepository;
  let listQb: Record<string, jest.Mock>;
  let activeQb: Record<string, jest.Mock>;
  let rootBookingRepo: {
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockQb: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getOne: jest.Mock;
  };
  let txRepo: {
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let mockManager: {
    query: jest.Mock;
    getRepository: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'tp-uuid';
  const serviceId = 'svc-uuid';
  const startsAt = new Date('2099-06-15T13:00:00.000Z');
  const endsAt = new Date('2099-06-15T13:30:00.000Z');

  beforeEach(async () => {
    mockQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    listQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
      getCount: jest.fn().mockResolvedValue(0),
    };

    activeQb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    txRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      create: jest.fn((d) => ({ ...d })),
      save: jest.fn(),
    };

    mockManager = {
      query: jest.fn().mockResolvedValue(undefined),
      getRepository: jest.fn().mockReturnValue(txRepo),
    };

    dataSource = {
      transaction: jest.fn(
        async (cb: (m: typeof mockManager) => Promise<unknown>) =>
          cb(mockManager),
      ),
    };

    rootBookingRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn((alias?: string) => {
        if (alias === 'b') {
          // Heuristic: callers that select startsAt use active/overlap qb;
          // listOps uses leftJoinAndSelect first.
          return listQb;
        }
        return listQb;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingRepository,
        {
          provide: getRepositoryToken(BookingEntity),
          useValue: rootBookingRepo,
        },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    repository = module.get(BookingRepository);
  });

  describe('createDraft', () => {
    it('persiste rascunho quando não há sobreposição', async () => {
      mockQb.getOne.mockResolvedValue(null);
      txRepo.save.mockResolvedValue({
        id: 'new-id',
        status: BookingStatus.DRAFT,
      } as BookingEntity);

      const result = await repository.createDraft({
        tenantId,
        tenantProfessionalId,
        serviceId,
        startsAt,
        endsAt,
        createdByTenantUserId: 'tu-1',
        clientUserId: 'user-1',
        guestName: null,
        guestPhone: null,
        guestEmail: null,
      });

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(txRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(BookingStatus.DRAFT);
    });

    it('lança BOOKING_SLOT_CONFLICT quando há sobreposição', async () => {
      mockQb.getOne.mockResolvedValue({ id: 'other' } as BookingEntity);

      await expect(
        repository.createDraft({
          tenantId,
          tenantProfessionalId,
          serviceId,
          startsAt,
          endsAt,
          createdByTenantUserId: 'tu-1',
          clientUserId: 'user-1',
          guestName: null,
          guestPhone: null,
          guestEmail: null,
        }),
      ).rejects.toThrow('BOOKING_SLOT_CONFLICT');
      expect(txRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findByIdForTenantProfessional', () => {
    it('delega ao TypeORM findOne', async () => {
      const row = { id: 'b1' } as BookingEntity;
      rootBookingRepo.findOne.mockResolvedValue(row);

      const out = await repository.findByIdForTenantProfessional(
        'b1',
        tenantId,
        tenantProfessionalId,
      );

      expect(rootBookingRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'b1', tenantId, tenantProfessionalId },
      });
      expect(out).toBe(row);
    });
  });

  describe('updateStatus', () => {
    const bookingId = 'b1';

    it('confirma quando não há outro agendamento sobreposto', async () => {
      const current = {
        id: bookingId,
        tenantId,
        tenantProfessionalId,
        startsAt,
        endsAt,
        status: BookingStatus.DRAFT,
      } as BookingEntity;

      txRepo.findOne.mockResolvedValue(current);
      mockQb.getOne.mockResolvedValue(null);
      txRepo.save.mockImplementation((e) => Promise.resolve(e));

      const out = await repository.updateStatus(
        bookingId,
        tenantId,
        tenantProfessionalId,
        BookingStatus.DRAFT,
        BookingStatus.CONFIRMED,
      );

      expect(out.status).toBe(BookingStatus.CONFIRMED);
    });

    it('lança BOOKING_NOT_FOUND quando registro não existe', async () => {
      txRepo.findOne.mockResolvedValue(null);

      await expect(
        repository.updateStatus(
          bookingId,
          tenantId,
          tenantProfessionalId,
          BookingStatus.DRAFT,
          BookingStatus.CONFIRMED,
        ),
      ).rejects.toThrow('BOOKING_NOT_FOUND');
    });

    it('lança BOOKING_INVALID_STATUS quando status esperado diverge', async () => {
      txRepo.findOne.mockResolvedValue({
        id: bookingId,
        status: BookingStatus.CONFIRMED,
      } as BookingEntity);

      await expect(
        repository.updateStatus(
          bookingId,
          tenantId,
          tenantProfessionalId,
          BookingStatus.DRAFT,
          BookingStatus.CONFIRMED,
        ),
      ).rejects.toThrow('BOOKING_INVALID_STATUS');
    });

    it('lança BOOKING_SLOT_CONFLICT na confirmação com overlap', async () => {
      const current = {
        id: bookingId,
        tenantId,
        tenantProfessionalId,
        startsAt,
        endsAt,
        status: BookingStatus.DRAFT,
      } as BookingEntity;

      txRepo.findOne.mockResolvedValue(current);
      mockQb.getOne.mockResolvedValue({ id: 'other' } as BookingEntity);

      await expect(
        repository.updateStatus(
          bookingId,
          tenantId,
          tenantProfessionalId,
          BookingStatus.DRAFT,
          BookingStatus.CONFIRMED,
        ),
      ).rejects.toThrow('BOOKING_SLOT_CONFLICT');
    });

    it('cancela rascunho sem checagem de overlap', async () => {
      const current = {
        id: bookingId,
        tenantId,
        tenantProfessionalId,
        startsAt,
        endsAt,
        status: BookingStatus.DRAFT,
      } as BookingEntity;

      txRepo.findOne.mockResolvedValue(current);
      txRepo.save.mockImplementation((e) => Promise.resolve(e));

      const out = await repository.updateStatus(
        bookingId,
        tenantId,
        tenantProfessionalId,
        BookingStatus.DRAFT,
        BookingStatus.CANCELLED,
      );

      expect(mockQb.getOne).not.toHaveBeenCalled();
      expect(out.status).toBe(BookingStatus.CANCELLED);
    });
  });

  describe('findActiveByTenantProfessionalBetween', () => {
    it('retorna ranges ativos no intervalo', async () => {
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(activeQb);
      activeQb.getMany.mockResolvedValue([
        { startsAt, endsAt },
      ] as BookingEntity[]);

      const out = await repository.findActiveByTenantProfessionalBetween(
        tenantId,
        tenantProfessionalId,
        startsAt,
        endsAt,
      );

      expect(out).toEqual([{ startsAt, endsAt }]);
      expect(activeQb.andWhere).toHaveBeenCalled();
    });
  });

  describe('findByClientUserId', () => {
    it('lista sem filtro de status', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'b1' }]),
      };
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      const out = await repository.findByClientUserId('user-1');
      expect(out).toEqual([{ id: 'b1' }]);
      expect(qb.andWhere).not.toHaveBeenCalledWith(
        'b.status = :status',
        expect.anything(),
      );
    });

    it('filtra por status quando informado', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      await repository.findByClientUserId('user-1', {
        status: BookingStatus.CONFIRMED,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('b.status = :status', {
        status: BookingStatus.CONFIRMED,
      });
    });
  });

  describe('findActiveCustomerTimeOverlap', () => {
    it('filtra por USER e retorna overlap', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ startsAt, endsAt }),
      };
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      const out = await repository.findActiveCustomerTimeOverlap({
        tenantId,
        identity: {
          kind: 'USER',
          key: 'user:u1',
          userId: 'u1',
        },
        startsAt,
        endsAt,
        excludeBookingId: 'ex-1',
      });

      expect(out).toEqual({ startsAt, endsAt });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'b.client_user_id = :clientUserId',
        { clientUserId: 'u1' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('b.id != :excludeBookingId', {
        excludeBookingId: 'ex-1',
      });
    });

    it('filtra por GUEST e retorna null quando sem overlap', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      const out = await repository.findActiveCustomerTimeOverlap({
        tenantId,
        identity: {
          kind: 'GUEST',
          key: 'guest:5511999999999',
          phone: '5511999999999',
        },
        startsAt,
        endsAt,
      });

      expect(out).toBeNull();
      expect(qb.andWhere).toHaveBeenCalledWith('b.guest_phone = :guestPhone', {
        guestPhone: '5511999999999',
      });
    });
  });

  describe('countActiveByCustomerIdentity', () => {
    it('conta ativos por USER com exclude', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      const count = await repository.countActiveByCustomerIdentity({
        tenantId,
        identity: { kind: 'USER', key: 'user:u1', userId: 'u1' },
        excludeBookingId: 'b1',
      });

      expect(count).toBe(2);
      expect(qb.andWhere).toHaveBeenCalledWith('b.id != :excludeBookingId', {
        excludeBookingId: 'b1',
      });
    });

    it('conta ativos por GUEST sem exclude', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      const count = await repository.countActiveByCustomerIdentity({
        tenantId,
        identity: {
          kind: 'GUEST',
          key: 'guest:5511',
          phone: '5511',
        },
      });

      expect(count).toBe(1);
      expect(qb.andWhere).toHaveBeenCalledWith('b.guest_phone = :guestPhone', {
        guestPhone: '5511',
      });
    });
  });

  describe('listOpsBookings', () => {
    it('lista sem filtros opcionais', async () => {
      listQb.getMany.mockResolvedValue([{ id: 'b1' }]);
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(listQb);

      const out = await repository.listOpsBookings({ tenantId });
      expect(out).toEqual([{ id: 'b1' }]);
      expect(listQb.andWhere).not.toHaveBeenCalled();
    });

    it('aplica filtros de profissional, range e status', async () => {
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(listQb);
      const rangeStart = new Date('2099-06-15T03:00:00.000Z');
      const rangeEnd = new Date('2099-06-16T03:00:00.000Z');

      await repository.listOpsBookings({
        tenantId,
        tenantProfessionalId,
        rangeStart,
        rangeEnd,
        status: BookingStatus.CONFIRMED,
      });

      expect(listQb.andWhere).toHaveBeenCalledWith(
        'b.tenant_professional_id = :tpId',
        { tpId: tenantProfessionalId },
      );
      expect(listQb.andWhere).toHaveBeenCalledWith(
        'b.starts_at >= :rangeStart AND b.starts_at < :rangeEnd',
        { rangeStart, rangeEnd },
      );
      expect(listQb.andWhere).toHaveBeenCalledWith('b.status = :status', {
        status: BookingStatus.CONFIRMED,
      });
    });
  });

  describe('completePastConfirmed', () => {
    it('atualiza CONFIRMED com ends_at no passado', async () => {
      const execute = jest.fn().mockResolvedValue({ affected: 2 });
      const updateQb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute,
      };
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(updateQb);

      const now = new Date('2099-01-01T00:00:00.000Z');
      await expect(repository.completePastConfirmed(now)).resolves.toBe(2);
      expect(updateQb.set).toHaveBeenCalledWith({
        status: BookingStatus.COMPLETED,
      });
      expect(updateQb.andWhere).toHaveBeenCalledWith('ends_at < :now', { now });
    });

    it('retorna 0 quando affected é undefined', async () => {
      const updateQb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(updateQb);
      await expect(repository.completePastConfirmed(new Date())).resolves.toBe(
        0,
      );
    });
  });

  describe('existsCompletedForReviewer', () => {
    it('filtra por tenant', async () => {
      listQb.getCount.mockResolvedValue(1);
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(listQb);

      await expect(
        repository.existsCompletedForReviewer({
          reviewerUserId: 'u1',
          tenantId,
        }),
      ).resolves.toBe(true);

      expect(listQb.andWhere).toHaveBeenCalledWith('b.tenant_id = :tenantId', {
        tenantId,
      });
    });

    it('filtra por professionalProfileId', async () => {
      listQb.getCount.mockResolvedValue(0);
      listQb.innerJoin = jest.fn().mockReturnThis();
      rootBookingRepo.createQueryBuilder = jest.fn().mockReturnValue(listQb);

      await expect(
        repository.existsCompletedForReviewer({
          reviewerUserId: 'u1',
          professionalProfileId: 'pp1',
        }),
      ).resolves.toBe(false);

      expect(listQb.innerJoin).toHaveBeenCalled();
    });
  });
});
