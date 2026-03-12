import { Injectable, NotFoundException } from '@nestjs/common';
import { getDb, schema } from '../../db';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { Machine } from '../../common/types';

@Injectable()
export class MachinesService {
  async registerMachine(payload: any): Promise<Machine> {
    const db = getDb();
    const id = uuid();
    const now = new Date();

    await db.insert(schema.machines).values({
      id,
      name: payload.name,
      os: payload.os,
      hostname: payload.hostname,
      status: 'online',
      lastHeartbeat: now,
      runnerVersion: payload.runnerVersion,
      supportedAgents: JSON.stringify(payload.supportedAgents || []),
      browserMcpEnabled: Boolean(payload.browserMcpEnabled),
      androidMcpEnabled: Boolean(payload.androidMcpEnabled),
      maxConcurrentRuns: payload.maxConcurrentRuns || 1,
      capabilities: JSON.stringify({}),
      createdAt: now,
      updatedAt: now,
    });

    console.log('Machine registered:', id);
    return this.getMachineById(id)!;
  }

  async heartbeat(machineId: string): Promise<Machine> {
    const db = getDb();
    const machine = await this.getMachineById(machineId);
    
    if (!machine) {
      throw new NotFoundException(`Machine ${machineId} not found`);
    }

    const now = new Date();
    await db.update(schema.machines)
      .set({ status: 'online', lastHeartbeat: now, updatedAt: now })
      .where(eq(schema.machines.id, machineId));

    return this.getMachineById(machineId)!;
  }

  async getMachineById(id: string): Promise<Machine | null> {
    const db = getDb();
    const result = await db.query.machines.findFirst({
      where: eq(schema.machines.id, id),
    });

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      os: result.os,
      hostname: result.hostname,
      status: result.status,
      lastHeartbeat: new Date(result.lastHeartbeat),
      runnerVersion: result.runnerVersion,
      supportedAgents: JSON.parse(result.supportedAgents || '[]'),
      browserMcpEnabled: Boolean(result.browserMcpEnabled),
      androidMcpEnabled: Boolean(result.androidMcpEnabled),
      maxConcurrentRuns: result.maxConcurrentRuns,
      capabilities: JSON.parse(result.capabilities || '{}'),
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
    };
  }

  async getAllMachines(): Promise<Machine[]> {
    const db = getDb();
    const results = await db.query.machines.findMany({
      orderBy: (machines) => [machines.createdAt],
    });

    return results.map((row: any) => ({
      id: row.id,
      name: row.name,
      os: row.os,
      hostname: row.hostname,
      status: row.status,
      lastHeartbeat: new Date(row.lastHeartbeat),
      runnerVersion: row.runnerVersion,
      supportedAgents: JSON.parse(row.supportedAgents || '[]'),
      browserMcpEnabled: Boolean(row.browserMcpEnabled),
      androidMcpEnabled: Boolean(row.androidMcpEnabled),
      maxConcurrentRuns: row.maxConcurrentRuns,
      capabilities: JSON.parse(row.capabilities || '{}'),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async getOnlineMachines(): Promise<Machine[]> {
    const machines = await this.getAllMachines();
    return machines.filter(m => m.status === 'online');
  }

  async updateMachineStatus(machineId: string, status: string): Promise<void> {
    const db = getDb();
    await db.update(schema.machines)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(schema.machines.id, machineId));
  }

  async deleteMachine(id: string): Promise<void> {
    const db = getDb();
    await db.delete(schema.machines).where(eq(schema.machines.id, id));
  }
}
