import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Building, Venue } from '../entities/index';
import { DatabaseService } from '..//db/database.service';
import { SessionData } from '../auth/session.decorator';
import { eq, ilike, isNotNull, isNull, and } from 'drizzle-orm';
import {
  AssignVenueBuildingDto,
  VenueMappingDto,
  VenueMappingListResponseDto,
  VenueQueryDto,
  BulkAssignVenuesDto,
} from './dto/venue.dto';
import { inArray } from 'drizzle-orm';

@Injectable()
export class VenueService {
  constructor(private readonly databaseService: DatabaseService) {}

  private requireUniId(session: SessionData | undefined): string {
    if (!session?.user) {
      throw new ForbiddenException('No active session');
    }

    if (!session?.uniId) {
      throw new ForbiddenException('No university selected');
    }

    return session?.uniId;
  }

  private async venueToDto(venueId: string): Promise<VenueMappingDto> {
    const database = this.databaseService.db;

    const [row] = await database
      .select({
        venueId: Venue.VenueID,
        venueName: Venue.VenueName,
        buildingId: Building.BuildingID,
        buildingName: Building.BuildingName,
      })
      .from(Venue)
      .leftJoin(Building, eq(Venue.BuildingID, Building.BuildingID))
      .where(eq(Venue.VenueID, venueId));

    return row;
  }

  async getAllVenues(
    session: SessionData,
    query: VenueQueryDto,
  ): Promise<VenueMappingListResponseDto> {
    const universityId = this.requireUniId(session);
    const database = this.databaseService.db;

    const filters = [eq(Venue.UniversityID, universityId)];

    if (query.buildingId) {
      filters.push(eq(Venue.BuildingID, query.buildingId));
    }

    if (query.mapped === true) {
      filters.push(isNotNull(Venue.BuildingID));
    } else if (query.mapped === false) {
      filters.push(isNull(Venue.BuildingID));
    }

    if (query.search) {
      filters.push(ilike(Venue.VenueName, `%${query.search}%`));
    }

    const rows = await database
      .select({
        venueId: Venue.VenueID,
        venueName: Venue.VenueName,
        buildingId: Building.BuildingID,
        buildingName: Building.BuildingName,
      })
      .from(Venue)
      .leftJoin(Building, eq(Venue.BuildingID, Building.BuildingID))
      .where(and(...filters))
      .orderBy(Venue.VenueName);

    return { venues: rows };
  }

  async assignBuilding(
    session: SessionData,
    venueId: string,
    assignVenueDto: AssignVenueBuildingDto,
  ): Promise<VenueMappingDto> {
    const universityId = this.requireUniId(session);
    const database = this.databaseService.db;

    const [venue] = await database
      .select()
      .from(Venue)
      .where(
        and(eq(Venue.VenueID, venueId), eq(Venue.UniversityID, universityId)),
      );

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    if (assignVenueDto.buildingId) {
      const [building] = await database
        .select({ id: Building.BuildingID })
        .from(Building)
        .where(
          and(
            eq(Building.BuildingID, assignVenueDto.buildingId),
            eq(Building.UniversityID, universityId),
          ),
        );

      if (!building) {
        throw new BadRequestException(
          'Building does not belong to the selected university',
        );
      }
    }

    const [updated] = await database
      .update(Venue)
      .set({ BuildingID: assignVenueDto.buildingId })
      .where(eq(Venue.VenueID, venueId))
      .returning();

    return this.venueToDto(updated.VenueID);
  }

  async bulkAssign(
    session: SessionData,
    bulkAssignVenueDto: BulkAssignVenuesDto,
  ): Promise<{ updated: number; success: boolean }> {
    const universityId = this.requireUniId(session);
    const database = this.databaseService.db;

    const buildingIds = [
      ...new Set(
        bulkAssignVenueDto.assignments
          .map((assignment) => assignment.buildingId)
          .filter((id): id is string => id !== null),
      ),
    ];

    if (buildingIds.length > 0) {
      const validBuildings = await database
        .select({ id: Building.BuildingID })
        .from(Building)
        .where(
          and(
            inArray(Building.BuildingID, buildingIds),
            eq(Building.UniversityID, universityId),
          ),
        );

      if (validBuildings.length !== buildingIds.length) {
        throw new BadRequestException(
          'One or more buildings do not belong to your selected university',
        );
      }
    }

    await database.transaction(async (tx) => {
      for (const assignment of bulkAssignVenueDto.assignments) {
        await tx
          .update(Venue)
          .set({ BuildingID: assignment.buildingId })
          .where(
            and(
              eq(Venue.VenueID, assignment.venueId),
              eq(Venue.UniversityID, universityId),
            ),
          );
      }
    });

    return { updated: bulkAssignVenueDto.assignments.length, success: true };
  }
}
