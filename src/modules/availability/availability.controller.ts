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
import { CreateProfessionalServiceLinkDto } from './dto/create-professional-service-link.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { CreateTimeOffDto } from './dto/create-time-off.dto';
import { CreateWorkingHoursDto } from './dto/create-working-hours.dto';
import { CreateWorkingHoursPeriodDto } from './dto/create-working-hours-period.dto';
import { GetAvailableSlotsQueryDto } from './dto/get-available-slots-query.dto';
import { UpdateProfessionalServiceLinkDto } from './dto/update-professional-service-link.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { UpdateTimeOffDto } from './dto/update-time-off.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { UpdateWorkingHoursPeriodDto } from './dto/update-working-hours-period.dto';
import { CreateProfessionalServiceLinkUseCase } from './use-cases/create-professional-service-link.use-case';
import { BootstrapWorkingWeekUseCase } from './use-cases/bootstrap-working-week.use-case';
import { CreateBlockUseCase } from './use-cases/create-block.use-case';
import { CreateTimeOffUseCase } from './use-cases/create-time-off.use-case';
import { CreateWorkingHoursUseCase } from './use-cases/create-working-hours.use-case';
import { CreateWorkingHoursPeriodUseCase } from './use-cases/create-working-hours-period.use-case';
import { DeleteProfessionalServiceLinkUseCase } from './use-cases/delete-professional-service-link.use-case';
import { DeleteBlockUseCase } from './use-cases/delete-block.use-case';
import { DeleteTimeOffUseCase } from './use-cases/delete-time-off.use-case';
import { DeleteWorkingHoursUseCase } from './use-cases/delete-working-hours.use-case';
import { DeleteWorkingHoursPeriodUseCase } from './use-cases/delete-working-hours-period.use-case';
import { GetAvailableSlotsUseCase } from './use-cases/get-available-slots.use-case';
import { GetWorkingHoursUseCase } from './use-cases/get-working-hours.use-case';
import { ListProfessionalServiceLinksUseCase } from './use-cases/list-professional-service-links.use-case';
import { ListBlocksUseCase } from './use-cases/list-blocks.use-case';
import { ListTimeOffsUseCase } from './use-cases/list-time-offs.use-case';
import { ListWorkingHoursUseCase } from './use-cases/list-working-hours.use-case';
import { UpdateProfessionalServiceLinkUseCase } from './use-cases/update-professional-service-link.use-case';
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
@Controller('tenants/:tenantId/tenant-professionals/:tenantProfessionalId')
@UseGuards(
  BearerAuthGuard,
  TenantResolverGuard,
  TenantMembershipGuard,
  TenantRolesGuard,
)
@ApiBearerAuth('bearer')
export class AvailabilityController {
  constructor(
    private readonly createProfessionalServiceLinkUseCase: CreateProfessionalServiceLinkUseCase,
    private readonly updateProfessionalServiceLinkUseCase: UpdateProfessionalServiceLinkUseCase,
    private readonly deleteProfessionalServiceLinkUseCase: DeleteProfessionalServiceLinkUseCase,
    private readonly listProfessionalServiceLinksUseCase: ListProfessionalServiceLinksUseCase,
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
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiQuery({ name: 'serviceId', type: String })
  @ApiQuery({ name: 'date', example: '2026-03-21' })
  @ApiResponse({ status: 200, type: AvailableSlotsResponseDto })
  async getAvailableSlots(
    @Param('tenantId')
    tenantId: string,
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Query()
    query: GetAvailableSlotsQueryDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    const callerRole = req.tenantMembership?.role;
    return this.getAvailableSlotsUseCase.run(
      tenantId,
      tenantProfessionalId,
      query.serviceId,
      query.date,
      userId,
      callerRole,
    );
  }
  @Get('offered-services')
  @TenantRoles(...AGENDA_ROLES)
  @ApiOperation({ summary: 'Lista serviços oferecidos pelo profissional' })
  async listOfferedServices(
    @Param('tenantId')
    tenantId: string,
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.listProfessionalServiceLinksUseCase.run(
      tenantId,
      tenantProfessionalId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Post('offered-services')
  @TenantRoles(...AGENDA_ROLES)
  @ApiBody({ type: CreateProfessionalServiceLinkDto })
  async createOfferedService(
    @Param('tenantId')
    tenantId: string,
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Body()
    dto: CreateProfessionalServiceLinkDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.createProfessionalServiceLinkUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Param('linkId')
    linkId: string,
    @Body()
    dto: UpdateProfessionalServiceLinkDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.updateProfessionalServiceLinkUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Param('linkId')
    linkId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.deleteProfessionalServiceLinkUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.listWorkingHoursUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Body()
    dto: CreateWorkingHoursDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.createWorkingHoursUseCase.run(
      tenantId,
      tenantProfessionalId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
  @Post('working-hours/bootstrap-week')
  @TenantRoles(...AGENDA_ROLES)
  @ApiOperation({
    summary: 'Configura semana padrão do profissional',
    description:
      'Configura automaticamente toda a semana. Informe apenas os dias fechados e os períodos padrão dos dias abertos.',
  })
  @ApiBody({ type: BootstrapWorkingWeekDto })
  @ApiResponse({ status: 201, type: BootstrapWorkingWeekResponseDto })
  async bootstrapWorkingWeek(
    @Param('tenantId')
    tenantId: string,
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Body()
    dto: BootstrapWorkingWeekDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.bootstrapWorkingWeekUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Param('workingHoursId')
    workingHoursId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.getWorkingHoursUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Param('workingHoursId')
    workingHoursId: string,
    @Body()
    dto: UpdateWorkingHoursDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.updateWorkingHoursUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Param('workingHoursId')
    workingHoursId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    await this.deleteWorkingHoursUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Param('workingHoursId')
    workingHoursId: string,
    @Body()
    dto: CreateWorkingHoursPeriodDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.createWorkingHoursPeriodUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
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
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Param('workingHoursId')
    workingHoursId: string,
    @Param('periodId')
    periodId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    await this.deleteWorkingHoursPeriodUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.listTimeOffsUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Body()
    dto: CreateTimeOffDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.createTimeOffUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Param('timeOffId')
    timeOffId: string,
    @Body()
    dto: UpdateTimeOffDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.updateTimeOffUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Param('timeOffId')
    timeOffId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.deleteTimeOffUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.listBlocksUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Body()
    dto: CreateBlockDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.createBlockUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Param('blockId')
    blockId: string,
    @Body()
    dto: UpdateBlockDto,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.updateBlockUseCase.run(
      tenantId,
      tenantProfessionalId,
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
    @Param('tenantProfessionalId')
    tenantProfessionalId: string,
    @Param('blockId')
    blockId: string,
    @Req()
    req: RequestWithUserAndMembership,
  ) {
    return this.deleteBlockUseCase.run(
      tenantId,
      tenantProfessionalId,
      blockId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
}
