import { Module } from '@nestjs/common';
import { BuildingService } from './building.service';
import { BuildingController } from './building.controller';

@Module({
  controllers: [BuildingController],
  exports: [BuildingService],
  providers: [BuildingController],
})
export class BuildingModule {}
