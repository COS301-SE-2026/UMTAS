import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AppDatabase } from 'src/auth/auth';
import { DatabaseService } from 'src/db/database.service';
import {
  RouteDto,
  RouteEventContextDto,
  StudentStopRouteLegDto,
  StudentStopRouteQueryDto,
  StudentStopRouteResponseDto,
} from './dto';
import { RouteHelperService } from './route.helper.service';
import { RouteService } from './route.service';

interface StopWindow {
  previousEvent: RouteEventContextDto | null;
  nextEvent: RouteEventContextDto | null;
  description: string;
}

@Injectable()
export class RouteStopService {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly routeHelperService: RouteHelperService,
    private readonly routeService: RouteService,
  ) {}

  async getRouteViaBuilding(
    userId: string,
    uniId: string,
    query: StudentStopRouteQueryDto,
    tx?: AppDatabase,
  ): Promise<StudentStopRouteResponseDto> {
    const db = tx ?? this.dbService.db;

    //Get events for student on date
    const events = await this.routeHelperService.getStudentEventsForDate(
      userId,
      uniId,
      query.date,
      db,
    );

    //Event contexts
    const eventContexts = events
      .map((event) => this.routeHelperService.toEventContext(event, query.date))
      .sort(this.routeHelperService.compareEventContexts);

    //no events for student on date
    if (eventContexts.length === 0) {
      this.OOPSIE.warn(`No attended events found for date[${query.date}]`);
      throw new NotFoundException('No attended events found for the date');
    }

    //Get window for the stop route
    const window = this.selectStopWindow(eventContexts, query.time);

    const legs: StudentStopRouteLegDto[] = [];

    //to stop
    if (window.previousEvent) {
      legs.push({
        direction: 'TO_STOP',
        originEvent: window.previousEvent,
        destinationEvent: null,
        route: await this.getRouteBetweenBuildings(
          uniId,
          window.previousEvent.buildingId,
          query.buildingId,
          db,
        ),
      });
    }

    //from stop
    if (window.nextEvent) {
      legs.push({
        direction: 'FROM_STOP',
        originEvent: null,
        destinationEvent: window.nextEvent,
        route: await this.getRouteBetweenBuildings(
          uniId,
          query.buildingId,
          window.nextEvent.buildingId,
          db,
        ),
      });
    }

    //No legs found
    if (legs.length === 0) {
      this.OOPSIE.warn(
        `No route could be determined for stop[${query.buildingId}]`,
      );
      throw new NotFoundException('No route could be determined for stop');
    }

    return {
      date: query.date,
      buildingId: query.buildingId,
      time: query.time ?? null,
      selectedWindow: window.description,
      legs,
    };
  } //END_getRouteViaBuilding

  //🎅's little helpers

  /**
   * Selects the stop window, either at a specific time or as the largest gap.
   *
   * @param events - Events to evaluate.
   * @param time - Optional time to evaluate at; falls back to largest gap.
   * @returns The stop window.
   */
  private selectStopWindow(
    events: RouteEventContextDto[],
    time?: string,
  ): StopWindow {
    //If time defined look for appropriate window
    if (time) {
      return this.selectWindowAtTime(events, time);
    }

    //ELse look for biggest gap - suggestion based
    return this.selectLargestGapWindow(events);
  } //END_selectStopWindow

  /**
   * Selects the stop window relative to a specific time.
   *
   * @param events - Events to evaluate.
   * @param time - Time to evaluate against.
   * @returns The window around the given time.
   */
  private selectWindowAtTime(
    events: RouteEventContextDto[],
    time: string,
  ): StopWindow {
    //Get current event for time
    const currentIndex = events.findIndex(
      (event) => time >= event.startTime && time <= event.endTime,
    );

    //If current event found
    if (currentIndex >= 0) {
      const currentEvent = events[currentIndex];
      const nextEvent = events[currentIndex + 1] ?? null;

      return {
        previousEvent: currentEvent,
        nextEvent,
        description: nextEvent
          ? `${currentEvent.endTime}-${nextEvent.startTime}`
          : `after-${currentEvent.endTime}`,
      };
    }

    //Find next event after the time
    const nextIndex = events.findIndex((event) => time < event.startTime);

    //IF next event is the first event
    if (nextIndex === 0) {
      return {
        previousEvent: null,
        nextEvent: events[0],
        description: `before-${events[0].startTime}`,
      };
    }

    //Precioue event
    if (nextIndex === -1) {
      const previousEvent = events[events.length - 1];

      return {
        previousEvent,
        nextEvent: null,
        description: `after-${previousEvent.endTime}`,
      };
    }

    const previousEvent = events[nextIndex - 1];
    const nextEvent = events[nextIndex];

    return {
      previousEvent,
      nextEvent,
      description: `${previousEvent.endTime}-${nextEvent.startTime}`,
    };
  } //END_selectWindowAtTime

  /**
   * Selects the window with the largest gap between consecutive events.
   *
   * @param events - Events to evaluate.
   * @returns The largest-gap window. Single-event input returns an after-window.
   */
  private selectLargestGapWindow(events: RouteEventContextDto[]): StopWindow {
    //If only one event then we route after the event
    if (events.length === 1) {
      return {
        previousEvent: events[0],
        nextEvent: null,
        description: `after-${events[0].endTime}`,
      };
    }

    let largestGapIndex = 0;
    let largestGapMinutes = -1;

    //Find largest gap
    for (let i = 0; i < events.length - 1; i += 1) {
      const current = events[i];
      const next = events[i + 1];

      const gapMinutes = toMinutes(next.startTime) - toMinutes(current.endTime);

      if (gapMinutes > largestGapMinutes) {
        largestGapMinutes = gapMinutes;
        largestGapIndex = i;
      }
    } //END_i

    const previousEvent = events[largestGapIndex];
    const nextEvent = events[largestGapIndex + 1];

    return {
      previousEvent,
      nextEvent,
      description: `${previousEvent.endTime}-${nextEvent.startTime}`,
    };
  } //END_selectLargestGapWindow

  /**
   * Resolves a route between two buildings.
   *
   * @param uniId - University the route belongs to.
   * @param originBuildingId - Starting building, or null.
   * @param destinationBuildingId - Ending building, or null.
   * @param tx - Active database connection.
   * @returns The route, or null when buildings are missing or identical.
   */
  private async getRouteBetweenBuildings(
    uniId: string,
    originBuildingId: string | null,
    destinationBuildingId: string | null,
    tx: AppDatabase,
  ): Promise<RouteDto | null> {
    //both are required
    if (!originBuildingId || !destinationBuildingId) {
      this.OOPSIE.log(`Both origin and destination building ID required`);
      return null;
    }

    //IF same building - null
    if (originBuildingId === destinationBuildingId) {
      return null;
    }

    //Get route from Route service
    return this.routeService.getRecommendedRouteVariant({
      uniId,
      originBuildingId,
      destinationBuildingId,
      startAtIndex: 0,
      tx,
    });
  } //END_getRouteBetweenBuildings
} //END_ROuteStopService

/**
 * Converts time to int
 *
 * @param value - Time
 * @returns Minutes since midnight
 */
function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
} //END_toMinutes
