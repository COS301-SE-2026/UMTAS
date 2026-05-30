import { Module } from '@nestjs/common';
import { PdfParserController } from './pdf-parser.controller';
import { PdfParserService } from './pdf-parser.service';

@Module({
  controllers: [PdfParserController],
  providers: [PdfParserService],
  exports: [PdfParserService],
})
export class PdfParserModule {}
