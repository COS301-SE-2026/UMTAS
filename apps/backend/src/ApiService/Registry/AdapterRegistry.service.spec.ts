import { AdapterRegistry } from './AdapterRegistry.service';

import { Test } from '@nestjs/testing';

//Constants
import { uniId } from 'src/Testing/constants';

//Mock services

//Factories
import { createUniversity } from 'src/Testing/Factories';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ML_Adapter } from '../Adapter/Maryland/ML_Adapter';
import { UniversityDto } from 'src/University/dto/university.dto';
import { NWU_Adapter } from '../Adapter/NWU/NWU_Adapter';

describe('AdapterRegistryService', () => {
  let service: AdapterRegistry;

  //Before
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AdapterRegistry],
    }).compile();

    service = module.get(AdapterRegistry);
  }); //END_beforeEach

  //AfterEach
  // afterEach(()=>{

  // });//END_AfterEach

  //Tests
  const uni = createUniversity({
    UniversityID: uniId,
  });

  describe('Test_Register', () => {
    //UnHappy - should throw BadRequest
    it('should throw if university has no baseUrl', async () => {
      expect(() =>
        service.register({
          ...uni,
          BaseApiUrl: undefined,
        }),
      ).toThrow(BadRequestException);
    });

    //UnHappy - should throw NotFoundException
    it('should throw if university does not have ApiIdentifier - they dont want api integration', async () => {
      expect(() =>
        service.register({
          ...uni,
          ApiIdentifier: undefined,
        }),
      ).toThrow(NotFoundException);
    });
  }); //END_Test_Register

  describe('Test_getAdapter', () => {
    //Happy - returns ML_Adapter
    it('should return University of Maryland adapter', () => {
      const spy = jest.spyOn(service, 'register');

      //Act
      const adapter = service.getAdapter({
        ...uni,
        ApiIdentifier: 'ML',
      });

      //Assert
      expect(adapter).toBeInstanceOf(ML_Adapter);
      expect(spy).toHaveBeenCalled();
    });

    //Happy - return NWU_Adapter
    it('should return Univerity of NWU adpater', () => {
      //Arrange
      const spy = jest.spyOn(service, 'register');

      //Act
      const adapter = service.getAdapter({
        ...uni,
        ApiIdentifier: 'NWU',
      });

      //Assert
      expect(adapter).toBeInstanceOf(NWU_Adapter);
      expect(spy).toHaveBeenCalled();
    });

    //Happy - after returning a ML_Adapter !!!
    it('should return already existent ML_Adapter', () => {
      //Arrange
      const mlUni: UniversityDto = {
        ...uni,
        ApiIdentifier: 'ML',
      };

      const spy = jest.spyOn(service, 'register');

      //Register ml
      service.getAdapter(mlUni);

      //Act
      const adapter = service.getAdapter(mlUni);

      //Assert
      expect(adapter).toBeInstanceOf(ML_Adapter);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  }); //END_Test_getAdapter
}); //END_AdapterRegistryService
