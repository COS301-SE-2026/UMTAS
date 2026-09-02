import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { ModuleModule } from './Module/module.module';
import { EventModule } from './Events/event.module';
import { TimetableModule } from './Timetable/timetable.module';
import { UniversityModule } from './University/university.module';
import { CourseModule } from './Course/course.module';
import { BuilderModule } from './Builder/builder.module';
import { JobsModule } from './jobs/jobs.module';
import { PdfParserModule } from './pdf-parser/pdf-parser.module';
import { SolverModule } from './solver/solver.module';
import { StorageModule } from './storage/storage.module';
import { AttendanceModule } from './Attendance/attendance.module';
import { GroupingModule } from './Grouping/grouping.module';
import { VenueModule } from './Venue/venue.module';
import { BuildingModule } from './Building/building.module';
import { MapConfigModule } from './Map-config/map-config.module';
import { ApiServiceModule } from './ApiService/ApiService.module';
import { AnalyticsModule } from './AnalyticsService/analytics.module';
import { RouteModule } from './Route/route.module';
import { AcademicCalendarModule } from './academic_calendar/academic_calendar.module';
import { PostHogModule } from './posthog/posthog.module';

@Module({
  imports: [
    PostHogModule,
    DatabaseModule,
    HealthModule,
    MailModule,
    ModuleModule,
    EventModule,
    TimetableModule,
    UniversityModule,
    CourseModule,
    BuilderModule,
    StorageModule,
    JobsModule,
    PdfParserModule,
    SolverModule,
    AttendanceModule,
    GroupingModule,
    VenueModule,
    BuildingModule,
    MapConfigModule,
    RouteModule,
    AcademicCalendarModule,
    ApiServiceModule,
    AnalyticsModule,
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
