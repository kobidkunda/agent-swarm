import { Injectable } from '@nestjs/common';
import { getDb, schema } from '../../db';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FoldersService {
  async createFolder(dto: any): Promise<any> {
    const db = getDb();
    const id = uuid();
    const now = new Date();

    await db.insert(schema.hostedFolders).values({
      id,
      machineId: dto.machineId,
      repoId: dto.repoId,
      displayName: dto.displayName,
      absolutePath: dto.absolutePath,
      branch: dto.branch || 'main',
      enabled: true,
      healthStatus: 'unknown',
      createdAt: now,
      updatedAt: now,
    });

    return this.getFolderById(id);
  }

  async getFolderById(id: string): Promise<any> {
    const db = getDb();
    const result = await db.query.hostedFolders.findFirst({
      where: eq(schema.hostedFolders.id, id),
    });

    if (!result) return null;

    return {
      id: result.id,
      machineId: result.machineId,
      repoId: result.repoId,
      displayName: result.displayName,
      absolutePath: result.absolutePath,
      branch: result.branch,
      enabled: Boolean(result.enabled),
      healthStatus: result.healthStatus,
      lastVerifiedAt: result.lastVerifiedAt ? new Date(result.lastVerifiedAt) : null,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
    };
  }

  async getAllFolders(): Promise<any[]> {
    const db = getDb();
    const results = await db.query.hostedFolders.findMany({
      orderBy: (folders) => [folders.createdAt],
    });

    return results.map((row: any) => ({
      id: row.id,
      machineId: row.machineId,
      repoId: row.repoId,
      displayName: row.displayName,
      absolutePath: row.absolutePath,
      branch: row.branch,
      enabled: Boolean(row.enabled),
      healthStatus: row.healthStatus,
      lastVerifiedAt: row.lastVerifiedAt ? new Date(row.lastVerifiedAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async getEnabledFolders(): Promise<any[]> {
    const folders = await this.getAllFolders();
    return folders.filter(f => f.enabled);
  }

  async updateFolder(id: string, data: any): Promise<any> {
    const db = getDb();
    await db.update(schema.hostedFolders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.hostedFolders.id, id));

    return this.getFolderById(id);
  }

  async deleteFolder(id: string): Promise<void> {
    const db = getDb();
    await db.delete(schema.hostedFolders).where(eq(schema.hostedFolders.id, id));
  }
}
