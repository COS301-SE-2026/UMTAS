import { Module } from '@nestjs/common';
import { VenueController } from './venue.controller';
import { VenueService } from './venue.service';

@Module({
  controllers: [VenueController],
  exports: [VenueService],
  providers: [VenueService],
})
export class VenueModule {}
