import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { LocksService } from './locks.service';

@Controller('api/locks')
export class LocksController {
  constructor(private readonly locksService: LocksService) {}

  @Post('acquire')
  @HttpCode(HttpStatus.OK)
  async acquire(@Body() body: any) {
    const { key, lockType, ownerRunId, ttlMs } = body;
    const acquired = await this.locksService.acquireLock(key, lockType, ownerRunId, ttlMs);
    return { acquired };
  }

  @Post('release')
  @HttpCode(HttpStatus.OK)
  async release(@Body() body: any) {
    const { key, ownerRunId } = body;
    await this.locksService.releaseLock(key, ownerRunId);
    return { released: true };
  }

  @Post('renew')
  @HttpCode(HttpStatus.OK)
  async renew(@Body() body: any) {
    const { key } = body;
    const renewed = await this.locksService.renewHeartbeat(key);
    return { renewed };
  }

  @Get()
  async getAllLocks() {
    return this.locksService.getAllLocks();
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  async cleanup() {
    const count = await this.locksService.cleanupStaleLocks();
    return { cleaned: count };
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forceRelease(@Param('key') key: string) {
    await this.locksService.forceRelease(key);
  }
}
