import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlanResponseDto } from '../dto/plan-response.dto';
import { GetPlansUseCase } from '../use-cases/get-plans.use-case';

@ApiTags('plans')
@Controller('plans')
export class PlanController {
  constructor(private readonly getPlansUseCase: GetPlansUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Lista planos ativos com features' })
  @ApiResponse({
    status: 200,
    description: 'Lista de planos',
    type: [PlanResponseDto],
  })
  async list() {
    return this.getPlansUseCase.run();
  }
}
