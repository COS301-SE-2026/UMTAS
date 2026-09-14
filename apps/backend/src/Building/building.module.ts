import { Module } from '@nestjs/common';
import { BuildingService } from './building.service';
// import { BuildingController } from './building.controller';
import { UniversityModule } from 'src/University/university.module';

@Module({
  imports: [UniversityModule],
  // controllers: [BuildingController],
  exports: [BuildingService],
  providers: [BuildingService],
})
export class BuildingModule {}
