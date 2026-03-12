import { Injectable, NotFoundException } from '@nestjs/common';
import { getDb, schema } from '../../db';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RunsService {
  async createRun(dto: any): Promise<any> {
    const db = getDb();
    const id = uuid();
    const now = new Date();
    const branchName = dto.branchName || `run/${dto.workItemId?.substring(0, 8) || uuid().slice(0, 8)}-${Date.now()}`;

    await db.insert(schema.runs).values({
      id,
      workItemId: dto.workItemId,
      hostedFolderId: dto.hostedFolderId,
      machineId: dto.machineId || null,
      agent: dto.agent || 'claude',
      model: dto.model || 'sonnet',
      runMode: dto.runMode || 'auto',
      currentPhase: 'queued',
      status: 'queued',
      branchName,
      worktreePath: null,
      summary: null,
      stopState: 'none',
      createdAt: now,
      startedAt: null,
      endedAt: null,
    });

    console.log('Run created:', id);
    return this.getRunById(id);
  }

  async getRunById(id: string): Promise<any> {
    const db = getDb();
    const result = await db.query.runs.findFirst({
      where: eq(schema.runs.id, id),
    });

    if (!result) return null;

    return this.mapRun(result);
  }

  async getAllRuns(limit = 100): Promise<any[]> {
    const db = getDb();
    const results = await db.query.runs.findMany({
      orderBy: [desc(schema.runs.createdAt)],
      limit,
    });

    return results.map(this.mapRun);
  }

  async getActiveRuns(): Promise<any[]> {
    const db = getDb();
    const terminalStatuses = ['completed', 'failed', 'stopped', 'force_stopped', 'timed_out', 'abandoned'];
    
    const results = await db.query.runs.findMany({
      orderBy: [desc(schema.runs.createdAt)],
    });

    return results
      .map(this.mapRun)
      .filter(run => !terminalStatuses.includes(run.status));
  }

  async updateRun(id: string, dto: any): Promise<any> {
    const db = getDb();
    const existing = await this.getRunById(id);
    
    if (!existing) {
      throw new NotFoundException(`Run ${id} not found`);
    }

    const updateData: any = { ...dto, updatedAt: new Date() };

    await db.update(schema.runs)
      .set(updateData)
      .where(eq(schema.runs.id, id));

    return this.getRunById(id);
  }

  async claimRun(id: string, machineId: string): Promise<any> {
    const db = getDb();
    const existing = await this.getRunById(id);
    
    if (!existing) {
      throw new NotFoundException(`Run ${id} not found`);
    }
    
    if (existing.status !== 'queued') {
      throw new Error(`Run ${id} is not queued (status: ${existing.status})`);
    }
    
    if (existing.machineId) {
      throw new Error(`Run ${id} already claimed by ${existing.machineId}`);
    }
    
    await db.update(schema.runs)
      .set({ 
        machineId,
        status: 'assigned',
        updatedAt: new Date(),
      })
      .where(eq(schema.runs.id, id));
    
    return this.getRunById(id);
  }

  async requestStop(id: string, force = false): Promise<any> {
    return this.updateRun(id, { 
      stopState: force ? 'force_stop_requested' : 'stop_requested' 
    });
  }

  async addEvent(runId: string, eventType: string, payload: any, humanSummary?: string): Promise<any> {
    const db = getDb();
    const id = uuid();

    const lastEvent = await db.query.runEvents.findFirst({
      where: eq(schema.runEvents.runId, runId),
      orderBy: [desc(schema.runEvents.sequenceNumber)],
    });

    const sequenceNumber = (lastEvent?.sequenceNumber ?? 0) + 1;

    await db.insert(schema.runEvents).values({
      id,
      runId,
      sequenceNumber,
      eventType,
      timestamp: new Date(),
      payload: JSON.stringify(payload),
      humanSummary: humanSummary || null,
    });

    return { id, runId, sequenceNumber, eventType, payload, humanSummary };
  }

  async getRunEvents(runId: string): Promise<any[]> {
    const db = getDb();
    const results = await db.query.runEvents.findMany({
      where: eq(schema.runEvents.runId, runId),
      orderBy: [schema.runEvents.sequenceNumber],
    });

    return results.map((row: any) => ({
      id: row.id,
      runId: row.runId,
      sequenceNumber: row.sequenceNumber,
      eventType: row.eventType,
      timestamp: new Date(row.timestamp),
      payload: JSON.parse(row.payload || '{}'),
      humanSummary: row.humanSummary,
    }));
  }

  async getRecentEvents(limit = 50): Promise<any[]> {
    const db = getDb();
    const results = await db.query.runEvents.findMany({
      orderBy: [desc(schema.runEvents.timestamp)],
      limit,
    });

    return results.map((row: any) => ({
      id: row.id,
      runId: row.runId,
      sequenceNumber: row.sequenceNumber,
      eventType: row.eventType,
      timestamp: new Date(row.timestamp),
      payload: JSON.parse(row.payload || '{}'),
      humanSummary: row.humanSummary,
    }));
  }

  private mapRun(row: any) {
    return {
      id: row.id,
      workItemId: row.workItemId,
      hostedFolderId: row.hostedFolderId,
      machineId: row.machineId,
      agent: row.agent,
      model: row.model,
      runMode: row.runMode,
      currentPhase: row.currentPhase,
      status: row.status,
      branchName: row.branchName,
      worktreePath: row.worktreePath,
      summary: row.summary,
      stopState: row.stopState,
      createdAt: new Date(row.createdAt),
      startedAt: row.startedAt ? new Date(row.startedAt) : null,
      endedAt: row.endedAt ? new Date(row.endedAt) : null,
    };
  }
}
