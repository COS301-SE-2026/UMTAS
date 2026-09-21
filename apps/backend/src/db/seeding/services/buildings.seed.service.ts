import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Building, University } from '../../../entities';
import type { AppDatabase } from '../../database.service';
import { BaseSeedService } from '../base.seed.service';
import { SeedPersistenceService } from '../seed-persistence.service';

@Injectable()
export class BuildingSeedService extends BaseSeedService {
  constructor(private readonly persistence: SeedPersistenceService) {
    super();
  }

  async seed(db: AppDatabase): Promise<void> {
    const [university] = await db
      .select({ id: University.UniversityID })
      .from(University)
      .where(eq(University.UniversityName, 'University of Pretoria'))
      .limit(1);

    if (!university) {
      this.logger.warn(
        'University of Pretoria is missing; skipping Hatfield buildings',
      );
      return;
    }

    const existing = await db
      .select({ id: Building.BuildingID, name: Building.BuildingName })
      .from(Building)
      .where(eq(Building.UniversityID, university.id));

    const byName = new Map(
      existing.map((building) => [building.name, building.id]),
    );

    let created = 0;
    for (const seed of this.constants.UP_HATFIELD_BUILDINGS) {
      if (byName.has(seed.name)) continue;

      const [building] = await this.persistence.insertBuildings(db, [
        {
          UniversityID: university.id,
          BuildingName: seed.name,
          Latitude: seed.latitude,
          Longitude: seed.longitude,
        },
      ]);

      if (building) {
        byName.set(seed.name, building.BuildingID);
        created += 1;
      }
    } //END_seed

    this.logResult('Hatfield buildings', created);
  } //END)seed
} //END_BuildingSeedService
