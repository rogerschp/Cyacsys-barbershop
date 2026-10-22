import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationChannel } from 'src/modules/notification/domain/notification-channel.enum';
import { NotificationEvent } from 'src/modules/notification/domain/notification-event.enum';
import { NotificationRecordStatus } from 'src/modules/notification/domain/notification-record-status.enum';
import { NotificationRecordEntity } from 'src/modules/notification/entities/notification-record.entity';
import { NotificationRecordRepository } from 'src/repository/notification/notification-record.repository';

describe('NotificationRecordRepository', () => {
  let repository: NotificationRecordRepository;
  let typeOrmRepo: jest.Mocked<
    Pick<Repository<NotificationRecordEntity>, 'create' | 'save'>
  > &
    Record<string, jest.Mock>;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRecordRepository,
        {
          provide: getRepositoryToken(NotificationRecordEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(NotificationRecordRepository);
    typeOrmRepo = module.get(getRepositoryToken(NotificationRecordEntity));
  });

  it('create persiste registro SENT', async () => {
    const entity = { id: 'rec-1' } as NotificationRecordEntity;
    typeOrmRepo.create.mockReturnValue(entity);
    typeOrmRepo.save.mockResolvedValue(entity);

    const result = await repository.create({
      event: NotificationEvent.TEAM_INVITATION,
      channel: NotificationChannel.EMAIL,
      to: 'a@b.com',
      status: NotificationRecordStatus.SENT,
      payload: { tenantName: 'Shop' },
    });

    expect(typeOrmRepo.create).toHaveBeenCalledWith({
      event: NotificationEvent.TEAM_INVITATION,
      channel: NotificationChannel.EMAIL,
      to: 'a@b.com',
      status: NotificationRecordStatus.SENT,
      errorMessage: null,
      payload: { tenantName: 'Shop' },
      userId: null,
      tenantId: null,
      attempts: 0,
      providerMessageId: null,
      sentAt: null,
      nextRetryAt: null,
      idempotencyKey: null,
    });
    expect(result).toBe(entity);
  });

  it('update e findDueForRetry delegam ao TypeORM', async () => {
    typeOrmRepo.find = jest.fn().mockResolvedValue([{ id: 'r1' }]);
    typeOrmRepo.update = jest.fn().mockResolvedValue(undefined);
    const now = new Date();
    await expect(repository.findDueForRetry(10, now)).resolves.toEqual([
      { id: 'r1' },
    ]);
    expect(typeOrmRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, order: { createdAt: 'ASC' } }),
    );
    await repository.update('r1', { status: NotificationRecordStatus.SENT });
    expect(typeOrmRepo.update).toHaveBeenCalledWith('r1', { status: 'SENT' });
    typeOrmRepo.findOne = jest.fn().mockResolvedValue({ id: 'r2' });
    await expect(repository.findByIdempotencyKey('k1')).resolves.toEqual({
      id: 'r2',
    });
  });
});
