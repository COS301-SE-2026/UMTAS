import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { University_Adapter } from '../Adapter/University_Adapter';
import { UniversityDto } from '../../University/dto/university.dto';
import { Example_Adapter } from '../Adapter/Example_Adapter/Example_Adapter';
import { NWU_Adapter } from '../Adapter/NWU_Adapter/NWU_Adapter';

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
    if (uni.ApiIdentifier?.toUpperCase() === `UP`) {
      const baseUrl = uni.BaseApiUrl ?? null;
      const apiKey = uni.ApiKey ?? null;

      if (baseUrl === null || apiKey === null)
        throw new BadRequestException(
          `BaseUrl and ApiKey does not exist for uni[${JSON.stringify(uni)}]`,
        );
      else return new Example_Adapter(baseUrl, apiKey);
    } else if (uni.ApiIdentifier?.toUpperCase() === 'NWU') {
      const baseUrl = uni.BaseApiUrl ?? null;

      if (baseUrl === null)
        throw new BadRequestException(
          `BaseUrl does not exist for uni[${JSON.stringify(uni)}]`,
        );
      else return new NWU_Adapter(baseUrl, uni.UniversityID);
    }

    throw new NotFoundException(
      `Adapter does not exist for ${JSON.stringify(uni)}`,
    );
  }
}
