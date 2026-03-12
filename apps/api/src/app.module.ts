import { Module } from '@nestjs/common';
import { MachinesModule } from './modules/machines/machines.module';
import { FoldersModule } from './modules/folders/folders.module';
import { RunsModule } from './modules/runs/runs.module';
import { LocksModule } from './modules/locks/locks.module';
import { HealthModule } from './common/health.module';

@Module({
  imports: [
    MachinesModule,
    FoldersModule,
    RunsModule,
    LocksModule,
    HealthModule,
  ],
})
export class AppModule {}
