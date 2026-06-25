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
import { CreateUniversityDto, UpdateUniversityDto, UniversitySingleResponseDto, UniversityListResponseDto, DeleteUniversityResponseDto } from './university.dto';

@Injectable()
export class UniversityService {

    constructor(private readonly dbService: DatabaseService) {}

    async create(dto: CreateUniversityDto): Promise<UniversitySingleResponseDto> {

        throw new NotImplementedException('sorry nhe');
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