import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RouteService } from './route.service';
import { DatabaseService } from 'src/db/database.service';
import {
  DiversionRequestDto,
  DiversionRouteResponseDto,
  RouteDto,
} from './dto';
import { AppDatabase } from 'src/auth/auth';
import { RouteDiversion } from 'src/entities';
import { and, eq } from 'drizzle-orm';

type RouteDiversion = typeof RouteDiversion.$inferSelect;

//DiversionObjects
interface DiversionObjects {
  fromRoute: RouteDto;
  toRoute: RouteDto;
  diversion: number;
}

@Injectable()
export class RouteDiversionService {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly routeService: RouteService,
  ) {}

  async divertRoute(
    uniId: string,
    dto: DiversionRequestDto,
    tx?: AppDatabase,
  ): Promise<DiversionRouteResponseDto> {
    const db = tx ?? this.dbService.db;

    //Validate dto
    const routesObject = await this.validateDiversionRequestDto(uniId, dto, db);

    //Insert / update diversion and return repsonse
    const response = await this.insertOrUpdateDiversionRoute(routesObject, db);

    return response;
  } //END_divertRoute

  //🎅's little helpers

  /**
   * Validates a diversion request and resolves the from/to route objects
   *
   * @param uniId - University to scope route lookups to
   * @param dto - Diversion request
   * @param tx - Active database connection
   * @returns The resolved from/to routes and diversion value
   * @throws BadRequestException when diversion is out of range or neither toRoute nor toRouteIndex provided
   */
  private async validateDiversionRequestDto(
    uniId: string,
    dto: DiversionRequestDto,
    tx: AppDatabase,
  ): Promise<DiversionObjects> {
    //Validate fromRoute is exists - throws 404
    const fromRoute: RouteDto = (
      await this.routeService.getById(dto.fromRoute, tx)
    ).route;

    //Validate diversion
    this.validateDiversion(dto.diversion);

    //Validate that atleast toRoute or toROuteIndex is provided
    let toRoute: RouteDto;
    if (dto.toRoute) {
      //Validate it exists
      toRoute = (await this.routeService.getById(dto.toRoute, tx)).route;
    } else if (dto.toRouteIndex) {
      //Get alternate route
      toRoute = await this.routeService.getRouteVariant(
        uniId,
        fromRoute.originBuildingId,
        fromRoute.destinationBuildingId,
        dto.toRouteIndex,
        tx,
      );
    } else {
      this.OOPSIE.warn(`Either toRoute id or toRouteIndex required`);
      throw new BadRequestException(
        `Either toRoute id or toRouteIndex required.`,
      );
    }

    //Return objects
    return {
      fromRoute: fromRoute,
      toRoute: toRoute,
      diversion: dto.diversion,
    };
  } //END_validateDiversionREquestDto

  private validateDiversion(diversion: number): void {
    if (diversion < 0 || diversion > 1)
      throw new BadRequestException(`Diversion needs to be between 0 and 1`);
  } //END_validateDiversion

  /**
   * Creates or updates a route diversion record
   *
   * @param input - Resolved from/to routes and diversion value
   * @param tx - Active database connection
   * @returns The response DTO.
   */
  private async insertOrUpdateDiversionRoute(
    input: DiversionObjects,
    tx: AppDatabase,
  ): Promise<DiversionRouteResponseDto> {
    const { fromRoute, toRoute, diversion } = input;

    //Fetch diversion route from db
    const [existing] = await tx
      .select()
      .from(RouteDiversion)
      .where(
        and(
          eq(RouteDiversion.RouteID, fromRoute.routeId),
          eq(RouteDiversion.DivertToRoute, toRoute.routeId),
        ),
      )
      .limit(1);

    if (!existing) {
      //Create diversion
      await this.createDiversion(
        fromRoute.routeId,
        toRoute.routeId,
        diversion,
        tx,
      );
    } else {
      //Update diversion if diversion is different
      //Check that diversion is different from old
      if (existing.Diversion !== diversion) {
        await this.updateDiversion(
          fromRoute.routeId,
          toRoute.routeId,
          diversion,
          tx,
        );
      }
    }

    return {
      fromRoute,
      toRoute,
      diversion,
    };
  } //getDiversionRoute

  /**
   * Inserts a new route diversion
   *
   * @param fromRouteId - Route being diverted from
   * @param toRouteId - Route being diverted to.
   * @param diversion - Diversion value
   * @param tx - Active database connection
   * @returns The inserted row
   * @throws InternalServerErrorException when the insert returns no row
   */
  private async createDiversion(
    fromRouteId: string,
    toRouteId: string,
    diversion: number,
    tx: AppDatabase,
  ): Promise<RouteDiversion> {
    const [route] = await tx
      .insert(RouteDiversion)
      .values({
        RouteID: fromRouteId,
        DivertToRoute: toRouteId,
        Diversion: diversion,
      })
      .returning();

    if (!route) {
      this.OOPSIE.fatal(
        `Failed to create diversion[${diversion}] for fromRouteId[${fromRouteId}] to toRouteId[${toRouteId}]`,
      );
      throw new InternalServerErrorException(
        `Failed to create diversion for route`,
      );
    }

    return route;
  } //END_createDiversion

  /**
   * Updates an existing route diversion.
   *
   * @param fromRouteId - Route being diverted from.
   * @param toRouteId - Route being diverted to
   * @param diversion - New diversion value
   * @param tx - Active database connection
   * @returns The updated row
   * @throws InternalServerErrorException when the update returns no row
   */
  private async updateDiversion(
    fromRouteId: string,
    toRouteId: string,
    diversion: number,
    tx: AppDatabase,
  ): Promise<RouteDiversion> {
    const [route] = await tx
      .update(RouteDiversion)
      .set({
        Diversion: diversion,
      })
      .where(
        and(
          eq(RouteDiversion.RouteID, fromRouteId),
          eq(RouteDiversion.DivertToRoute, toRouteId),
        ),
      )
      .returning();

    //Update failed
    if (!route) {
      this.OOPSIE.fatal(
        `Failed to update diversion[${diversion}] for fromRouteId[${fromRouteId}] to toRouteId[${toRouteId}]`,
      );
      throw new InternalServerErrorException(
        `Failed to update diversion for route`,
      );
    }

    return route;
  } //END_createDiversion
} //END_RouteDiversionService
