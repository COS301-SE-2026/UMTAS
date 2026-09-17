import { forwardRef, Module } from '@nestjs/common';
import { BuildingService } from './building.service';
import { BuildingController } from './building.controller';
import { UniversityModule } from 'src/University/university.module';
import { VenueModule } from 'src/Venue/venue.module';
import { EventModule } from 'src/Events/event.module';

@Module({
  imports: [UniversityModule, forwardRef(() => VenueModule), EventModule],
  controllers: [BuildingController],
  exports: [BuildingService],
  providers: [BuildingService],
})
export class BuildingModule {}
