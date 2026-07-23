import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  BACKEND_QUEUE_CONFIG,
  PDF_PARSE_QUEUE_TOKEN,
  TIMETABLE_SOLVE_QUEUE_TOKEN,
} from './queue.constants';
import {
  BackendQueueConfig,
  buildBullRootOptions,
  buildQueueConfig,
} from './queue.config';
import { QueueProducerService } from './queue-producer.service';
import { WorkerCallbackAuthGuard } from './worker-callback-auth.guard';

const queueConfigProvider = {
  provide: BACKEND_QUEUE_CONFIG,
  inject: [ConfigService],
  useFactory: buildBackendQueueConfig,
};

function buildBackendQueueConfig(
  configService: ConfigService,
): BackendQueueConfig {
  return buildQueueConfig((key) => configService.get<string>(key));
}

function buildBullRootOptionsFromConfigService(configService: ConfigService) {
  const config = buildBackendQueueConfig(configService);
  return buildBullRootOptions(config);
}

function buildPdfParseQueueOptions(configService: ConfigService) {
  const config = buildBackendQueueConfig(configService);
  return {
    name: config.pdfParse.name,
    defaultJobOptions: config.pdfParse.defaultJobOptions,
  };
}

function buildTimetableSolveQueueOptions(configService: ConfigService) {
  const config = buildBackendQueueConfig(configService);
  return {
    name: config.timetableSolve.name,
    defaultJobOptions: config.timetableSolve.defaultJobOptions,
  };
}

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildBullRootOptionsFromConfigService,
    }),
    BullModule.registerQueueAsync(
      {
        name: PDF_PARSE_QUEUE_TOKEN,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: buildPdfParseQueueOptions,
      },
      {
        name: TIMETABLE_SOLVE_QUEUE_TOKEN,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: buildTimetableSolveQueueOptions,
      },
    ),
  ],
  providers: [
    queueConfigProvider,
    QueueProducerService,
    WorkerCallbackAuthGuard,
  ],
  exports: [
    BACKEND_QUEUE_CONFIG,
    QueueProducerService,
    WorkerCallbackAuthGuard,
  ],
})
export class JobsModule {}
