import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionData } from 'src/auth/session.decorator';
import { DatabaseService } from 'src/db/database.service';
import { UniversityMapConfig } from 'src/entities';
import { MapConfigDto, UpdateMapConfigDto } from './dto/map-config.dto';
import { eq } from 'drizzle-orm';

type UniversityMapConfigEntity = typeof UniversityMapConfig.$inferSelect;

@Injectable()
export class MapConfigService {
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

  private toMapConfigDto(row: UniversityMapConfigEntity): MapConfigDto {
    return {
      NorthLat: row.NorthLat,
      SouthLat: row.SouthLat,
      EastLng: row.EastLng,
      WestLng: row.WestLng,
      DefaultZoom: row.DefaultZoom,
      GoogleMapID: row.GoogleMapID,
    };
  }

  async getMapConfig(session: SessionData | undefined): Promise<MapConfigDto> {
    const universityId = this.requireUniId(session);
    const database = this.databaseService.db;

    const [row] = await database
      .select()
      .from(UniversityMapConfig)
      .where(eq(UniversityMapConfig.UniversityID, universityId));

    if (!row) {
      throw new NotFoundException(
        'Map settings for this university have not been configured',
      );
    }

    return this.toMapConfigDto(row);
  }

  async updateMapConfig(
    session: SessionData | undefined,
    updateMapConfigDto: UpdateMapConfigDto,
  ): Promise<UpdateMapConfigDto> {
    const universityId = this.requireUniId(session);
    const database = this.databaseService.db;

    const values = {
      UniversityID: universityId,
      NorthLat: updateMapConfigDto.NorthLat,
      SouthLat: updateMapConfigDto.SouthLat,
      EastLng: updateMapConfigDto.EastLng,
      WestLng: updateMapConfigDto.WestLng,
      DefaultZoom: updateMapConfigDto.DefaultZoom,
      GoogleMapID: updateMapConfigDto.GoogleMapID ?? null,
    };

    const [row] = await database
      .insert(UniversityMapConfig)
      .values(values)
      .onConflictDoUpdate({
        target: UniversityMapConfig.UniversityID,
        set: values,
      })
      .returning();

    return this.toMapConfigDto(row);
  }
}
