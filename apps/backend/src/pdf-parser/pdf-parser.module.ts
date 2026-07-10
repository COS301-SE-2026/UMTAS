import { Module } from '@nestjs/common';
import { EventImportKeyService } from '../Events/event-import-key.service';
import { JobsModule } from '../jobs/jobs.module';
import { StorageModule } from '../storage/storage.module';
import { EventImporter } from './event-importer.service';
import { ModuleResolver } from './module-resolver.service';
import { ParserResultImporter } from './parser-result-importer.service';
import { PdfParseSubmission } from './pdf-parse-submission';
import { PdfParserController } from './pdf-parser.controller';
import { PdfParserFingerprintService } from './pdf-parser-fingerprint.service';
import { PdfParserJobStoreService } from './pdf-parser-job-store.service';

@Module({
  imports: [JobsModule, StorageModule],
  controllers: [PdfParserController],
  providers: [
    EventImportKeyService,
    EventImporter,
    ModuleResolver,
    ParserResultImporter,
    PdfParseSubmission,
    PdfParserFingerprintService,
    PdfParserJobStoreService,
  ],
})
export class PdfParserModule {}
