import { NotFoundException } from '@nestjs/common';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { ActivateAdminSubscriptionUseCase } from 'src/modules/admin/use-cases/activate-admin-subscription.use-case';
import { ExpireAdminSubscriptionUseCase } from 'src/modules/admin/use-cases/expire-admin-subscription.use-case';
import { GetAdminSubscriptionHistoryUseCase } from 'src/modules/admin/use-cases/get-admin-subscription-history.use-case';
import { GetAdminSubscriptionUseCase } from 'src/modules/admin/use-cases/get-admin-subscription.use-case';
import { ListAdminSubscriptionsUseCase } from 'src/modules/admin/use-cases/list-admin-subscriptions.use-case';
import { TenantSubscriptionEntity } from 'src/modules/subscription/entities/tenant-subscription.entity';
import { SubscriptionHistoryEntity } from 'src/modules/subscription/entities/subscription-history.entity';
import { BillingCycle } from 'src/modules/subscription/enums/billing-cycle.enum';
import { PlanName } from 'src/modules/subscription/enums/plan-name.enum';
import { SubscriptionEvent } from 'src/modules/subscription/enums/subscription-event.enum';
import { SubscriptionStatus } from 'src/modules/subscription/enums/subscription-status.enum';
import { ActivateSubscriptionUseCase } from 'src/modules/subscription/use-cases/activate-subscription.use-case';
import { ExpireSubscriptionsUseCase } from 'src/modules/subscription/use-cases/expire-subscriptions.use-case';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';

describe('Admin subscription use cases', () => {
  const subscriptionEntity = {
    id: 'sub-uuid',
    tenantId: 'tenant-uuid',
    planId: 'plan-uuid',
    status: SubscriptionStatus.ACTIVE,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    gracePeriodEnd: null,
    cancelledAt: null,
    tenant: {
      id: 'tenant-uuid',
      name: 'Barbearia',
      slug: 'barbearia',
      status: TenantStatus.ACTIVE,
    },
    plan: {
      id: 'plan-uuid',
      name: PlanName.PRO,
      billingCycle: BillingCycle.MONTHLY,
      price: '149.90',
      gracePeriodDays: 5,
    },
  } as TenantSubscriptionEntity;

  describe('ListAdminSubscriptionsUseCase', () => {
    it('mapeia página do repository para DTOs admin', async () => {
      const repo = {
        findPaginatedWithPlanAndTenant: jest
          .fn()
          .mockResolvedValue(
            new PaginatedResponseDto(
              { data: [subscriptionEntity], total: 1 },
              { first: 0, rows: 10 },
            ),
          ),
      };
      const useCase = new ListAdminSubscriptionsUseCase(repo as any);
      const result = await useCase.run({ first: 0, rows: 10 });

      expect(repo.findPaginatedWithPlanAndTenant).toHaveBeenCalledWith({
        first: 0,
        rows: 10,
      });
      expect(result.data[0].tenant.slug).toBe('barbearia');
      expect(result.data[0].plan.name).toBe(PlanName.PRO);
      expect(result.total).toBe(1);
      expect(result.first).toBe(0);
      expect(result.rows).toBe(10);
    });
  });

  describe('GetAdminSubscriptionUseCase', () => {
    it('retorna detalhe admin', async () => {
      const repo = {
        findByTenantIdWithPlan: jest.fn().mockResolvedValue(subscriptionEntity),
      };
      const useCase = new GetAdminSubscriptionUseCase(repo as any);
      const result = await useCase.run('tenant-uuid');
      expect(result.tenant.id).toBe('tenant-uuid');
      expect(result.subscription.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('lança NotFoundException quando não existe', async () => {
      const repo = {
        findByTenantIdWithPlan: jest.fn().mockResolvedValue(null),
      };
      const useCase = new GetAdminSubscriptionUseCase(repo as any);
      await expect(useCase.run('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('GetAdminSubscriptionHistoryUseCase', () => {
    it('inclui tenantId e subscriptionId no DTO admin', async () => {
      const history = {
        id: 'hist-1',
        tenantId: 'tenant-uuid',
        subscriptionId: 'sub-uuid',
        event: SubscriptionEvent.MANUALLY_ACTIVATED,
        fromPlanId: null,
        toPlanId: 'plan-uuid',
        performedBy: 'admin-uuid',
        createdAt: new Date('2026-01-01'),
      } as SubscriptionHistoryEntity;
      const repo = {
        findByTenantId: jest.fn().mockResolvedValue([history]),
      };
      const useCase = new GetAdminSubscriptionHistoryUseCase(repo as any);
      const result = await useCase.run('tenant-uuid');
      expect(result[0]).toMatchObject({
        tenantId: 'tenant-uuid',
        subscriptionId: 'sub-uuid',
        performedBy: 'admin-uuid',
        event: SubscriptionEvent.MANUALLY_ACTIVATED,
      });
    });
  });

  describe('ActivateAdminSubscriptionUseCase', () => {
    it('delega para ActivateSubscriptionUseCase', async () => {
      const activate = { run: jest.fn().mockResolvedValue({ id: 'sub' }) };
      const useCase = new ActivateAdminSubscriptionUseCase(
        activate as unknown as ActivateSubscriptionUseCase,
      );
      const dto = {
        tenantId: 'tenant-uuid',
        planName: PlanName.PRO,
        billingCycle: BillingCycle.MONTHLY,
      };
      await useCase.run(dto, 'admin-uuid');
      expect(activate.run).toHaveBeenCalledWith(dto, 'admin-uuid');
    });
  });

  describe('ExpireAdminSubscriptionUseCase', () => {
    it('delega para ExpireSubscriptionsUseCase', async () => {
      const expire = { run: jest.fn().mockResolvedValue({ expiredCount: 3 }) };
      const useCase = new ExpireAdminSubscriptionUseCase(
        expire as unknown as ExpireSubscriptionsUseCase,
      );
      await expect(useCase.run()).resolves.toEqual({ expiredCount: 3 });
      expect(expire.run).toHaveBeenCalled();
    });
  });
});
