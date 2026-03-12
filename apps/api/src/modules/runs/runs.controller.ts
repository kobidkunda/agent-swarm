import { Controller, Get, Post, Put, Body, Param, HttpCode, HttpStatus, Res, Header } from '@nestjs/common';
import { RunsService } from './runs.service';

@Controller('api/runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRun(@Body() body: any) {
    return this.runsService.createRun(body);
  }

  @Get()
  async getAllRuns() {
    return this.runsService.getAllRuns();
  }

  @Get('active')
  async getActiveRuns() {
    return this.runsService.getActiveRuns();
  }

  @Get(':id')
  async getRun(@Param('id') id: string) {
    const run = await this.runsService.getRunById(id);
    if (!run) {
      return { error: 'Run not found' };
    }
    return run;
  }

  @Put(':id')
  async updateRun(@Param('id') id: string, @Body() body: any) {
    return this.runsService.updateRun(id, body);
  }

  @Post('stop')
  @HttpCode(HttpStatus.OK)
  async stopRun(@Body() body: { runId: string; force?: boolean }) {
    return this.runsService.requestStop(body.runId, body.force ?? false);
  }

  @Get(':id/events')
  async getRunEvents(@Param('id') id: string) {
    return this.runsService.getRunEvents(id);
  }

  @Post(':id/claim')
  @HttpCode(HttpStatus.OK)
  async claimRun(@Param('id') id: string, @Body() body: { machineId: string }) {
    return this.runsService.claimRun(id, body.machineId);
  }

  @Get('events/recent')
  async getRecentEvents() {
    return this.runsService.getRecentEvents();
  }

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  async addEvent(@Body() body: { runId: string; eventType: string; payload: any; humanSummary?: string }) {
    return this.runsService.addEvent(body.runId, body.eventType, body.payload, body.humanSummary);
  }

  @Get('events/stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async streamEvents(@Res() res: any) {
    const raw = res.raw;
    raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const sendEvent = async (eventType: string, data: any) => {
      raw.write(`event: ${eventType}\n`);
      raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    await sendEvent('connected', { timestamp: new Date().toISOString() });

    const interval = setInterval(async () => {
      try {
        const events = await this.runsService.getRecentEvents(10);
        await sendEvent('events', events);
      } catch (e) {
        // Ignore
      }
    }, 2000);

    raw.on('close', () => {
      clearInterval(interval);
    });
  }
}
