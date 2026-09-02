import { Module } from '@nestjs/common';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';

@Module({
  controllers: [RouteController],
  exports: [RouteService],
  providers: [RouteService],
})
export class RouteModule {}
