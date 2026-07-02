import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { StorageModule } from '../storage/storage.module';
import { PdfParserController } from './pdf-parser.controller';
import { PdfParserJobStoreService } from './pdf-parser-job-store.service';

@Module({
  imports: [JobsModule, StorageModule],
  controllers: [PdfParserController],
  providers: [PdfParserJobStoreService],
})
export class PdfParserModule {}
