import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get(AppService);
  });

  describe('Test_getHello', () => {
    it('should return "Hello World!"', () => {
      //Act
      const result = service.getHello();

      //Assert
      expect(result).toBe('Hello World!');
    });
  }); //END_Test_getHello
}); //END_AppService
