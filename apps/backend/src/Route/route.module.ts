import { Module } from '@nestjs/common';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';
import { EventModule } from 'src/Events/event.module';
import { StudentRoutingController } from './student-routing.controller';
import { StudentRoutingService } from './student-routing.service';
import { OrsService } from './ors.service';
import { RouteHeatmapService } from './route.heatmap.service';

@Module({
  imports: [EventModule],
  controllers: [RouteController, StudentRoutingController],
  exports: [
    RouteService,
    StudentRoutingService,
    OrsService,
    RouteHeatmapService,
  ],
  providers: [
    RouteService,
    StudentRoutingService,
    OrsService,
    RouteHeatmapService,
  ],
})
export class RouteModule {}
