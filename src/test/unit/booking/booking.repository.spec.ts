import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingRepository } from 'src/repository/booking/booking.repository';
import { BookingEntity } from 'src/modules/booking/entities/booking.entity';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';

describe('BookingRepository', () => {
  let repository: BookingRepository;
  let rootBookingRepo: jest.Mocked<Pick<Repository<BookingEntity>, 'findOne'>>;
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
});
