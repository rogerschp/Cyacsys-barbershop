import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BarberAvailabilityBlockEntity } from '../../modules/availability/entities/barber-availability-block.entity';
import { BarberServiceLinkEntity } from '../../modules/availability/entities/barber-service-link.entity';
import { DayOfWeek } from '../../modules/availability/entities/day-of-week.enum';
import { TimeOffEntity } from '../../modules/availability/entities/time-off.entity';
import { WorkingHoursEntity } from '../../modules/availability/entities/working-hours.entity';
import { WorkingHoursPeriodEntity } from '../../modules/availability/entities/working-hours-period.entity';
import { CreateBarberServiceLinkData, CreateBlockData, CreateTimeOffData, CreateWorkingHoursData, CreateWorkingHoursPeriodData, IAvailabilityRepository, } from '../../modules/availability/interfaces/availability-repository.interface';
@Injectable()
export class AvailabilityRepository implements IAvailabilityRepository {
    constructor(
    @InjectRepository(BarberServiceLinkEntity)
    private readonly barberServiceRepo: Repository<BarberServiceLinkEntity>, 
    @InjectRepository(WorkingHoursEntity)
    private readonly workingHoursRepo: Repository<WorkingHoursEntity>, 
    @InjectRepository(WorkingHoursPeriodEntity)
    private readonly periodRepo: Repository<WorkingHoursPeriodEntity>, 
    @InjectRepository(TimeOffEntity)
    private readonly timeOffRepo: Repository<TimeOffEntity>, 
    @InjectRepository(BarberAvailabilityBlockEntity)
    private readonly blockRepo: Repository<BarberAvailabilityBlockEntity>) { }
    async createBarberServiceLink(data: CreateBarberServiceLinkData): Promise<BarberServiceLinkEntity> {
        const e = this.barberServiceRepo.create({
            tenantId: data.tenantId,
            barberProfileId: data.barberProfileId,
            serviceId: data.serviceId,
            isActive: true,
        });
        return this.barberServiceRepo.save(e);
    }
    async findBarberServiceLinkById(id: string, tenantId: string): Promise<BarberServiceLinkEntity | null> {
        return this.barberServiceRepo.findOne({
            where: { id, tenantId },
            withDeleted: false,
        });
    }
    async findBarberServiceLinkByBarberAndService(barberProfileId: string, tenantId: string, serviceId: string): Promise<BarberServiceLinkEntity | null> {
        return this.barberServiceRepo.findOne({
            where: { barberProfileId, tenantId, serviceId },
            withDeleted: false,
        });
    }
    async listBarberServiceLinksByBarber(barberProfileId: string, tenantId: string): Promise<BarberServiceLinkEntity[]> {
        return this.barberServiceRepo.find({
            where: { barberProfileId, tenantId },
            order: { createdAt: 'ASC' },
            withDeleted: false,
        });
    }
    async updateBarberServiceLink(id: string, tenantId: string, data: {
        isActive?: boolean;
    }): Promise<BarberServiceLinkEntity> {
        await this.barberServiceRepo.update({ id, tenantId }, data);
        const e = await this.findBarberServiceLinkById(id, tenantId);
        if (!e)
            throw new Error('Barber service link not found after update');
        return e;
    }
    async softDeleteBarberServiceLink(id: string, tenantId: string): Promise<BarberServiceLinkEntity> {
        const e = await this.findBarberServiceLinkById(id, tenantId);
        if (!e)
            throw new Error('Barber service link not found');
        await this.barberServiceRepo.softDelete({ id, tenantId });
        return e;
    }
    async createWorkingHours(data: CreateWorkingHoursData): Promise<WorkingHoursEntity> {
        const e = this.workingHoursRepo.create({
            tenantId: data.tenantId,
            barberProfileId: data.barberProfileId,
            dayOfWeek: data.dayOfWeek,
            isActive: data.isActive,
        });
        return this.workingHoursRepo.save(e);
    }
    async findWorkingHoursById(id: string, tenantId: string, withPeriods = false): Promise<WorkingHoursEntity | null> {
        const wh = await this.workingHoursRepo.findOne({
            where: { id, tenantId },
            withDeleted: false,
        });
        if (!wh || !withPeriods)
            return wh;
        wh.periods = await this.periodRepo.find({
            where: { workingHoursId: id },
            order: { startTime: 'ASC' },
            withDeleted: false,
        });
        return wh;
    }
    async findWorkingHoursByBarberAndDay(barberProfileId: string, tenantId: string, dayOfWeek: DayOfWeek, withPeriods = false): Promise<WorkingHoursEntity | null> {
        const wh = await this.workingHoursRepo.findOne({
            where: { barberProfileId, tenantId, dayOfWeek },
            withDeleted: false,
        });
        if (!wh || !withPeriods)
            return wh;
        wh.periods = await this.periodRepo.find({
            where: { workingHoursId: wh.id },
            order: { startTime: 'ASC' },
            withDeleted: false,
        });
        return wh;
    }
    async listWorkingHoursByBarber(barberProfileId: string, tenantId: string): Promise<WorkingHoursEntity[]> {
        const list = await this.workingHoursRepo.find({
            where: { barberProfileId, tenantId },
            order: { dayOfWeek: 'ASC' },
            withDeleted: false,
        });
        for (const wh of list) {
            wh.periods = await this.periodRepo.find({
                where: { workingHoursId: wh.id },
                order: { startTime: 'ASC' },
                withDeleted: false,
            });
        }
        return list;
    }
    async existsOtherWorkingHoursForDay(barberProfileId: string, tenantId: string, dayOfWeek: DayOfWeek, excludeWorkingHoursId?: string): Promise<boolean> {
        const qb = this.workingHoursRepo
            .createQueryBuilder('wh')
            .where('wh.barberProfileId = :barberProfileId', { barberProfileId })
            .andWhere('wh.tenantId = :tenantId', { tenantId })
            .andWhere('wh.dayOfWeek = :dayOfWeek', { dayOfWeek })
            .andWhere('wh.deletedAt IS NULL');
        if (excludeWorkingHoursId) {
            qb.andWhere('wh.id != :excludeWorkingHoursId', {
                excludeWorkingHoursId,
            });
        }
        return qb.getExists();
    }
    async updateWorkingHours(id: string, tenantId: string, data: {
        dayOfWeek?: DayOfWeek;
        isActive?: boolean;
    }): Promise<WorkingHoursEntity> {
        await this.workingHoursRepo.update({ id, tenantId }, data);
        const e = await this.findWorkingHoursById(id, tenantId, false);
        if (!e)
            throw new Error('Working hours not found after update');
        return e;
    }
    async softDeleteWorkingHours(id: string, tenantId: string): Promise<void> {
        const wh = await this.findWorkingHoursById(id, tenantId, false);
        if (!wh)
            throw new Error('Working hours not found');
        await this.periodRepo.softDelete({ workingHoursId: id });
        await this.workingHoursRepo.softDelete({ id, tenantId });
    }
    async createWorkingHoursPeriod(data: CreateWorkingHoursPeriodData): Promise<WorkingHoursPeriodEntity> {
        const e = this.periodRepo.create({
            workingHoursId: data.workingHoursId,
            startTime: data.startTime,
            endTime: data.endTime,
        });
        return this.periodRepo.save(e);
    }
    async findWorkingHoursPeriodById(id: string, tenantId: string): Promise<WorkingHoursPeriodEntity | null> {
        return this.periodRepo
            .createQueryBuilder('p')
            .innerJoin('p.workingHours', 'wh')
            .where('p.id = :id', { id })
            .andWhere('wh.tenantId = :tenantId', { tenantId })
            .andWhere('p.deletedAt IS NULL')
            .getOne();
    }
    async listPeriodsByWorkingHoursId(workingHoursId: string, tenantId: string): Promise<WorkingHoursPeriodEntity[]> {
        return this.periodRepo
            .createQueryBuilder('p')
            .innerJoin('p.workingHours', 'wh')
            .where('p.workingHoursId = :workingHoursId', { workingHoursId })
            .andWhere('wh.tenantId = :tenantId', { tenantId })
            .andWhere('p.deletedAt IS NULL')
            .orderBy('p.startTime', 'ASC')
            .getMany();
    }
    async countActivePeriodsByWorkingHoursId(workingHoursId: string): Promise<number> {
        return this.periodRepo.count({
            where: { workingHoursId },
            withDeleted: false,
        });
    }
    async updateWorkingHoursPeriod(id: string, tenantId: string, data: {
        startTime?: string;
        endTime?: string;
    }): Promise<WorkingHoursPeriodEntity> {
        const existing = await this.findWorkingHoursPeriodById(id, tenantId);
        if (!existing)
            throw new Error('Period not found');
        await this.periodRepo.update({ id }, data);
        const updated = await this.findWorkingHoursPeriodById(id, tenantId);
        if (!updated)
            throw new Error('Period not found after update');
        return updated;
    }
    async softDeleteWorkingHoursPeriod(id: string, tenantId: string): Promise<void> {
        const existing = await this.findWorkingHoursPeriodById(id, tenantId);
        if (!existing)
            throw new Error('Period not found');
        await this.periodRepo.softDelete({ id });
    }
    async createTimeOff(data: CreateTimeOffData): Promise<TimeOffEntity> {
        const e = this.timeOffRepo.create({
            tenantId: data.tenantId,
            barberProfileId: data.barberProfileId,
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            reason: data.reason,
        });
        return this.timeOffRepo.save(e);
    }
    async findTimeOffById(id: string, tenantId: string): Promise<TimeOffEntity | null> {
        return this.timeOffRepo.findOne({
            where: { id, tenantId },
            withDeleted: false,
        });
    }
    async listTimeOffsOnDate(barberProfileId: string, tenantId: string, dateYmd: string): Promise<TimeOffEntity[]> {
        return this.timeOffRepo.find({
            where: { barberProfileId, tenantId, date: dateYmd },
            withDeleted: false,
        });
    }
    async listTimeOffsByBarber(barberProfileId: string, tenantId: string): Promise<TimeOffEntity[]> {
        return this.timeOffRepo.find({
            where: { barberProfileId, tenantId },
            order: { date: 'ASC' },
            withDeleted: false,
        });
    }
    async updateTimeOff(id: string, tenantId: string, data: Partial<Pick<TimeOffEntity, 'date' | 'startTime' | 'endTime' | 'reason'>>): Promise<TimeOffEntity> {
        await this.timeOffRepo.update({ id, tenantId }, data);
        const e = await this.findTimeOffById(id, tenantId);
        if (!e)
            throw new Error('Time off not found after update');
        return e;
    }
    async softDeleteTimeOff(id: string, tenantId: string): Promise<TimeOffEntity> {
        const e = await this.findTimeOffById(id, tenantId);
        if (!e)
            throw new Error('Time off not found');
        await this.timeOffRepo.softDelete({ id, tenantId });
        return e;
    }
    async createBlock(data: CreateBlockData): Promise<BarberAvailabilityBlockEntity> {
        const e = this.blockRepo.create({
            tenantId: data.tenantId,
            barberProfileId: data.barberProfileId,
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            reason: data.reason,
            bookingId: data.bookingId ?? null,
        });
        return this.blockRepo.save(e);
    }
    async findBlockById(id: string, tenantId: string): Promise<BarberAvailabilityBlockEntity | null> {
        return this.blockRepo.findOne({
            where: { id, tenantId },
            withDeleted: false,
        });
    }
    async listBlocksOnDate(barberProfileId: string, tenantId: string, dateYmd: string): Promise<BarberAvailabilityBlockEntity[]> {
        return this.blockRepo.find({
            where: { barberProfileId, tenantId, date: dateYmd },
            withDeleted: false,
        });
    }
    async listBlocksByBarber(barberProfileId: string, tenantId: string): Promise<BarberAvailabilityBlockEntity[]> {
        return this.blockRepo.find({
            where: { barberProfileId, tenantId },
            order: { date: 'ASC', startTime: 'ASC' },
            withDeleted: false,
        });
    }
    async updateBlock(id: string, tenantId: string, data: Partial<Pick<BarberAvailabilityBlockEntity, 'date' | 'startTime' | 'endTime' | 'reason' | 'bookingId'>>): Promise<BarberAvailabilityBlockEntity> {
        await this.blockRepo.update({ id, tenantId }, data);
        const e = await this.findBlockById(id, tenantId);
        if (!e)
            throw new Error('Block not found after update');
        return e;
    }
    async softDeleteBlock(id: string, tenantId: string): Promise<BarberAvailabilityBlockEntity> {
        const e = await this.findBlockById(id, tenantId);
        if (!e)
            throw new Error('Block not found');
        await this.blockRepo.softDelete({ id, tenantId });
        return e;
    }
}
