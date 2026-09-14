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

  private readonly adapterFactory = new Map<
    string,
    (uni: UniversityDto) => University_Adapter
  >([['ML', (uni) => new ML_Adapter(uni)]]);

  constructor() {}

  getAdapter(uni: UniversityDto): University_Adapter {
    const adapter = this.adapters.get(uni.UniversityID);

    return adapter ?? this.register(uni);
  } //END_getAdapter

  register(uni: UniversityDto): University_Adapter {
    const adapter = this.createAdapter(uni);

    this.adapters.set(uni.UniversityID, adapter);

    return adapter;
  } //END_register

  private createAdapter(uni: UniversityDto): University_Adapter {
    const ident = uni.ApiIdentifier?.toUpperCase();
    const baseUrl = uni.BaseApiUrl ?? null;

    //Required
    if (!ident)
      throw new BadRequestException(
        `ApiIdentifier does not exist for uni[${uni.UniversityName}]`,
      );

    if (!baseUrl)
      throw new BadRequestException(
        `BaseUrl does not exist for uni[${uni.UniversityName}]`,
      );

    const adapter = this.adapterFactory.get(ident ?? '');
    if (!adapter) {
      throw new NotFoundException(
        `Adapter does not exist for ${JSON.stringify(uni)}`,
      );
    }

    return adapter(uni);
  }
}
