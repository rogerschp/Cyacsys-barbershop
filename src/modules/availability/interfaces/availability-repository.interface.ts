import { ProfessionalServiceLinkEntity } from '../entities/professional-service-link.entity';
import { ProfessionalAvailabilityBlockEntity } from '../entities/professional-availability-block.entity';
import { TimeOffEntity } from '../entities/time-off.entity';
import { WorkingHoursEntity } from '../entities/working-hours.entity';
import { WorkingHoursPeriodEntity } from '../entities/working-hours-period.entity';
import { DayOfWeek } from '../entities/day-of-week.enum';
import { TimeOffReason } from '../entities/time-off-reason.enum';
import { BlockReason } from '../entities/block-reason.enum';

export interface CreateProfessionalServiceLinkData {
  tenantId: string;
  tenantProfessionalId: string;
  serviceId: string;
}

export interface CreateWorkingHoursData {
  tenantId: string;
  tenantProfessionalId: string;
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
  tenantProfessionalId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: TimeOffReason;
}

export interface CreateBlockData {
  tenantId: string;
  tenantProfessionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: BlockReason;
  bookingId?: string | null;
}

export interface IAvailabilityRepository {
  createProfessionalServiceLink(
    data: CreateProfessionalServiceLinkData,
  ): Promise<ProfessionalServiceLinkEntity>;
  findProfessionalServiceLinkById(
    id: string,
    tenantId: string,
  ): Promise<ProfessionalServiceLinkEntity | null>;
  findProfessionalServiceLinkByProfessionalAndService(
    tenantProfessionalId: string,
    tenantId: string,
    serviceId: string,
  ): Promise<ProfessionalServiceLinkEntity | null>;
  listProfessionalServiceLinksByProfessional(
    tenantProfessionalId: string,
    tenantId: string,
  ): Promise<ProfessionalServiceLinkEntity[]>;
  updateProfessionalServiceLink(
    id: string,
    tenantId: string,
    data: { isActive?: boolean },
  ): Promise<ProfessionalServiceLinkEntity>;
  softDeleteProfessionalServiceLink(
    id: string,
    tenantId: string,
  ): Promise<ProfessionalServiceLinkEntity>;
  createWorkingHours(data: CreateWorkingHoursData): Promise<WorkingHoursEntity>;
  findWorkingHoursById(
    id: string,
    tenantId: string,
    withPeriods?: boolean,
  ): Promise<WorkingHoursEntity | null>;
  findWorkingHoursByProfessionalAndDay(
    tenantProfessionalId: string,
    tenantId: string,
    dayOfWeek: DayOfWeek,
    withPeriods?: boolean,
  ): Promise<WorkingHoursEntity | null>;
  listWorkingHoursByProfessional(
    tenantProfessionalId: string,
    tenantId: string,
  ): Promise<WorkingHoursEntity[]>;
  existsOtherWorkingHoursForDay(
    tenantProfessionalId: string,
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
  createTimeOff(data: CreateTimeOffData): Promise<TimeOffEntity>;
  findTimeOffById(id: string, tenantId: string): Promise<TimeOffEntity | null>;
  listTimeOffsOnDate(
    tenantProfessionalId: string,
    tenantId: string,
    dateYmd: string,
  ): Promise<TimeOffEntity[]>;
  listTimeOffsByProfessional(
    tenantProfessionalId: string,
    tenantId: string,
  ): Promise<TimeOffEntity[]>;
  updateTimeOff(
    id: string,
    tenantId: string,
    data: Partial<Pick<TimeOffEntity, 'date' | 'startTime' | 'endTime' | 'reason'>>,
  ): Promise<TimeOffEntity>;
  softDeleteTimeOff(id: string, tenantId: string): Promise<TimeOffEntity>;
  createBlock(data: CreateBlockData): Promise<ProfessionalAvailabilityBlockEntity>;
  findBlockById(
    id: string,
    tenantId: string,
  ): Promise<ProfessionalAvailabilityBlockEntity | null>;
  listBlocksOnDate(
    tenantProfessionalId: string,
    tenantId: string,
    dateYmd: string,
  ): Promise<ProfessionalAvailabilityBlockEntity[]>;
  listBlocksByProfessional(
    tenantProfessionalId: string,
    tenantId: string,
  ): Promise<ProfessionalAvailabilityBlockEntity[]>;
  updateBlock(
    id: string,
    tenantId: string,
    data: Partial<
      Pick<
        ProfessionalAvailabilityBlockEntity,
        'date' | 'startTime' | 'endTime' | 'reason' | 'bookingId'
      >
    >,
  ): Promise<ProfessionalAvailabilityBlockEntity>;
  softDeleteBlock(
    id: string,
    tenantId: string,
  ): Promise<ProfessionalAvailabilityBlockEntity>;
}

export const AVAILABILITY_REPOSITORY = Symbol('AVAILABILITY_REPOSITORY');
