import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { Building, Venue } from '../../../entities';
import type { AppDatabase } from '../../database.service';
import { BaseSeedService } from '../base.seed.service';
import { SeedPersistenceService } from '../seed-persistence.service';
import { SeedQueryService } from './seed-query.service';

@Injectable()
export class VenuesSeedService extends BaseSeedService {
  constructor(
    private readonly persistence: SeedPersistenceService,
    private readonly query: SeedQueryService,
  ) {
    super();
  }

  async seed(db: AppDatabase): Promise<void> {
    const university = await this.query.getUniversityIDByName(db, 'Pretoria');

    if (!university) {
      this.logger.warn(
        'University of Pretoria is missing; skipping Hatfield venues',
      );
      return;
    }

    //Fetch buildings
    const buildingRows = await db
      .select({ id: Building.BuildingID, name: Building.BuildingName })
      .from(Building)
      .where(eq(Building.UniversityID, university));
    //Map buildings by name
    const buildings = new Map(
      buildingRows.map((building) => [building.name, building.id]),
    );

    //Get venue constants
    const names = this.constants.UP_HATFIELD_VENUES.map((venue) => venue.name);
    //fetch already existing venues
    const existing = await db
      .select({ id: Venue.VenueID, name: Venue.VenueName })
      .from(Venue)
      .where(
        and(
          eq(Venue.UniversityID, university),
          inArray(Venue.VenueName, names),
        ),
      );
    //Map venues by name to id
    const venues = new Map(existing.map((venue) => [venue.name, venue.id]));
    let created = 0;

    for (const seed of this.constants.UP_HATFIELD_VENUES) {
      //If already seeded skiparoo
      if (venues.has(seed.name)) continue;

      //Get building id for venue
      const buildingId = buildings.get(seed.buildingName);
      if (!buildingId) {
        this.logger.warn(
          `Building [${seed.buildingName}] is missing; cannot seed venue [${seed.name}]`,
        );
        continue;
      }

      //Create venue
      const [venue] = await this.persistence.insertVenues(db, [
        {
          VenueName: seed.name,
          UniversityID: university,
          BuildingID: buildingId,
          Capacity: seed.capacity,
        },
      ]);

      if (venue) {
        venues.set(seed.name, venue.VenueID);
        created += 1;
      }
    } //END_seed

    this.logResult('Hatfield venues', created);
  } //END_seed
} //END_VenueSeedService
