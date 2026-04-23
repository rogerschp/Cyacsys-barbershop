import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityRepository } from '../../repository/availability/availability.repository';
import { AuthModule } from '../auth/auth.module';
import { BarberProfileModule } from '../barber-profile/barber-profile.module';
import { ServiceModule } from '../service/service.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { BarberAvailabilityBlockEntity } from './entities/barber-availability-block.entity';
import { BarberServiceLinkEntity } from './entities/barber-service-link.entity';
import { TimeOffEntity } from './entities/time-off.entity';
import { WorkingHoursEntity } from './entities/working-hours.entity';
import { WorkingHoursPeriodEntity } from './entities/working-hours-period.entity';
import { AVAILABILITY_REPOSITORY } from './interfaces/availability-repository.interface';
import { AvailabilityController } from './availability.controller';
import { BootstrapWorkingWeekUseCase } from './use-cases/bootstrap-working-week.use-case';
import { CreateBarberServiceLinkUseCase } from './use-cases/create-barber-service-link.use-case';
import { CreateBlockUseCase } from './use-cases/create-block.use-case';
import { CreateTimeOffUseCase } from './use-cases/create-time-off.use-case';
import { CreateWorkingHoursUseCase } from './use-cases/create-working-hours.use-case';
import { CreateWorkingHoursPeriodUseCase } from './use-cases/create-working-hours-period.use-case';
import { DeleteBarberServiceLinkUseCase } from './use-cases/delete-barber-service-link.use-case';
import { DeleteBlockUseCase } from './use-cases/delete-block.use-case';
import { DeleteTimeOffUseCase } from './use-cases/delete-time-off.use-case';
import { DeleteWorkingHoursUseCase } from './use-cases/delete-working-hours.use-case';
import { DeleteWorkingHoursPeriodUseCase } from './use-cases/delete-working-hours-period.use-case';
import { GetAvailableSlotsUseCase } from './use-cases/get-available-slots.use-case';
import { GetWorkingHoursUseCase } from './use-cases/get-working-hours.use-case';
import { ListBarberServiceLinksUseCase } from './use-cases/list-barber-service-links.use-case';
import { ListBlocksUseCase } from './use-cases/list-blocks.use-case';
import { ListTimeOffsUseCase } from './use-cases/list-time-offs.use-case';
import { ListWorkingHoursUseCase } from './use-cases/list-working-hours.use-case';
import { UpdateBarberServiceLinkUseCase } from './use-cases/update-barber-service-link.use-case';
import { UpdateBlockUseCase } from './use-cases/update-block.use-case';
import { UpdateTimeOffUseCase } from './use-cases/update-time-off.use-case';
import { UpdateWorkingHoursUseCase } from './use-cases/update-working-hours.use-case';
import { UpdateWorkingHoursPeriodUseCase } from './use-cases/update-working-hours-period.use-case';
@Module({
    imports: [
        TypeOrmModule.forFeature([
            BarberServiceLinkEntity,
            WorkingHoursEntity,
            WorkingHoursPeriodEntity,
            TimeOffEntity,
            BarberAvailabilityBlockEntity,
        ]),
        AuthModule,
        TenantModule,
        TenantUserModule,
        BarberProfileModule,
        ServiceModule,
    ],
    controllers: [AvailabilityController],
    providers: [
        AvailabilityRepository,
        { provide: AVAILABILITY_REPOSITORY, useClass: AvailabilityRepository },
        CreateBarberServiceLinkUseCase,
        BootstrapWorkingWeekUseCase,
        UpdateBarberServiceLinkUseCase,
        DeleteBarberServiceLinkUseCase,
        ListBarberServiceLinksUseCase,
        CreateWorkingHoursUseCase,
        UpdateWorkingHoursUseCase,
        DeleteWorkingHoursUseCase,
        ListWorkingHoursUseCase,
        GetWorkingHoursUseCase,
        CreateWorkingHoursPeriodUseCase,
        UpdateWorkingHoursPeriodUseCase,
        DeleteWorkingHoursPeriodUseCase,
        CreateTimeOffUseCase,
        UpdateTimeOffUseCase,
        DeleteTimeOffUseCase,
        ListTimeOffsUseCase,
        CreateBlockUseCase,
        UpdateBlockUseCase,
        DeleteBlockUseCase,
        ListBlocksUseCase,
        GetAvailableSlotsUseCase,
    ],
    exports: [AVAILABILITY_REPOSITORY, GetAvailableSlotsUseCase],
})
export class AvailabilityModule {
}
