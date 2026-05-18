import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../db/database.service';

export class TimetableService {
  constructor(private readonly dbService: DatabaseService) {}
} //TimetableService
