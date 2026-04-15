import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { TenantInterceptor } from 'src/common/interceptors/tenant.interceptor';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { AvailabilityController } from 'src/modules/availability/availability.controller';
import { BlockReason } from 'src/modules/availability/entities/block-reason.enum';
import { DayOfWeek } from 'src/modules/availability/entities/day-of-week.enum';
import { TimeOffReason } from 'src/modules/availability/entities/time-off-reason.enum';
import { CreateBarberServiceLinkUseCase } from 'src/modules/availability/use-cases/create-barber-service-link.use-case';
import { BootstrapWorkingWeekUseCase } from 'src/modules/availability/use-cases/bootstrap-working-week.use-case';
import { CreateBlockUseCase } from 'src/modules/availability/use-cases/create-block.use-case';
import { CreateTimeOffUseCase } from 'src/modules/availability/use-cases/create-time-off.use-case';
import { CreateWorkingHoursPeriodUseCase } from 'src/modules/availability/use-cases/create-working-hours-period.use-case';
import { CreateWorkingHoursUseCase } from 'src/modules/availability/use-cases/create-working-hours.use-case';
import { DeleteBarberServiceLinkUseCase } from 'src/modules/availability/use-cases/delete-barber-service-link.use-case';
import { DeleteBlockUseCase } from 'src/modules/availability/use-cases/delete-block.use-case';
import { DeleteTimeOffUseCase } from 'src/modules/availability/use-cases/delete-time-off.use-case';
import { DeleteWorkingHoursPeriodUseCase } from 'src/modules/availability/use-cases/delete-working-hours-period.use-case';
import { DeleteWorkingHoursUseCase } from 'src/modules/availability/use-cases/delete-working-hours.use-case';
import { GetAvailableSlotsUseCase } from 'src/modules/availability/use-cases/get-available-slots.use-case';
import { GetWorkingHoursUseCase } from 'src/modules/availability/use-cases/get-working-hours.use-case';
import { ListBarberServiceLinksUseCase } from 'src/modules/availability/use-cases/list-barber-service-links.use-case';
import { ListBlocksUseCase } from 'src/modules/availability/use-cases/list-blocks.use-case';
import { ListTimeOffsUseCase } from 'src/modules/availability/use-cases/list-time-offs.use-case';
import { ListWorkingHoursUseCase } from 'src/modules/availability/use-cases/list-working-hours.use-case';
import { UpdateBarberServiceLinkUseCase } from 'src/modules/availability/use-cases/update-barber-service-link.use-case';
import { UpdateBlockUseCase } from 'src/modules/availability/use-cases/update-block.use-case';
import { UpdateTimeOffUseCase } from 'src/modules/availability/use-cases/update-time-off.use-case';
import { UpdateWorkingHoursPeriodUseCase } from 'src/modules/availability/use-cases/update-working-hours-period.use-case';
import { UpdateWorkingHoursUseCase } from 'src/modules/availability/use-cases/update-working-hours.use-case';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';

function mockUseCase() {
    return { run: jest.fn().mockResolvedValue({ ok: true }) };
}

describe('AvailabilityController (HTTP)', () => {
    let app: INestApplication;
    const tenantId = 'tenant-uuid';
    const barberProfileId = 'bp-uuid';
    const serviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const base = `/tenants/${tenantId}/barber-profiles/${barberProfileId}`;
    const userId = 'user-uuid-123';
    const role = TenantUserRole.STAFF;

    const uc = {
        createBarberServiceLink: mockUseCase(),
        updateBarberServiceLink: mockUseCase(),
        deleteBarberServiceLink: mockUseCase(),
        listBarberServiceLinks: mockUseCase(),
        createWorkingHours: mockUseCase(),
        bootstrapWorkingWeek: mockUseCase(),
        updateWorkingHours: mockUseCase(),
        deleteWorkingHours: mockUseCase(),
        listWorkingHours: mockUseCase(),
        getWorkingHours: mockUseCase(),
        createWorkingHoursPeriod: mockUseCase(),
        updateWorkingHoursPeriod: mockUseCase(),
        deleteWorkingHoursPeriod: mockUseCase(),
        createTimeOff: mockUseCase(),
        updateTimeOff: mockUseCase(),
        deleteTimeOff: mockUseCase(),
        listTimeOffs: mockUseCase(),
        createBlock: mockUseCase(),
        updateBlock: mockUseCase(),
        deleteBlock: mockUseCase(),
        listBlocks: mockUseCase(),
        getAvailableSlots: mockUseCase(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [AvailabilityController],
            providers: [
                { provide: CreateBarberServiceLinkUseCase, useValue: uc.createBarberServiceLink },
                { provide: UpdateBarberServiceLinkUseCase, useValue: uc.updateBarberServiceLink },
                { provide: DeleteBarberServiceLinkUseCase, useValue: uc.deleteBarberServiceLink },
                { provide: ListBarberServiceLinksUseCase, useValue: uc.listBarberServiceLinks },
                { provide: CreateWorkingHoursUseCase, useValue: uc.createWorkingHours },
                { provide: BootstrapWorkingWeekUseCase, useValue: uc.bootstrapWorkingWeek },
                { provide: UpdateWorkingHoursUseCase, useValue: uc.updateWorkingHours },
                { provide: DeleteWorkingHoursUseCase, useValue: uc.deleteWorkingHours },
                { provide: ListWorkingHoursUseCase, useValue: uc.listWorkingHours },
                { provide: GetWorkingHoursUseCase, useValue: uc.getWorkingHours },
                { provide: CreateWorkingHoursPeriodUseCase, useValue: uc.createWorkingHoursPeriod },
                { provide: UpdateWorkingHoursPeriodUseCase, useValue: uc.updateWorkingHoursPeriod },
                { provide: DeleteWorkingHoursPeriodUseCase, useValue: uc.deleteWorkingHoursPeriod },
                { provide: CreateTimeOffUseCase, useValue: uc.createTimeOff },
                { provide: UpdateTimeOffUseCase, useValue: uc.updateTimeOff },
                { provide: DeleteTimeOffUseCase, useValue: uc.deleteTimeOff },
                { provide: ListTimeOffsUseCase, useValue: uc.listTimeOffs },
                { provide: CreateBlockUseCase, useValue: uc.createBlock },
                { provide: UpdateBlockUseCase, useValue: uc.updateBlock },
                { provide: DeleteBlockUseCase, useValue: uc.deleteBlock },
                { provide: ListBlocksUseCase, useValue: uc.listBlocks },
                { provide: GetAvailableSlotsUseCase, useValue: uc.getAvailableSlots },
            ],
        })
            .overrideGuard(BearerAuthGuard)
            .useValue({
                canActivate: (context: any) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = { dbUser: { id: userId }, uid: 'firebase-uid' };
                    req.tenantMembership = { role };
                    return true;
                },
            })
            .overrideInterceptor(TenantInterceptor)
            .useValue({ intercept: (_ctx: any, next: any) => next.handle() })
            .overrideGuard(TenantMembershipGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(TenantRolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                transform: true,
            }),
        );
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        Object.values(uc).forEach((m) => m.run.mockResolvedValue({ ok: true }));
    });

    it('GET available-slots chama use case com query', () => {
        return request(app.getHttpServer())
            .get(`${base}/available-slots`)
            .query({ serviceId, date: '2026-06-15' })
            .expect(200)
            .expect(() => {
                expect(uc.getAvailableSlots.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    serviceId,
                    '2026-06-15',
                    userId,
                    role,
                );
            });
    });

    it('GET offered-services', () => {
        return request(app.getHttpServer())
            .get(`${base}/offered-services`)
            .expect(200)
            .expect(() => {
                expect(uc.listBarberServiceLinks.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    userId,
                    role,
                );
            });
    });

    it('POST offered-services', () => {
        return request(app.getHttpServer())
            .post(`${base}/offered-services`)
            .send({ serviceId })
            .expect(201)
            .expect(() => {
                expect(uc.createBarberServiceLink.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    { serviceId },
                    userId,
                    role,
                );
            });
    });

    it('PATCH offered-services/:linkId', () => {
        return request(app.getHttpServer())
            .patch(`${base}/offered-services/link-1`)
            .send({ isActive: false })
            .expect(200)
            .expect(() => {
                expect(uc.updateBarberServiceLink.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    'link-1',
                    { isActive: false },
                    userId,
                    role,
                );
            });
    });

    it('DELETE offered-services/:linkId', () => {
        return request(app.getHttpServer())
            .delete(`${base}/offered-services/link-1`)
            .expect(200)
            .expect(() => {
                expect(uc.deleteBarberServiceLink.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    'link-1',
                    userId,
                    role,
                );
            });
    });

    it('GET working-hours', () => {
        return request(app.getHttpServer())
            .get(`${base}/working-hours`)
            .expect(200)
            .expect(() => {
                expect(uc.listWorkingHours.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    userId,
                    role,
                );
            });
    });

    it('POST working-hours', () => {
        return request(app.getHttpServer())
            .post(`${base}/working-hours`)
            .send({
                dayOfWeek: DayOfWeek.MONDAY,
                isActive: true,
                periods: [{ startTime: '09:00', endTime: '12:00' }],
            })
            .expect(201)
            .expect(() => {
                expect(uc.createWorkingHours.run).toHaveBeenCalled();
            });
    });

    it('POST working-hours/bootstrap-week', () => {
        return request(app.getHttpServer())
            .post(`${base}/working-hours/bootstrap-week`)
            .send({
                closedDays: [DayOfWeek.SUNDAY],
                periods: [{ startTime: '09:00', endTime: '12:00' }],
            })
            .expect(201)
            .expect(() => {
                expect(uc.bootstrapWorkingWeek.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    {
                        closedDays: [DayOfWeek.SUNDAY],
                        periods: [{ startTime: '09:00', endTime: '12:00' }],
                    },
                    userId,
                    role,
                );
            });
    });

    it('GET working-hours/:id', () => {
        return request(app.getHttpServer())
            .get(`${base}/working-hours/wh-1`)
            .expect(200)
            .expect(() => {
                expect(uc.getWorkingHours.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    'wh-1',
                    userId,
                    role,
                );
            });
    });

    it('PATCH working-hours/:id', () => {
        return request(app.getHttpServer())
            .patch(`${base}/working-hours/wh-1`)
            .send({ isActive: false })
            .expect(200)
            .expect(() => {
                expect(uc.updateWorkingHours.run).toHaveBeenCalled();
            });
    });

    it('DELETE working-hours/:id', () => {
        uc.deleteWorkingHours.run.mockResolvedValue(undefined);
        return request(app.getHttpServer())
            .delete(`${base}/working-hours/wh-1`)
            .expect(200)
            .expect(() => {
                expect(uc.deleteWorkingHours.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    'wh-1',
                    userId,
                    role,
                );
            });
    });

    it('POST working-hours/:id/periods', () => {
        return request(app.getHttpServer())
            .post(`${base}/working-hours/wh-1/periods`)
            .send({ startTime: '14:00', endTime: '18:00' })
            .expect(201)
            .expect(() => {
                expect(uc.createWorkingHoursPeriod.run).toHaveBeenCalled();
            });
    });

    it('PATCH working-hours/:id/periods/:periodId', () => {
        return request(app.getHttpServer())
            .patch(`${base}/working-hours/wh-1/periods/p1`)
            .send({ startTime: '15:00' })
            .expect(200)
            .expect(() => {
                expect(uc.updateWorkingHoursPeriod.run).toHaveBeenCalled();
            });
    });

    it('DELETE working-hours/:id/periods/:periodId', () => {
        uc.deleteWorkingHoursPeriod.run.mockResolvedValue(undefined);
        return request(app.getHttpServer())
            .delete(`${base}/working-hours/wh-1/periods/p1`)
            .expect(200)
            .expect(() => {
                expect(uc.deleteWorkingHoursPeriod.run).toHaveBeenCalled();
            });
    });

    it('GET time-offs', () => {
        return request(app.getHttpServer())
            .get(`${base}/time-offs`)
            .expect(200)
            .expect(() => {
                expect(uc.listTimeOffs.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    userId,
                    role,
                );
            });
    });

    it('POST time-offs', () => {
        return request(app.getHttpServer())
            .post(`${base}/time-offs`)
            .send({
                date: '2026-12-25',
                startTime: '09:00',
                endTime: '12:00',
                reason: TimeOffReason.HOLIDAY,
            })
            .expect(201)
            .expect(() => {
                expect(uc.createTimeOff.run).toHaveBeenCalled();
            });
    });

    it('PATCH time-offs/:id', () => {
        return request(app.getHttpServer())
            .patch(`${base}/time-offs/t1`)
            .send({ reason: TimeOffReason.SICK })
            .expect(200)
            .expect(() => {
                expect(uc.updateTimeOff.run).toHaveBeenCalled();
            });
    });

    it('DELETE time-offs/:id', () => {
        return request(app.getHttpServer())
            .delete(`${base}/time-offs/t1`)
            .expect(200)
            .expect(() => {
                expect(uc.deleteTimeOff.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    't1',
                    userId,
                    role,
                );
            });
    });

    it('GET blocks', () => {
        return request(app.getHttpServer())
            .get(`${base}/blocks`)
            .expect(200)
            .expect(() => {
                expect(uc.listBlocks.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    userId,
                    role,
                );
            });
    });

    it('POST blocks', () => {
        return request(app.getHttpServer())
            .post(`${base}/blocks`)
            .send({
                date: '2026-03-21',
                startTime: '12:00',
                endTime: '14:00',
                reason: BlockReason.LUNCH,
            })
            .expect(201)
            .expect(() => {
                expect(uc.createBlock.run).toHaveBeenCalled();
            });
    });

    it('PATCH blocks/:id', () => {
        return request(app.getHttpServer())
            .patch(`${base}/blocks/b1`)
            .send({ startTime: '13:00' })
            .expect(200)
            .expect(() => {
                expect(uc.updateBlock.run).toHaveBeenCalled();
            });
    });

    it('DELETE blocks/:id', () => {
        return request(app.getHttpServer())
            .delete(`${base}/blocks/b1`)
            .expect(200)
            .expect(() => {
                expect(uc.deleteBlock.run).toHaveBeenCalledWith(
                    tenantId,
                    barberProfileId,
                    'b1',
                    userId,
                    role,
                );
            });
    });
});

describe('AvailabilityController (HTTP) — req.user/tenant opcionais', () => {
    let app: INestApplication;
    const tenantId = 'tenant-uuid';
    const barberProfileId = 'bp-uuid';
    const serviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const base = `/tenants/${tenantId}/barber-profiles/${barberProfileId}`;

    const uc = {
        createBarberServiceLink: mockUseCase(),
        updateBarberServiceLink: mockUseCase(),
        deleteBarberServiceLink: mockUseCase(),
        listBarberServiceLinks: mockUseCase(),
        createWorkingHours: mockUseCase(),
        bootstrapWorkingWeek: mockUseCase(),
        updateWorkingHours: mockUseCase(),
        deleteWorkingHours: mockUseCase(),
        listWorkingHours: mockUseCase(),
        getWorkingHours: mockUseCase(),
        createWorkingHoursPeriod: mockUseCase(),
        updateWorkingHoursPeriod: mockUseCase(),
        deleteWorkingHoursPeriod: mockUseCase(),
        createTimeOff: mockUseCase(),
        updateTimeOff: mockUseCase(),
        deleteTimeOff: mockUseCase(),
        listTimeOffs: mockUseCase(),
        createBlock: mockUseCase(),
        updateBlock: mockUseCase(),
        deleteBlock: mockUseCase(),
        listBlocks: mockUseCase(),
        getAvailableSlots: mockUseCase(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [AvailabilityController],
            providers: [
                { provide: CreateBarberServiceLinkUseCase, useValue: uc.createBarberServiceLink },
                { provide: UpdateBarberServiceLinkUseCase, useValue: uc.updateBarberServiceLink },
                { provide: DeleteBarberServiceLinkUseCase, useValue: uc.deleteBarberServiceLink },
                { provide: ListBarberServiceLinksUseCase, useValue: uc.listBarberServiceLinks },
                { provide: CreateWorkingHoursUseCase, useValue: uc.createWorkingHours },
                { provide: BootstrapWorkingWeekUseCase, useValue: uc.bootstrapWorkingWeek },
                { provide: UpdateWorkingHoursUseCase, useValue: uc.updateWorkingHours },
                { provide: DeleteWorkingHoursUseCase, useValue: uc.deleteWorkingHours },
                { provide: ListWorkingHoursUseCase, useValue: uc.listWorkingHours },
                { provide: GetWorkingHoursUseCase, useValue: uc.getWorkingHours },
                { provide: CreateWorkingHoursPeriodUseCase, useValue: uc.createWorkingHoursPeriod },
                { provide: UpdateWorkingHoursPeriodUseCase, useValue: uc.updateWorkingHoursPeriod },
                { provide: DeleteWorkingHoursPeriodUseCase, useValue: uc.deleteWorkingHoursPeriod },
                { provide: CreateTimeOffUseCase, useValue: uc.createTimeOff },
                { provide: UpdateTimeOffUseCase, useValue: uc.updateTimeOff },
                { provide: DeleteTimeOffUseCase, useValue: uc.deleteTimeOff },
                { provide: ListTimeOffsUseCase, useValue: uc.listTimeOffs },
                { provide: CreateBlockUseCase, useValue: uc.createBlock },
                { provide: UpdateBlockUseCase, useValue: uc.updateBlock },
                { provide: DeleteBlockUseCase, useValue: uc.deleteBlock },
                { provide: ListBlocksUseCase, useValue: uc.listBlocks },
                { provide: GetAvailableSlotsUseCase, useValue: uc.getAvailableSlots },
            ],
        })
            .overrideGuard(BearerAuthGuard)
            .useValue({
                canActivate: (context: any) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = {};
                    req.tenantMembership = undefined;
                    return true;
                },
            })
            .overrideInterceptor(TenantInterceptor)
            .useValue({ intercept: (_ctx: any, next: any) => next.handle() })
            .overrideGuard(TenantMembershipGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(TenantRolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                transform: true,
            }),
        );
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        Object.values(uc).forEach((m) => m.run.mockResolvedValue({ ok: true }));
    });

    it('várias rotas passam userId vazio e role undefined', async () => {
        await request(app.getHttpServer())
            .get(`${base}/available-slots`)
            .query({ serviceId, date: '2026-06-15' })
            .expect(200);
        expect(uc.getAvailableSlots.run).toHaveBeenCalledWith(
            tenantId,
            barberProfileId,
            serviceId,
            '2026-06-15',
            '',
            undefined,
        );

        await request(app.getHttpServer()).get(`${base}/offered-services`).expect(200);
        expect(uc.listBarberServiceLinks.run).toHaveBeenCalledWith(
            tenantId,
            barberProfileId,
            '',
            undefined,
        );

        await request(app.getHttpServer()).get(`${base}/working-hours`).expect(200);
        expect(uc.listWorkingHours.run).toHaveBeenCalledWith(
            tenantId,
            barberProfileId,
            '',
            undefined,
        );

        await request(app.getHttpServer()).get(`${base}/working-hours/wh-1`).expect(200);
        expect(uc.getWorkingHours.run).toHaveBeenCalledWith(
            tenantId,
            barberProfileId,
            'wh-1',
            '',
            undefined,
        );

        await request(app.getHttpServer()).get(`${base}/time-offs`).expect(200);
        expect(uc.listTimeOffs.run).toHaveBeenCalledWith(
            tenantId,
            barberProfileId,
            '',
            undefined,
        );

        await request(app.getHttpServer()).get(`${base}/blocks`).expect(200);
        expect(uc.listBlocks.run).toHaveBeenCalledWith(
            tenantId,
            barberProfileId,
            '',
            undefined,
        );

        await request(app.getHttpServer()).post(`${base}/offered-services`).send({ serviceId }).expect(201);
        expect(uc.createBarberServiceLink.run).toHaveBeenCalledWith(
            tenantId,
            barberProfileId,
            { serviceId },
            '',
            undefined,
        );

        await request(app.getHttpServer()).delete(`${base}/offered-services/lx`).expect(200);
        expect(uc.deleteBarberServiceLink.run).toHaveBeenCalledWith(
            tenantId,
            barberProfileId,
            'lx',
            '',
            undefined,
        );

        await request(app.getHttpServer())
            .post(`${base}/time-offs`)
            .send({
                date: '2026-12-25',
                reason: TimeOffReason.DAY_OFF,
            })
            .expect(201);
        expect(uc.createTimeOff.run).toHaveBeenCalled();

        await request(app.getHttpServer()).delete(`${base}/time-offs/t99`).expect(200);
        expect(uc.deleteTimeOff.run).toHaveBeenCalledWith(
            tenantId,
            barberProfileId,
            't99',
            '',
            undefined,
        );
    });
});
