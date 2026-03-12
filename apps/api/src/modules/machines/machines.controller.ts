import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { z } from 'zod';

const registerMachineSchema = z.object({
  name: z.string().min(1),
  os: z.enum(['darwin', 'linux', 'windows']),
  hostname: z.string().min(1),
  runnerVersion: z.string().min(1),
  supportedAgents: z.array(z.string()).default([]),
  browserMcpEnabled: z.boolean().default(false),
  androidMcpEnabled: z.boolean().default(false),
  maxConcurrentRuns: z.number().min(1).default(1),
});

@Controller('api/machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerMachine(@Body() body: unknown) {
    const payload = registerMachineSchema.parse(body);
    return this.machinesService.registerMachine(payload);
  }

  @Post('heartbeat')
  async heartbeat(@Body() body: { machineId: string }) {
    return this.machinesService.heartbeat(body.machineId);
  }

  @Get()
  async getAllMachines() {
    return this.machinesService.getAllMachines();
  }

  @Get('online')
  async getOnlineMachines() {
    return this.machinesService.getOnlineMachines();
  }

  @Get(':id')
  async getMachine(@Param('id') id: string) {
    const machine = await this.machinesService.getMachineById(id);
    if (!machine) {
      return { error: 'Machine not found' };
    }
    return machine;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMachine(@Param('id') id: string) {
    await this.machinesService.deleteMachine(id);
  }
}
