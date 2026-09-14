import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Building, Venue } from '../entities/index';
import { eq, ilike, isNotNull, isNull, and, inArray } from 'drizzle-orm';
import {
  VenueQueryDto,
  CreateVenueInput,
  VenueSingleResponseDto,
  UpdateVenueInput,
  UpdateVenueDto,
  BaseVenueDto,
  VenueListResponseDto,
  VenueAssignmentDto,
  BulkAssignResponseDto,
} from './dto/venue.dto';
import { AppDatabase } from 'src/auth/auth';
import { UniversityService } from 'src/University/university.service';
import { BuildingService } from 'src/Building/building.service';
import { DatabaseService } from 'src/db/database.service';
import { uniId } from 'src/Testing/constants';

@Injectable()
export class VenueService {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly uniService: UniversityService,
    @Inject(forwardRef(() => BuildingService))
    private readonly buildingService: BuildingService,
  ) {}

  //Create
  async create(
    input: CreateVenueInput,
    tx?: AppDatabase,
  ): Promise<VenueSingleResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.create(input, t);
      }); //END_transaction
    }

    //Validate input
    await this.validateCreateInput(input, tx);

    //Create new venue
    const [newVenue] = await tx
      .insert(Venue)
      .values({
        VenueName: input.VenueName,
        UniversityID: input.UniversityID,
        BuildingID: input.BuildingID,
      })
      .returning();

    if (!newVenue) {
      this.OOPSIE.fatal(`Failed to insert new venue[${JSON.stringify(input)}]`);
      throw new InternalServerErrorException(`Failed to create new venue`);
    }

    return {
      venue: newVenue,
    };
  } //END_Create

  //GetById
  async getById(
    venueId: string,
    tx?: AppDatabase,
  ): Promise<VenueSingleResponseDto> {
    const db = tx ?? this.dbService.db;

    //Fetch venue
    const [venue] = await db
      .select()
      .from(Venue)
      .where(eq(Venue.VenueID, venueId))
      .limit(1);

    if (!venue) {
      this.OOPSIE.warn(`Venue[${venueId}] not found`);
      throw new NotFoundException(`Venue not found`);
    }

    return { venue };
  } //END_getById

  //GetAll
  async getAllVenues(
    uniId: string,
    query: VenueQueryDto,
    tx?: AppDatabase,
  ): Promise<VenueListResponseDto> {
    const database = tx ?? this.dbService.db;

    const filters = [eq(Venue.UniversityID, uniId)];

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
      .select()
      .from(Venue)
      .where(and(...filters))
      .orderBy(Venue.VenueName);

    return { venues: rows };
  } //END_getAllVenues

  //Update
  async update(
    venueId: string,
    input: UpdateVenueInput,
    tx?: AppDatabase,
  ): Promise<VenueSingleResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.update(venueId, input, t);
      }); //END_transaction
    }

    //Fetch old venue - throws 404 if not exists
    const oldVenue = (await this.getById(venueId, tx)).venue;

    const updateFields: Partial<UpdateVenueDto> =
      await this.validateUpdateInput(oldVenue, input, tx);

    //No fields to update -> return early
    if (Object.keys(updateFields).length === 0) return { venue: oldVenue };

    //Update venue
    const [venue] = await tx.update(Venue).set(updateFields).returning();

    if (!venue) {
      this.OOPSIE.fatal(
        `Failed to update venue[${JSON.stringify(oldVenue)}] with fields[${JSON.stringify(updateFields)}]`,
      );
      throw new InternalServerErrorException(`Failed to update venue`);
    }

    return { venue };
  } //END_Update

  //Delete
  async delete(
    venueId: string,
    tx?: AppDatabase,
  ): Promise<VenueSingleResponseDto> {
    const db = tx ?? this.dbService.db;

    //Delete venue
    const [venue] = await db
      .delete(Venue)
      .where(eq(Venue.VenueID, venueId))
      .returning();

    if (!venue) {
      this.OOPSIE.fatal(`Failed to delete venue[${venueId}]`);
      throw new NotFoundException(`Failed to delete venue`);
    }

    return { venue };
  } //END_delete

  //Non CRUD
  async assignVenuesToBuildings(
    uniId: string,
    assignments: VenueAssignmentDto[],
    tx?: AppDatabase,
  ): Promise<BulkAssignResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction((t) =>
        this.assignVenuesToBuildings(uniId, assignments, t),
      ); //END_transaction
    }

    // Collect unique building IDs from assignments
    const buildingIds = [
      ...new Set(
        assignments
          .map((a) => a.buildingId)
          .filter((id): id is string => id !== null),
      ),
    ];

    // Validate all buildings exist and belong to the university
    if (buildingIds.length > 0) {
      const validBuildings = await tx
        .select({ id: Building.BuildingID })
        .from(Building)
        .where(
          and(
            inArray(Building.BuildingID, buildingIds),
            eq(Building.UniversityID, uniId),
          ),
        );

      if (validBuildings.length !== buildingIds.length) {
        throw new BadRequestException(
          'One or more buildings do not belong to the selected university',
        );
      }
    }

    // Validate all venues exist and belong to the university
    const venueIds = assignments.map((a) => a.venueId);
    const validVenues = await tx
      .select({ id: Venue.VenueID })
      .from(Venue)
      .where(
        and(inArray(Venue.VenueID, venueIds), eq(Venue.UniversityID, uniId)),
      );

    if (validVenues.length !== new Set(venueIds).size) {
      throw new BadRequestException(
        'One or more venues do not belong to the selected university',
      );
    }

    // Apply updates
    for (const a of assignments) {
      await tx
        .update(Venue)
        .set({ BuildingID: a.buildingId })
        .where(
          and(eq(Venue.VenueID, a.venueId), eq(Venue.UniversityID, uniId)),
        );
    } //END_a

    return {
      updated: assignments.length,
      success: true,
    };
  } //END_assignVenuesToBuildings

  //🎅's little helpers

  /**
   * Validate CreateVenueInput - relationships and duplicates
   * @param input - CreateVenueInput to validate
   * @param tx
   * @throws NotFoundException - for either uni or building
   * @throw ConflictException - If duplicate venue exists at same university with same venue name
   */
  private async validateCreateInput(
    input: CreateVenueInput,
    tx: AppDatabase,
  ): Promise<void> {
    //Check that university valid - will throw 404
    await this.uniService.getById(input.UniversityID, tx);

    //If building provided -> validate it exists - will throw 404
    if (input.BuildingID && input.BuildingID !== null) {
      await this.buildingService.getById(input.BuildingID, uniId, tx);
    } else {
      input.BuildingID = null;
    }

    //Validate venue name is unique per university
    const existing = await this.uniqueVenueNamePerUniversity(
      input.VenueName,
      input.UniversityID,
      tx,
    );
    if (existing) {
      this.OOPSIE.warn(
        `Venue with name[${input.VenueName}] already exists for university[${input.UniversityID}]`,
      );
      throw new ConflictException(`Venue already exists with that name`);
    }
  } //END_validateCreateInput

  /**
   * Fetches venue from university with same name as venueName
   * @param venueName - name to search for
   * @param uniId - university to search with
   * @param tx
   * @returns The found duplicate venue | null if none found
   */
  private async uniqueVenueNamePerUniversity(
    venueName: string,
    uniId: string,
    tx: AppDatabase,
  ): Promise<VenueSingleResponseDto | null> {
    //fetch venue with similar name for university
    const [venue] = await tx
      .select()
      .from(Venue)
      .where(and(eq(Venue.UniversityID, uniId), eq(Venue.VenueName, venueName)))
      .limit(1);

    return venue ? { venue } : null;
  } //END_uniqueVenueNamePerUniversity

  private async validateUpdateInput(
    oldVenue: BaseVenueDto,
    input: UpdateVenueInput,
    tx: AppDatabase,
  ): Promise<UpdateVenueInput> {
    //BuildingID
    const buildingId = input.BuildingID;
    if (buildingId === undefined) {
      delete input.BuildingID;
    } else if (buildingId === null) {
      if (oldVenue.BuildingID === null) {
        delete input.BuildingID;
      }
    } else if (buildingId === oldVenue.BuildingID) {
      delete input.BuildingID;
    } else {
      //validate new building exists
      await this.buildingService.getById(buildingId, input.UniversityID, tx);
    }

    //VenueName
    const venueName = input.VenueName;
    if (!venueName || (venueName && venueName === oldVenue.VenueName)) {
      delete input.VenueName;
    } else {
      //Validate that venue name not already taken - throw conflictException
      const duplicate = await this.uniqueVenueNamePerUniversity(
        venueName,
        input.UniversityID,
        tx,
      );
      if (duplicate) {
        this.OOPSIE.warn(
          `Venue[${venueName}] already exists for university[${input.UniversityID}]`,
        );
        throw new ConflictException(`Venue name already exists for university`);
      }
    }

    return input;
  } //END_validateUpdateInput
}
