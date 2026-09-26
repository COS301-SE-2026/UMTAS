import { forwardRef, Module } from '@nestjs/common';
import { VenueController } from './venue.controller';
import { VenueService } from './venue.service';
import { UniversityModule } from 'src/University/university.module';
import { BuildingModule } from 'src/Building/building.module';

@Module({
  imports: [UniversityModule, forwardRef(() => BuildingModule)],
  controllers: [VenueController],
  exports: [VenueService],
  providers: [VenueService],
})
export class VenueModule {}
