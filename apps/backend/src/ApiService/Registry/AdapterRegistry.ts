import { BadRequestException, NotFoundException } from '@nestjs/common';
import { University_Adapter } from '../Adapter/University_Adapter';
import { UniversityDto } from '../../University/dto/university.dto';
import { Example_Adapter } from '../Adapter/Example_Adapter';

export class AdapterRegistry {
  private adapters = new Map<string, University_Adapter>();

  private university: UniversityDto;

  constructor(private readonly uni: UniversityDto) {
    this.university = uni;

    if (!this.adapters.has(uni.UniversityID)) {
      this.register(uni.UniversityID);
    }
  }

  register(uniId: string): void {
    const adapter = this.createAdapter(this.university);

    this.adapters.set(uniId, adapter);
  } //END_register

  private createAdapter(uni: UniversityDto): University_Adapter {
    //Example used on UP since up doesnt have an api
    if (uni.ApiIdentifier?.toUpperCase() === `UP`) {
      const baseUrl = uni.BaseApiUrl ?? null;
      const apiKey = uni.ApiKey ?? null;

      if (baseUrl === null || apiKey === null)
        throw new BadRequestException(
          `BaseUrl and ApiKey does not exist for uni[${JSON.stringify(uni)}]`,
        );
      else return new Example_Adapter(baseUrl, apiKey);
    }

    throw new NotFoundException(
      `Adapter does not exist for ${JSON.stringify(uni)}`,
    );
  }

  get(uniId: string): University_Adapter {
    const adapter = this.adapters.get(uniId);

    if (!adapter) {
      throw new NotFoundException(
        `No adapter registered for university ${uniId}`,
      );
    }

    return adapter;
  } //END_get
}
