import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AvailabilityController } from '../modules/availability/availability.controller';
import { CreateProfessionalServiceLinkUseCase } from '../modules/availability/use-cases/create-professional-service-link.use-case';
import { UpdateProfessionalServiceLinkUseCase } from '../modules/availability/use-cases/update-professional-service-link.use-case';
import { DeleteProfessionalServiceLinkUseCase } from '../modules/availability/use-cases/delete-professional-service-link.use-case';
import { ListProfessionalServiceLinksUseCase } from '../modules/availability/use-cases/list-professional-service-links.use-case';
import { CreateWorkingHoursUseCase } from '../modules/availability/use-cases/create-working-hours.use-case';
import { UpdateWorkingHoursUseCase } from '../modules/availability/use-cases/update-working-hours.use-case';
import { DeleteWorkingHoursUseCase } from '../modules/availability/use-cases/delete-working-hours.use-case';
import { ListWorkingHoursUseCase } from '../modules/availability/use-cases/list-working-hours.use-case';
import { GetWorkingHoursUseCase } from '../modules/availability/use-cases/get-working-hours.use-case';
import { CreateWorkingHoursPeriodUseCase } from '../modules/availability/use-cases/create-working-hours-period.use-case';
import { UpdateWorkingHoursPeriodUseCase } from '../modules/availability/use-cases/update-working-hours-period.use-case';
import { DeleteWorkingHoursPeriodUseCase } from '../modules/availability/use-cases/delete-working-hours-period.use-case';
import { CreateTimeOffUseCase } from '../modules/availability/use-cases/create-time-off.use-case';
import { UpdateTimeOffUseCase } from '../modules/availability/use-cases/update-time-off.use-case';
import { DeleteTimeOffUseCase } from '../modules/availability/use-cases/delete-time-off.use-case';
import { ListTimeOffsUseCase } from '../modules/availability/use-cases/list-time-offs.use-case';
import { CreateBlockUseCase } from '../modules/availability/use-cases/create-block.use-case';
import { UpdateBlockUseCase } from '../modules/availability/use-cases/update-block.use-case';
import { DeleteBlockUseCase } from '../modules/availability/use-cases/delete-block.use-case';
import { ListBlocksUseCase } from '../modules/availability/use-cases/list-blocks.use-case';
import { GetAvailableSlotsUseCase } from '../modules/availability/use-cases/get-available-slots.use-case';
import { BootstrapWorkingWeekUseCase } from '../modules/availability/use-cases/bootstrap-working-week.use-case';
import { BearerAuthGuard } from '../modules/auth/guards/bearer-auth.guard';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';
import { TenantMembershipGuard } from '../common/guards/tenant-membership.guard';
import { TenantResolverGuard } from '../common/guards/tenant-resolver.guard';
import { TenantRolesGuard } from '../common/guards/tenant-roles.guard';
import { TenantUserRole } from '../modules/tenant-user/entities/tenant-user-role.enum';
import { DayOfWeek } from '../modules/availability/entities/day-of-week.enum';
import { BlockReason } from '../modules/availability/entities/block-reason.enum';
import { TimeOffReason } from '../modules/availability/entities/time-off-reason.enum';
describe('AvailabilityController (e2e)', () => {
    let app: INestApplication;
    let getAvailableSlotsUseCase: jest.Mocked<GetAvailableSlotsUseCase>;
    let createProfessionalServiceLinkUseCase: jest.Mocked<CreateProfessionalServiceLinkUseCase>;
    let listProfessionalServiceLinksUseCase: jest.Mocked<ListProfessionalServiceLinksUseCase>;
    let createWorkingHoursUseCase: jest.Mocked<CreateWorkingHoursUseCase>;
    let listWorkingHoursUseCase: jest.Mocked<ListWorkingHoursUseCase>;
    let createBlockUseCase: jest.Mocked<CreateBlockUseCase>;
    let createTimeOffUseCase: jest.Mocked<CreateTimeOffUseCase>;
    const tenantId = 'tenant-e2e-uuid';
    const tenantProfessionalId = 'bp-e2e-uuid';
    const basePath = `/tenants/${tenantId}/tenant-professionals/${tenantProfessionalId}`;
    beforeAll(async () => {
        const mocks = {
            createProfessionalServiceLink: { run: jest.fn() },
            updateProfessionalServiceLink: { run: jest.fn() },
            deleteProfessionalServiceLink: { run: jest.fn() },
            listProfessionalServiceLinks: { run: jest.fn() },
            createWorkingHours: { run: jest.fn() },
            updateWorkingHours: { run: jest.fn() },
            deleteWorkingHours: { run: jest.fn() },
            listWorkingHours: { run: jest.fn() },
            getWorkingHours: { run: jest.fn() },
            createWorkingHoursPeriod: { run: jest.fn() },
            updateWorkingHoursPeriod: { run: jest.fn() },
            deleteWorkingHoursPeriod: { run: jest.fn() },
            createTimeOff: { run: jest.fn() },
            updateTimeOff: { run: jest.fn() },
            deleteTimeOff: { run: jest.fn() },
            listTimeOffs: { run: jest.fn() },
            createBlock: { run: jest.fn() },
            updateBlock: { run: jest.fn() },
            deleteBlock: { run: jest.fn() },
            listBlocks: { run: jest.fn() },
            getAvailableSlots: { run: jest.fn() },
            bootstrapWorkingWeek: { run: jest.fn() },
        };
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [AvailabilityController],
            providers: [
                { provide: CreateProfessionalServiceLinkUseCase, useValue: mocks.createProfessionalServiceLink },
                { provide: UpdateProfessionalServiceLinkUseCase, useValue: mocks.updateProfessionalServiceLink },
                { provide: DeleteProfessionalServiceLinkUseCase, useValue: mocks.deleteProfessionalServiceLink },
                { provide: ListProfessionalServiceLinksUseCase, useValue: mocks.listProfessionalServiceLinks },
                { provide: CreateWorkingHoursUseCase, useValue: mocks.createWorkingHours },
                { provide: UpdateWorkingHoursUseCase, useValue: mocks.updateWorkingHours },
                { provide: DeleteWorkingHoursUseCase, useValue: mocks.deleteWorkingHours },
                { provide: ListWorkingHoursUseCase, useValue: mocks.listWorkingHours },
                { provide: GetWorkingHoursUseCase, useValue: mocks.getWorkingHours },
                { provide: CreateWorkingHoursPeriodUseCase, useValue: mocks.createWorkingHoursPeriod },
                { provide: UpdateWorkingHoursPeriodUseCase, useValue: mocks.updateWorkingHoursPeriod },
                { provide: DeleteWorkingHoursPeriodUseCase, useValue: mocks.deleteWorkingHoursPeriod },
                { provide: CreateTimeOffUseCase, useValue: mocks.createTimeOff },
                { provide: UpdateTimeOffUseCase, useValue: mocks.updateTimeOff },
                { provide: DeleteTimeOffUseCase, useValue: mocks.deleteTimeOff },
                { provide: ListTimeOffsUseCase, useValue: mocks.listTimeOffs },
                { provide: CreateBlockUseCase, useValue: mocks.createBlock },
                { provide: UpdateBlockUseCase, useValue: mocks.updateBlock },
                { provide: DeleteBlockUseCase, useValue: mocks.deleteBlock },
                { provide: ListBlocksUseCase, useValue: mocks.listBlocks },
                { provide: GetAvailableSlotsUseCase, useValue: mocks.getAvailableSlots },
                { provide: BootstrapWorkingWeekUseCase, useValue: mocks.bootstrapWorkingWeek },
            ],
        })
            .overrideGuard(BearerAuthGuard)
            .useValue({
            canActivate: (context: any) => {
                const req = context.switchToHttp().getRequest();
                req.user = { dbUser: { id: 'user-e2e-123' }, uid: 'firebase-uid' };
                req.tenantMembership = { role: TenantUserRole.ADMIN };
                return true;
            },
        })
            .overrideInterceptor(TenantInterceptor)
            .useValue({ intercept: (_ctx: any, next: any) => next.handle() })
            .overrideGuard(TenantMembershipGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(TenantResolverGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(TenantRolesGuard)
            .useValue({ canActivate: () => true })
            .compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
        }));
        await app.init();
        getAvailableSlotsUseCase = moduleFixture.get(GetAvailableSlotsUseCase) as jest.Mocked<GetAvailableSlotsUseCase>;
        createProfessionalServiceLinkUseCase = moduleFixture.get(CreateProfessionalServiceLinkUseCase) as jest.Mocked<CreateProfessionalServiceLinkUseCase>;
        listProfessionalServiceLinksUseCase = moduleFixture.get(ListProfessionalServiceLinksUseCase) as jest.Mocked<ListProfessionalServiceLinksUseCase>;
        createWorkingHoursUseCase = moduleFixture.get(CreateWorkingHoursUseCase) as jest.Mocked<CreateWorkingHoursUseCase>;
        listWorkingHoursUseCase = moduleFixture.get(ListWorkingHoursUseCase) as jest.Mocked<ListWorkingHoursUseCase>;
        createBlockUseCase = moduleFixture.get(CreateBlockUseCase) as jest.Mocked<CreateBlockUseCase>;
        createTimeOffUseCase = moduleFixture.get(CreateTimeOffUseCase) as jest.Mocked<CreateTimeOffUseCase>;
    });
    afterAll(async () => {
        if (app)
            await app.close();
    });
    beforeEach(() => {
        jest.clearAllMocks();
        getAvailableSlotsUseCase.run.mockResolvedValue({
            date: '2030-01-07',
            timezone: 'America/Sao_Paulo',
            slots: ['09:00', '10:00'],
        });
        createProfessionalServiceLinkUseCase.run.mockResolvedValue({ id: 'link-1' } as any);
        listProfessionalServiceLinksUseCase.run.mockResolvedValue([]);
        createWorkingHoursUseCase.run.mockResolvedValue({
            id: 'wh-1',
            dayOfWeek: DayOfWeek.MONDAY,
            periods: [],
        } as any);
        listWorkingHoursUseCase.run.mockResolvedValue([]);
        createBlockUseCase.run.mockResolvedValue({
            id: 'block-1',
            reason: BlockReason.LUNCH,
        } as any);
        createTimeOffUseCase.run.mockResolvedValue({
            id: 'timeoff-1',
            date: '2030-01-08',
            reason: TimeOffReason.DAY_OFF,
        } as any);
    });
    describe(`GET ${basePath}/available-slots`, () => {
        it('deve retornar 200 e slots quando query válida', () => {
            return request(app.getHttpServer())
                .get(`${basePath}/available-slots`)
                .query({
                serviceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                date: '2030-01-07',
            })
                .expect(200)
                .expect((res) => {
                expect(res.body).toMatchObject({
                    date: '2030-01-07',
                    timezone: 'America/Sao_Paulo',
                    slots: ['09:00', '10:00'],
                });
                expect(getAvailableSlotsUseCase.run).toHaveBeenCalledWith(tenantId, tenantProfessionalId, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2030-01-07', 'user-e2e-123', TenantUserRole.ADMIN);
            });
        });
        it('deve retornar 400 quando falta serviceId ou date', () => {
            return request(app.getHttpServer())
                .get(`${basePath}/available-slots`)
                .query({ date: '2030-01-07' })
                .expect(400);
        });
    });
    describe(`POST ${basePath}/offered-services`, () => {
        it('deve retornar 201 e chamar use case', () => {
            return request(app.getHttpServer())
                .post(`${basePath}/offered-services`)
                .send({ serviceId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
                .expect(201)
                .expect(() => {
                expect(createProfessionalServiceLinkUseCase.run).toHaveBeenCalledWith(tenantId, tenantProfessionalId, { serviceId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' }, 'user-e2e-123', TenantUserRole.ADMIN);
            });
        });
        it('deve retornar 400 quando serviceId inválido', () => {
            return request(app.getHttpServer())
                .post(`${basePath}/offered-services`)
                .send({ serviceId: 'não-uuid' })
                .expect(400);
        });
    });
    describe(`GET ${basePath}/working-hours`, () => {
        it('deve retornar 200 e lista', () => {
            return request(app.getHttpServer())
                .get(`${basePath}/working-hours`)
                .expect(200)
                .expect(() => {
                expect(listWorkingHoursUseCase.run).toHaveBeenCalledWith(tenantId, tenantProfessionalId, 'user-e2e-123', TenantUserRole.ADMIN);
            });
        });
    });
    describe(`POST ${basePath}/working-hours`, () => {
        it('deve retornar 201 quando body válido', () => {
            return request(app.getHttpServer())
                .post(`${basePath}/working-hours`)
                .send({
                dayOfWeek: DayOfWeek.MONDAY,
                isActive: true,
                periods: [{ startTime: '09:00', endTime: '12:00' }],
            })
                .expect(201)
                .expect(() => {
                expect(createWorkingHoursUseCase.run).toHaveBeenCalledWith(tenantId, tenantProfessionalId, expect.objectContaining({ dayOfWeek: DayOfWeek.MONDAY }), 'user-e2e-123', TenantUserRole.ADMIN);
            });
        });
    });
    describe(`POST ${basePath}/blocks`, () => {
        it('deve retornar 201 quando body válido', () => {
            return request(app.getHttpServer())
                .post(`${basePath}/blocks`)
                .send({
                date: '2030-01-07',
                startTime: '12:00',
                endTime: '13:00',
                reason: BlockReason.LUNCH,
            })
                .expect(201)
                .expect(() => {
                expect(createBlockUseCase.run).toHaveBeenCalledWith(tenantId, tenantProfessionalId, expect.objectContaining({ reason: BlockReason.LUNCH }), 'user-e2e-123', TenantUserRole.ADMIN);
            });
        });
        it('deve retornar 400 quando reason é BOOKING', () => {
            return request(app.getHttpServer())
                .post(`${basePath}/blocks`)
                .send({
                date: '2030-01-07',
                startTime: '12:00',
                endTime: '13:00',
                reason: 'BOOKING',
            })
                .expect(400);
        });
    });
    describe(`POST ${basePath}/time-offs`, () => {
        it('deve retornar 201 para folga dia inteiro', () => {
            return request(app.getHttpServer())
                .post(`${basePath}/time-offs`)
                .send({
                date: '2030-01-08',
                reason: TimeOffReason.DAY_OFF,
            })
                .expect(201)
                .expect(() => {
                expect(createTimeOffUseCase.run).toHaveBeenCalledWith(tenantId, tenantProfessionalId, expect.objectContaining({
                    date: '2030-01-08',
                    reason: TimeOffReason.DAY_OFF,
                }), 'user-e2e-123', TenantUserRole.ADMIN);
            });
        });
    });
});
