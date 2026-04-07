import { BarberServiceLinkEntity } from '../entities/barber-service-link.entity';
import { BarberAvailabilityBlockEntity } from '../entities/barber-availability-block.entity';
import { TimeOffEntity } from '../entities/time-off.entity';
import { WorkingHoursEntity } from '../entities/working-hours.entity';
import { WorkingHoursPeriodEntity } from '../entities/working-hours-period.entity';
import { DayOfWeek } from '../entities/day-of-week.enum';
import { TimeOffReason } from '../entities/time-off-reason.enum';
import { BlockReason } from '../entities/block-reason.enum';

export interface CreateBarberServiceLinkData {
  tenantId: string;
  barberProfileId: string;
  serviceId: string;
}

export interface CreateWorkingHoursData {
  tenantId: string;
  barberProfileId: string;
  dayOfWeek: DayOfWeek;
  isActive: boolean;
}

export interface CreateWorkingHoursPeriodData {
  workingHoursId: string;
  startTime: string;
  endTime: string;
}

export interface CreateTimeOffData {
  tenantId: string;
  barberProfileId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: TimeOffReason;
}

export interface CreateBlockData {
  tenantId: string;
  barberProfileId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: BlockReason;
  bookingId?: string | null;
}

export interface IAvailabilityRepository {
  // --- Barber service link ---
  createBarberServiceLink(
    data: CreateBarberServiceLinkData,
  ): Promise<BarberServiceLinkEntity>;
  findBarberServiceLinkById(
    id: string,
    tenantId: string,
  ): Promise<BarberServiceLinkEntity | null>;
  findBarberServiceLinkByBarberAndService(
    barberProfileId: string,
    tenantId: string,
    serviceId: string,
  ): Promise<BarberServiceLinkEntity | null>;
  listBarberServiceLinksByBarber(
    barberProfileId: string,
    tenantId: string,
  ): Promise<BarberServiceLinkEntity[]>;
  updateBarberServiceLink(
    id: string,
    tenantId: string,
    data: { isActive?: boolean },
  ): Promise<BarberServiceLinkEntity>;
  softDeleteBarberServiceLink(
    id: string,
    tenantId: string,
  ): Promise<BarberServiceLinkEntity>;

  // --- Working hours ---
  createWorkingHours(data: CreateWorkingHoursData): Promise<WorkingHoursEntity>;
  findWorkingHoursById(
    id: string,
    tenantId: string,
    withPeriods?: boolean,
  ): Promise<WorkingHoursEntity | null>;
  findWorkingHoursByBarberAndDay(
    barberProfileId: string,
    tenantId: string,
    dayOfWeek: DayOfWeek,
    withPeriods?: boolean,
  ): Promise<WorkingHoursEntity | null>;
  listWorkingHoursByBarber(
    barberProfileId: string,
    tenantId: string,
  ): Promise<WorkingHoursEntity[]>;
  existsOtherWorkingHoursForDay(
    barberProfileId: string,
    tenantId: string,
    dayOfWeek: DayOfWeek,
    excludeWorkingHoursId?: string,
  ): Promise<boolean>;
  updateWorkingHours(
    id: string,
    tenantId: string,
    data: { dayOfWeek?: DayOfWeek; isActive?: boolean },
  ): Promise<WorkingHoursEntity>;
  softDeleteWorkingHours(id: string, tenantId: string): Promise<void>;

  // --- Periods ---
  createWorkingHoursPeriod(
    data: CreateWorkingHoursPeriodData,
  ): Promise<WorkingHoursPeriodEntity>;
  findWorkingHoursPeriodById(
    id: string,
    tenantId: string,
  ): Promise<WorkingHoursPeriodEntity | null>;
  listPeriodsByWorkingHoursId(
    workingHoursId: string,
    tenantId: string,
  ): Promise<WorkingHoursPeriodEntity[]>;
  countActivePeriodsByWorkingHoursId(workingHoursId: string): Promise<number>;
  updateWorkingHoursPeriod(
    id: string,
    tenantId: string,
    data: { startTime?: string; endTime?: string },
  ): Promise<WorkingHoursPeriodEntity>;
  softDeleteWorkingHoursPeriod(id: string, tenantId: string): Promise<void>;

  // --- Time off ---
  createTimeOff(data: CreateTimeOffData): Promise<TimeOffEntity>;
  findTimeOffById(id: string, tenantId: string): Promise<TimeOffEntity | null>;
  listTimeOffsOnDate(
    barberProfileId: string,
    tenantId: string,
    dateYmd: string,
  ): Promise<TimeOffEntity[]>;
  listTimeOffsByBarber(
    barberProfileId: string,
    tenantId: string,
  ): Promise<TimeOffEntity[]>;
  updateTimeOff(
    id: string,
    tenantId: string,
    data: Partial<
      Pick<TimeOffEntity, 'date' | 'startTime' | 'endTime' | 'reason'>
    >,
  ): Promise<TimeOffEntity>;
  softDeleteTimeOff(id: string, tenantId: string): Promise<TimeOffEntity>;

  // --- Blocks ---
  createBlock(data: CreateBlockData): Promise<BarberAvailabilityBlockEntity>;
  findBlockById(
    id: string,
    tenantId: string,
  ): Promise<BarberAvailabilityBlockEntity | null>;
  listBlocksOnDate(
    barberProfileId: string,
    tenantId: string,
    dateYmd: string,
  ): Promise<BarberAvailabilityBlockEntity[]>;
  listBlocksByBarber(
    barberProfileId: string,
    tenantId: string,
  ): Promise<BarberAvailabilityBlockEntity[]>;
  updateBlock(
    id: string,
    tenantId: string,
    data: Partial<
      Pick<
        BarberAvailabilityBlockEntity,
        'date' | 'startTime' | 'endTime' | 'reason' | 'bookingId'
      >
    >,
  ): Promise<BarberAvailabilityBlockEntity>;
  softDeleteBlock(
    id: string,
    tenantId: string,
  ): Promise<BarberAvailabilityBlockEntity>;
}

export const AVAILABILITY_REPOSITORY = Symbol('AVAILABILITY_REPOSITORY');
