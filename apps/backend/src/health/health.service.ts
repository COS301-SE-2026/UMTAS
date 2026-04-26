import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../db/database.service.js';
import { HelloWorld, helloWorldTable } from '../entities/hello-world/index.js';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async writeHello(): Promise<HelloWorld> {
    this.logger.log('Hello World');

    const [saved] = await this.databaseService.db
      .insert(helloWorldTable)
      .values({ message: 'Hello World' })
      .returning();

    this.logger.log(`Saved HelloWorld entity with id: ${saved.id}`);

    return saved;
  }
}
