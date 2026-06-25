import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  NotImplementedException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { DatabaseService } from '../db/database.service';
import { University } from 'src/entities';
import { CreateUniversityDto, UpdateUniversityDto, UniversitySingleResponseDto, UniversityListResponseDto, DeleteUniversityResponseDto } from './dto/university.dto';

@Injectable()
export class UniversityService {

    constructor(private readonly dbService: DatabaseService) {}

    async create(dto: CreateUniversityDto): Promise<UniversitySingleResponseDto> {

        //Check if university already exists
        const [uni] = await this.dbService.db
            .select()
            .from(University)
            .where(eq(University.UniversityName, dto.UniversityName)).limit(1);

        if (uni) throw new ConflictException(`University [${dto.UniversityName}] already exists with universityID: ${uni.UniversityID}`);

        const [newUni] = await this.dbService.db
            .insert(University)
            .values({
                UniversityName: dto.UniversityName
            }).returning();

        return newUni;
    }//Create

    async getAll(): Promise<UniversityListResponseDto> {

        throw new NotImplementedException('sorry nhe');
    }//GetAll

    async getById(uniId: number): Promise<UniversitySingleResponseDto> {

        throw new NotImplementedException('sorry nhe');
    }//getByID

    async update(uniId: number, dto: UpdateUniversityDto): Promise<UniversitySingleResponseDto> {

        throw new NotImplementedException('sorry nhe');
    };

    async delete(uniId: number): Promise<DeleteUniversityResponseDto> {

        throw new NotImplementedException('sorry nhe');
    }//Delete
}//UniversityService