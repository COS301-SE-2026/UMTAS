import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { University_Adapter } from '../Adapter/University_Adapter';
import { UniversityDto } from '../../University/dto/university.dto';
import { ML_Adapter } from '../Adapter/Maryland/ML_Adapter';

@Injectable()
export class AdapterRegistry {
  private adapters = new Map<string, University_Adapter>();

  constructor() {}

  getAdapter(uni: UniversityDto): University_Adapter {
    const adapter = this.adapters.get(uni.UniversityID);

    if (adapter) {
      return adapter;
    } else {
      return this.register(uni);
    }
  } //END_getAdapter

  register(uni: UniversityDto): University_Adapter {
    const adapter = this.createAdapter(uni);

    this.adapters.set(uni.UniversityID, adapter);

    return adapter;
  } //END_register

  private createAdapter(uni: UniversityDto): University_Adapter {
    const ident = uni.ApiIdentifier?.toUpperCase();
    const baseUrl = uni.BaseApiUrl ?? null;
    // const apiKey = uni.ApiKey ?? null;

    //Usually required
    if (baseUrl === null)
      throw new BadRequestException(
        `BaseUrl does not exist for uni[${uni.UniversityName}]`,
      );

    switch (ident) {
      case 'ML': {
        return new ML_Adapter(uni);
      }

      default: {
        throw new NotFoundException(
          `Adapter does not exist for ${JSON.stringify(uni)}`,
        );
      }
    } //END)switch
  }
}
