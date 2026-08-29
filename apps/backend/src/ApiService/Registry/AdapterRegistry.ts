import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { University_Adapter } from '../Adapter/University_Adapter';
import { UniversityDto } from '../../University/dto/university.dto';
import { NWU_Adapter } from '../Adapter/NWU/NWU_Adapter';
import { ML_Adapter } from '../Adapter/Maryland/ML_Adapter';

@Injectable()
export class AdapterRegistry {
  private adapters = new Map<string, University_Adapter>();

  constructor() {}

  getAdapter(uni: UniversityDto): University_Adapter {
    if (!this.adapters.has(uni.UniversityID)) {
      this.register(uni);
    }

    const adapter = this.adapters.get(uni.UniversityID);

    if (!adapter) {
      throw new NotFoundException(
        `No adapter registered for university ${uni.UniversityID}`,
      );
    }

    return adapter;
  } //END_getAdapter

  register(uni: UniversityDto): void {
    const adapter = this.createAdapter(uni);

    this.adapters.set(uni.UniversityID, adapter);
  } //END_register

  private createAdapter(uni: UniversityDto): University_Adapter {
    const ident = uni.ApiIdentifier?.toUpperCase();
    const baseUrl = uni.BaseApiUrl ?? null;
    // const apiKey = uni.ApiKey ?? null;

    switch (ident) {
      case 'NWU': {
        if (baseUrl === null)
          throw new BadRequestException(
            `BaseUrl does not exist for uni[${uni.UniversityName}]`,
          );
        return new NWU_Adapter(uni);
      }
      case 'ML': {
        if (baseUrl === null)
          throw new BadRequestException(
            `BaseUrl required for adapter[${uni.UniversityName}]`,
          );
        return new ML_Adapter(uni);
      }
    } //END)switch

    throw new NotFoundException(
      `Adapter does not exist for ${JSON.stringify(uni)}`,
    );
  }
}
