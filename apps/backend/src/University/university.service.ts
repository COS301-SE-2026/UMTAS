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
        if (await this.checkDuplicateUniversityName(dto.UniversityName.trim())) 
            throw new ConflictException(`University [${dto.UniversityName.trim()}] already exists`);

        const [newUni] = await this.dbService.db
            .insert(University)
            .values({
                UniversityName: dto.UniversityName
            }).returning();

        return newUni;
    }//Create

    async getAll(): Promise<UniversityListResponseDto> {

        const universities = await this.dbService.db
            .select()
            .from(University);

        if (universities.length===0) throw new NotFoundException('No universities found');

        return {universities};
    }//GetAll

    async getById(uniId: string): Promise<UniversitySingleResponseDto> {

        //Fetch uni by id
        const [uni] = await this.dbService.db
            .select()
            .from(University)
            .where(eq(University.UniversityID, uniId)).limit(1);

        if (!uni) throw new NotFoundException(`No University found for universityID: ${uniId}`);

        return uni;
    }//getByID

    async update(uniId: string, dto: UpdateUniversityDto): Promise<UniversitySingleResponseDto> {

        //verify University exists
        const uni = await this.getById(uniId);

        //Verify atleast one field provided for update
        if (dto.UniversityName===undefined) throw new BadRequestException('At least one field required for update');

        //get updated fields
        const updatedName = dto.UniversityName?.trim();

        //check if updated name is the same || already exists on another university
        if (updatedName && updatedName!==uni.UniversityName) 
            if (await this.checkDuplicateUniversityName(updatedName))
                throw new ConflictException(`University [${dto.UniversityName.trim()}] already exists.`);

        // update university
        const [newUni] = await this.dbService.db
            .update(University)
            .set({
                UniversityName: updatedName ?? uni.UniversityName
            })
            .where(eq(University.UniversityID, uniId)).returning();

        if (!newUni) throw new InternalServerErrorException('University not updated');

        return newUni;
    }//update

    async delete(uniId: string): Promise<DeleteUniversityResponseDto> {

        //Check if university exists
        const uni = await this.getById(uniId);

        //Delete university
        await this.dbService.db
            .delete(University)
            .where(eq(University.UniversityID, uniId));

        return {
            UniversityName: uni.UniversityName,
            success: true
        }
    }//Delete

    //🎅's Little Helpers

    //get a university by name
    async getByName(uniName: string): Promise<UniversitySingleResponseDto> {

        const [uni] = await this.dbService.db
            .select()
            .from(University)
            .where(eq(University.UniversityName, uniName.trim()))
            .limit(1);

        return uni;
    }

    async checkDuplicateUniversityName(uniName: string): Promise<boolean>{

        const [uni] = await this.dbService.db
            .select()
            .from(University)
            .where(eq(University.UniversityName, uniName)).limit(1);

        return !!uni;
    }//END_checkDuplicateUniversityName

}//UniversityService