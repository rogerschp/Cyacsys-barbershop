import { Test, TestingModule } from '@nestjs/testing';
import { AssertCustomerBookingPolicies } from 'src/modules/booking/domain/assert-customer-booking-policies';
import { BOOKING_REPOSITORY } from 'src/modules/booking/interfaces/booking-repository.interface';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { MAX_ACTIVE_BOOKINGS_PER_CUSTOMER_PER_TENANT } from 'src/modules/booking/booking-active-limit.constants';

describe('AssertCustomerBookingPolicies', () => {
  let policies: AssertCustomerBookingPolicies;
  let repo: {
    findActiveCustomerTimeOverlap: jest.Mock;
    countActiveByCustomerIdentity: jest.Mock;
  };

  const identity = {
    kind: 'GUEST' as const,
    key: 'guest:5511999999999',
    phone: '5511999999999',
    displayName: 'João',
  };

  beforeEach(async () => {
    repo = {
      findActiveCustomerTimeOverlap: jest.fn().mockResolvedValue(null),
      countActiveByCustomerIdentity: jest.fn().mockResolvedValue(0),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssertCustomerBookingPolicies,
        { provide: BOOKING_REPOSITORY, useValue: repo },
      ],
    }).compile();
    policies = module.get(AssertCustomerBookingPolicies);
  });

  it('permite quando sem overlap e abaixo do limite', async () => {
    await expect(
      policies.assertCanCreate({
        tenantId: 't1',
        identity,
        startsAt: new Date('2099-06-15T12:00:00Z'),
        endsAt: new Date('2099-06-15T13:00:00Z'),
      }),
    ).resolves.toBeUndefined();
  });

  it('bloqueia overlap da mesma pessoa', async () => {
    repo.findActiveCustomerTimeOverlap.mockResolvedValue({
      startsAt: new Date(),
      endsAt: new Date(),
    });
    try {
      await policies.assertCanCreate({
        tenantId: 't1',
        identity,
        startsAt: new Date('2099-06-15T12:30:00Z'),
        endsAt: new Date('2099-06-15T13:30:00Z'),
      });
      expect(true).toBe(false);
    } catch (e) {
      expect((e as BusinessRuleException).getResponse()).toMatchObject({
        code: 'CUSTOMER_TIME_CONFLICT',
      });
    }
  });

  it('bloqueia ao atingir limite de ativos no tenant', async () => {
    repo.countActiveByCustomerIdentity.mockResolvedValue(
      MAX_ACTIVE_BOOKINGS_PER_CUSTOMER_PER_TENANT,
    );
    try {
      await policies.assertCanCreate({
        tenantId: 't1',
        identity,
        startsAt: new Date('2099-06-15T12:00:00Z'),
        endsAt: new Date('2099-06-15T13:00:00Z'),
      });
      expect(true).toBe(false);
    } catch (e) {
      expect((e as BusinessRuleException).getResponse()).toMatchObject({
        code: 'CUSTOMER_ACTIVE_BOOKINGS_LIMIT',
      });
    }
  });
});
