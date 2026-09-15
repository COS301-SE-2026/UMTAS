import { Injectable } from '@nestjs/common';
import { ilike } from 'drizzle-orm';
import { AppDatabase } from 'src/auth/auth';
import { University } from 'src/entities';

@Injectable()
export class SeedQueryService {
  async getUniversityIDByName(
    tx: AppDatabase,
    uniName: string,
  ): Promise<string> {
    const [university] = await tx
      .select({ id: University.UniversityID })
      .from(University)
      .where(ilike(University.UniversityName, `%${uniName}%`))
      .limit(1);

    return university.id;
  } //END_getUniversityIDByName
} //END_SeedQueryService
