import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initDb } from './db';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cors from '@fastify/cors';
import pino from 'pino';

async function bootstrap() {
  const logger = pino({ level: 'info' });
  
  try {
    await initDb();
    logger.info('Database initialized');
  } catch (error: any) {
    logger.warn({ error: error?.message }, 'Database init warning - continuing anyway');
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ['error', 'warn', 'log', 'debug'] },
  );

  await app.register(cors, {
    origin: '*',
  });

  const port = parseInt(process.env.PORT || '7200', 10);
  await app.listen(port, '0.0.0.0');
  
  const url = `http://0.0.0.0:${port}`;
  logger.info({ url }, 'API server started');
}

bootstrap();
