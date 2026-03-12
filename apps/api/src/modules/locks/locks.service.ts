import { Injectable } from '@nestjs/common';
import { getDb, schema } from '../../db';
import { eq, and, lt } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

const LOCK_TTL_MS = 5 * 60 * 1000;
const HEARTBEAT_TTL_MS = 30 * 1000;

@Injectable()
export class LocksService {
  async acquireLock(key: string, lockType: string, ownerRunId: string, ttlMs = LOCK_TTL_MS): Promise<boolean> {
    const db = getDb();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);
    const heartbeatAt = new Date(now.getTime() + HEARTBEAT_TTL_MS);

    const existing = await this.getLock(key);

    if (existing) {
      if (existing.ownerRunId === ownerRunId) {
        await this.renewHeartbeat(key);
        return true;
      }

      if (new Date(existing.leaseExpiresAt) > now) {
        return false;
      }

      await this.forceRelease(key);
    }

    await db.insert(schema.locks).values({
      key,
      lockType,
      ownerRunId,
      leaseExpiresAt: expiresAt,
      heartbeatAt,
      status: 'active',
    });

    console.log('Lock acquired:', key, lockType, ownerRunId);
    return true;
  }

  async releaseLock(key: string, ownerRunId: string): Promise<boolean> {
    const db = getDb();
    const existing = await this.getLock(key);

    if (!existing) {
      return true;
    }

    if (existing.ownerRunId !== ownerRunId) {
      throw new Error(`Lock ${key} owned by different run`);
    }

    await db.update(schema.locks)
      .set({ status: 'released' })
      .where(eq(schema.locks.key, key));

    await db.delete(schema.locks)
      .where(and(
        eq(schema.locks.key, key),
        eq(schema.locks.status, 'released')
      ));

    console.log('Lock released:', key, ownerRunId);
    return true;
  }

  async forceRelease(key: string): Promise<void> {
    const db = getDb();
    await db.delete(schema.locks).where(eq(schema.locks.key, key));
    console.log('Lock force released:', key);
  }

  async renewHeartbeat(key: string): Promise<boolean> {
    const db = getDb();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);
    const heartbeatAt = new Date(now.getTime() + HEARTBEAT_TTL_MS);

    const result = await db.update(schema.locks)
      .set({ leaseExpiresAt: expiresAt, heartbeatAt })
      .where(and(
        eq(schema.locks.key, key),
        eq(schema.locks.status, 'active')
      ));

    return result.changes > 0;
  }

  async getLock(key: string): Promise<any | null> {
    const db = getDb();
    const result = await db.query.locks.findFirst({
      where: eq(schema.locks.key, key),
    });

    if (!result) return null;

    return {
      key: result.key,
      lockType: result.lockType,
      ownerRunId: result.ownerRunId,
      leaseExpiresAt: new Date(result.leaseExpiresAt),
      heartbeatAt: new Date(result.heartbeatAt),
      status: result.status,
    };
  }

  async getAllLocks(): Promise<any[]> {
    const db = getDb();
    const results = await db.query.locks.findMany({
      where: eq(schema.locks.status, 'active'),
    });

    return results.map((row: any) => ({
      key: row.key,
      lockType: row.lockType,
      ownerRunId: row.ownerRunId,
      leaseExpiresAt: new Date(row.leaseExpiresAt),
      heartbeatAt: new Date(row.heartbeatAt),
      status: row.status,
    }));
  }

  async cleanupStaleLocks(): Promise<number> {
    const db = getDb();
    const now = new Date();

    const result = await db.delete(schema.locks)
      .where(and(
        eq(schema.locks.status, 'active'),
        lt(schema.locks.leaseExpiresAt, now)
      ));

    const count = result.changes;
    if (count > 0) {
      console.log('Cleaned up stale locks:', count);
    }

    return count;
  }
}
