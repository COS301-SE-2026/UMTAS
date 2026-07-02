import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { PdfParserController } from './pdf-parser.controller';

@Module({
  imports: [JobsModule],
  controllers: [PdfParserController],
})
export class PdfParserModule {}
