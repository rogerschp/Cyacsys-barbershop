import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  //UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantRoles } from '../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../common/guards/tenant-roles.guard';
//import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { TenantUserRole } from '../tenant-user/entities/tenant-user-role.enum';
import { AvailableSlotsResponseDto } from './dto/available-slots-response.dto';
import { BootstrapWorkingWeekDto } from './dto/bootstrap-working-week.dto';
import { BootstrapWorkingWeekResponseDto } from './dto/bootstrap-working-week-response.dto';
import { CreateBarberServiceLinkDto } from './dto/create-barber-service-link.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { CreateTimeOffDto } from './dto/create-time-off.dto';
import { CreateWorkingHoursDto } from './dto/create-working-hours.dto';
import { CreateWorkingHoursPeriodDto } from './dto/create-working-hours-period.dto';
import { GetAvailableSlotsQueryDto } from './dto/get-available-slots-query.dto';
import { UpdateBarberServiceLinkDto } from './dto/update-barber-service-link.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { UpdateTimeOffDto } from './dto/update-time-off.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { UpdateWorkingHoursPeriodDto } from './dto/update-working-hours-period.dto';
import { CreateBarberServiceLinkUseCase } from './use-cases/create-barber-service-link.use-case';
import { BootstrapWorkingWeekUseCase } from './use-cases/bootstrap-working-week.use-case';
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
import { TenantResolverGuard } from '../../common/guards/tenant-resolver.guard';
interface RequestWithUserAndMembership {
  user?: {
    dbUser?: {
      id: string;
    };
  };
  tenantMembership?: {
    role: string;
  };
}
const AGENDA_ROLES = [
  TenantUserRole.OWNER,
  TenantUserRole.ADMIN,
  TenantUserRole.STAFF,
  TenantUserRole.BARBER,
] as const;
@ApiTags('availability')
@Controller('tenants/:tenantId/barber-profiles/:barberProfileId')
@UseGuards(
  BearerAuthGuard,
  TenantResolverGuard,
  TenantMembershipGuard,
  TenantRolesGuard,
)
@ApiBearerAuth('bearer')
export class AvailabilityController {
  constructor(
    private readonly createBarberServiceLinkUseCase: CreateBarberServiceLinkUseCase,
    private readonly updateBarberServiceLinkUseCase: UpdateBarberServiceLinkUseCase,
    private readonly deleteBarberServiceLinkUseCase: DeleteBarberServiceLinkUseCase,
    private readonly listBarberServiceLinksUseCase: ListBarberServiceLinksUseCase,
    private readonly createWorkingHoursUseCase: CreateWorkingHoursUseCase,
    private readonly bootstrapWorkingWeekUseCase: BootstrapWorkingWeekUseCase,
    private readonly updateWorkingHoursUseCase: UpdateWorkingHoursUseCase,
    private readonly deleteWorkingHoursUseCase: DeleteWorkingHoursUseCase,
    private readonly listWorkingHoursUseCase: ListWorkingHoursUseCase,
    private readonly getWorkingHoursUseCase: GetWorkingHoursUseCase,
    private readonly createWorkingHoursPeriodUseCase: CreateWorkingHoursPeriodUseCase,
    private readonly updateWorkingHoursPeriodUseCase: UpdateWorkingHoursPeriodUseCase,
    private readonly deleteWorkingHoursPeriodUseCase: DeleteWorkingHoursPeriodUseCase,
    private readonly createTimeOffUseCase: CreateTimeOffUseCase,
    private readonly updateTimeOffUseCase: UpdateTimeOffUseCase,
    private readonly deleteTimeOffUseCase: DeleteTimeOffUseCase,
    private readonly listTimeOffsUseCase: ListTimeOffsUseCase,
    private readonly createBlockUseCase: CreateBlockUseCase,
    private readonly updateBlockUseCase: UpdateBlockUseCase,
    private readonly deleteBlockUseCase: DeleteBlockUseCase,
    private readonly listBlocksUseCase: ListBlocksUseCase,
    private readonly getAvailableSlotsUseCase: GetAvailableSlotsUseCase,
  ) {}
  @Get('available-slots')
  @TenantRoles(...AGENDA_ROLES)
  @ApiOperation({ summary: 'Lista horários disponíveis para agendamento' })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'barberProfileId' })
  @ApiQuery({ name: 'serviceId', type: String })
  @ApiQuery({ name: 'date', example: '2026-03-21' })
  @ApiResponse({ status: 200, type: AvailableSlotsResponseDto })
  async getAvailableSlots(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Query()
    query: GetAvailableSlotsQueryDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    const callerRole = req.tenantMembership?.role;
    return this.getAvailableSlotsUseCase.run(
      tenantId,
      barberProfileId,
      query.serviceId,
      query.date,
      userId,
      callerRole,
    );
  }
  @Get('offered-services')
  @TenantRoles(...AGENDA_ROLES)
  @ApiOperation({ summary: 'Lista serviços oferecidos pelo barbeiro' })
  async listOfferedServices(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.listBarberServiceLinksUseCase.run(
      tenantId,
      barberProfileId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Post('offered-services')
  @TenantRoles(...AGENDA_ROLES)
  @ApiBody({ type: CreateBarberServiceLinkDto })
  async createOfferedService(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Body()
    dto: CreateBarberServiceLinkDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.createBarberServiceLinkUseCase.run(
      tenantId,
      barberProfileId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Patch('offered-services/:linkId')
  @TenantRoles(...AGENDA_ROLES)
  async updateOfferedService(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Param('linkId')
    linkId: string,
    @Body()
    dto: UpdateBarberServiceLinkDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.updateBarberServiceLinkUseCase.run(
      tenantId,
      barberProfileId,
      linkId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Delete('offered-services/:linkId')
  @TenantRoles(...AGENDA_ROLES)
  async deleteOfferedService(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Param('linkId')
    linkId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.deleteBarberServiceLinkUseCase.run(
      tenantId,
      barberProfileId,
      linkId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Get('working-hours')
  @TenantRoles(...AGENDA_ROLES)
  @ApiOperation({ summary: 'Lista jornadas de trabalho (com períodos)' })
  async listWorkingHours(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.listWorkingHoursUseCase.run(
      tenantId,
      barberProfileId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Post('working-hours')
  @TenantRoles(...AGENDA_ROLES)
  @ApiBody({ type: CreateWorkingHoursDto })
  async createWorkingHours(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Body()
    dto: CreateWorkingHoursDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.createWorkingHoursUseCase.run(
      tenantId,
      barberProfileId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Post('working-hours/bootstrap-week')
  @TenantRoles(...AGENDA_ROLES)
  @ApiOperation({
    summary: 'Configura semana padrão do barbeiro',
    description:
      'Configura automaticamente toda a semana. Informe apenas os dias fechados e os períodos padrão dos dias abertos.',
  })
  @ApiBody({ type: BootstrapWorkingWeekDto })
  @ApiResponse({ status: 201, type: BootstrapWorkingWeekResponseDto })
  async bootstrapWorkingWeek(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Body()
    dto: BootstrapWorkingWeekDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.bootstrapWorkingWeekUseCase.run(
      tenantId,
      barberProfileId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Get('working-hours/:workingHoursId')
  @TenantRoles(...AGENDA_ROLES)
  async getWorkingHours(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Param('workingHoursId')
    workingHoursId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.getWorkingHoursUseCase.run(
      tenantId,
      barberProfileId,
      workingHoursId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Patch('working-hours/:workingHoursId')
  @TenantRoles(...AGENDA_ROLES)
  async updateWorkingHours(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Param('workingHoursId')
    workingHoursId: string,
    @Body()
    dto: UpdateWorkingHoursDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.updateWorkingHoursUseCase.run(
      tenantId,
      barberProfileId,
      workingHoursId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Delete('working-hours/:workingHoursId')
  @TenantRoles(...AGENDA_ROLES)
  async deleteWorkingHours(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Param('workingHoursId')
    workingHoursId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    await this.deleteWorkingHoursUseCase.run(
      tenantId,
      barberProfileId,
      workingHoursId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Post('working-hours/:workingHoursId/periods')
  @TenantRoles(...AGENDA_ROLES)
  @ApiBody({ type: CreateWorkingHoursPeriodDto })
  async createPeriod(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Param('workingHoursId')
    workingHoursId: string,
    @Body()
    dto: CreateWorkingHoursPeriodDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.createWorkingHoursPeriodUseCase.run(
      tenantId,
      barberProfileId,
      workingHoursId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Patch('working-hours/:workingHoursId/periods/:periodId')
  @TenantRoles(...AGENDA_ROLES)
  async updatePeriod(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Param('workingHoursId')
    workingHoursId: string,
    @Param('periodId')
    periodId: string,
    @Body()
    dto: UpdateWorkingHoursPeriodDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.updateWorkingHoursPeriodUseCase.run(
      tenantId,
      barberProfileId,
      workingHoursId,
      periodId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Delete('working-hours/:workingHoursId/periods/:periodId')
  @TenantRoles(...AGENDA_ROLES)
  async deletePeriod(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Param('workingHoursId')
    workingHoursId: string,
    @Param('periodId')
    periodId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    await this.deleteWorkingHoursPeriodUseCase.run(
      tenantId,
      barberProfileId,
      workingHoursId,
      periodId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Get('time-offs')
  @TenantRoles(...AGENDA_ROLES)
  async listTimeOffs(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.listTimeOffsUseCase.run(
      tenantId,
      barberProfileId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Post('time-offs')
  @TenantRoles(...AGENDA_ROLES)
  @ApiBody({ type: CreateTimeOffDto })
  async createTimeOff(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Body()
    dto: CreateTimeOffDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.createTimeOffUseCase.run(
      tenantId,
      barberProfileId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Patch('time-offs/:timeOffId')
  @TenantRoles(...AGENDA_ROLES)
  async updateTimeOff(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Param('timeOffId')
    timeOffId: string,
    @Body()
    dto: UpdateTimeOffDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.updateTimeOffUseCase.run(
      tenantId,
      barberProfileId,
      timeOffId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Delete('time-offs/:timeOffId')
  @TenantRoles(...AGENDA_ROLES)
  async deleteTimeOff(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Param('timeOffId')
    timeOffId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.deleteTimeOffUseCase.run(
      tenantId,
      barberProfileId,
      timeOffId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Get('blocks')
  @TenantRoles(...AGENDA_ROLES)
  async listBlocks(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.listBlocksUseCase.run(
      tenantId,
      barberProfileId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Post('blocks')
  @TenantRoles(...AGENDA_ROLES)
  @ApiBody({ type: CreateBlockDto })
  async createBlock(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Body()
    dto: CreateBlockDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.createBlockUseCase.run(
      tenantId,
      barberProfileId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Patch('blocks/:blockId')
  @TenantRoles(...AGENDA_ROLES)
  async updateBlock(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Param('blockId')
    blockId: string,
    @Body()
    dto: UpdateBlockDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.updateBlockUseCase.run(
      tenantId,
      barberProfileId,
      blockId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Delete('blocks/:blockId')
  @TenantRoles(...AGENDA_ROLES)
  async deleteBlock(
    @Param('tenantId')
    tenantId: string,
    @Param('barberProfileId')
    barberProfileId: string,
    @Param('blockId')
    blockId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.deleteBlockUseCase.run(
      tenantId,
      barberProfileId,
      blockId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
}
