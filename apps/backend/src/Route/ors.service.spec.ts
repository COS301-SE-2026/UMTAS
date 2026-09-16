//Service to test
import { OrsService } from './ors.service';

//Actual services

//Mock services and db

//Factories
import {} from 'src/Testing/Factories';

//Exceptions
import {
  BadRequestException,
  GatewayTimeoutException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

// idk just imports man

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('OrsService', () => {
  let service: OrsService;

  beforeEach(() => {
    service = new OrsService();

    (service as any).endpoint = 'https://ors.example.com/directions';
    (service as any).requestTimeoutMs = 100;
    process.env.ORS_API_KEY = 'test-key';
    mockFetch.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  //Tests

  describe('Test_getWalkingRoute', () => {
    const start = { lat: -25.7545, lng: 28.2314 };
    const end = { lat: -25.755, lng: 28.232 };

    it('should throw NotFoundException when no feature is returned', async () => {
      //Arrange
      jest
        .spyOn(service as any, 'makeRequest')
        .mockResolvedValue({ features: [] });

      //Act + Assert
      await expect(service.getWalkingRoute(start, end)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return coordinates and distance from the first feature', async () => {
      //Arrange
      const coordinates = [{ lat: -25.7545, lng: 28.2314 }];
      jest.spyOn(service as any, 'makeRequest').mockResolvedValue({
        features: [
          {
            geometry: { coordinates: [[28.2314, -25.7545]] },
            properties: { summary: { distance: 120.4 } },
          },
        ],
      });
      jest
        .spyOn(service as any, 'parseCoordinates')
        .mockReturnValue(coordinates);

      //Act
      const result = await service.getWalkingRoute(start, end);

      //Assert
      expect(result).toEqual({
        routeCoordinates: coordinates,
        distanceMetres: 120,
      });
    });
  }); //END_Test_getWalkingRoute

  describe('Test_getWalkingRouteVariants', () => {
    const start = { lat: -25.7545, lng: 28.2314 };
    const end = { lat: -25.755, lng: 28.232 };

    it('should throw NotFoundException when features is missing or empty', async () => {
      //Arrange
      jest
        .spyOn(service as any, 'makeAlternativeRequest')
        .mockResolvedValue({ features: [] });

      //Act + Assert
      await expect(service.getWalkingRouteVariants(start, end)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should map features to route variants', async () => {
      //Arrange
      const coordinates = [{ lat: -25.7545, lng: 28.2314 }];
      jest.spyOn(service as any, 'makeAlternativeRequest').mockResolvedValue({
        features: [
          {
            geometry: { coordinates: [[28.2314, -25.7545]] },
            properties: { summary: { distance: 120.4 } },
          },
          {
            geometry: { coordinates: [[28.232, -25.755]] },
            properties: { summary: { distance: 150.6 } },
          },
        ],
      });
      jest
        .spyOn(service as any, 'parseCoordinates')
        .mockReturnValue(coordinates);

      //Act
      const result = await service.getWalkingRouteVariants(start, end);

      //Assert
      expect(result).toEqual([
        { routeIndex: 0, routeCoordinates: coordinates, distanceMetres: 120 },
        { routeIndex: 1, routeCoordinates: coordinates, distanceMetres: 151 },
      ]);
    });
  }); //END_Test_getWalkingRouteVariants

  //Helpers

  describe('Test_getApiKey', () => {
    it('should throw InternalServerErrorException when ORS_API_KEY is not set', () => {
      //Arrange
      delete process.env.ORS_API_KEY;

      //Act + Assert
      expect(() => (service as any).getApiKey()).toThrow(
        InternalServerErrorException,
      );
    });

    it('should return the API key from the environment', () => {
      //Arrange
      process.env.ORS_API_KEY = 'test-key';

      //Act
      const result = (service as any).getApiKey();

      //Assert
      expect(result).toBe('test-key');
    });
  }); //END_Test_getApiKey

  describe('Test_makeRequest', () => {
    const start = { lat: -25.7545, lng: 28.2314 };
    const end = { lat: -25.755, lng: 28.232 };

    it('should return parsed JSON on a successful response', async () => {
      //Arrange
      const data = { routes: [{ summary: { distance: 120 } }] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(data),
      });

      //Act
      const result = await (service as any).makeRequest(start, end);

      //Assert
      expect(result).toBe(data);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('start=28.2314%2C-25.7545'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should throw GatewayTimeoutException on AbortError', async () => {
      //Arrange
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      //Act + Assert
      await expect((service as any).makeRequest(start, end)).rejects.toThrow(
        GatewayTimeoutException,
      );
    });

    it('should throw ServiceUnavailableException on network failure', async () => {
      //Arrange
      mockFetch.mockRejectedValue(new Error('network down'));

      //Act + Assert
      await expect((service as any).makeRequest(start, end)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException on a non-OK response', async () => {
      //Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        json: jest.fn(),
      });

      //Act + Assert
      await expect((service as any).makeRequest(start, end)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException on invalid JSON', async () => {
      //Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('bad json')),
      });

      //Act + Assert
      await expect((service as any).makeRequest(start, end)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should abort and throw GatewayTimeoutException when the request exceeds the timeout', async () => {
      //Arrange
      jest.useFakeTimers();
      mockFetch.mockImplementation(
        (_url: string, options: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => {
              const err = new Error('aborted');
              err.name = 'AbortError';
              reject(err);
            });
          }),
      );

      //Act
      const promise = (service as any).makeRequest(start, end);
      jest.advanceTimersByTime(100);

      //Assert
      await expect(promise).rejects.toThrow(GatewayTimeoutException);
      jest.useRealTimers();
    });
  }); //END_Test_makeRequest

  describe('Test_parseCoordinates', () => {
    it('should throw NotFoundException when value is not an array', () => {
      //Act + Assert
      expect(() => (service as any).parseCoordinates('bad')).toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when value is an empty array', () => {
      //Act + Assert
      expect(() => (service as any).parseCoordinates([])).toThrow(
        NotFoundException,
      );
    });

    it('should throw ServiceUnavailableException when a coordinate is not an array', () => {
      //Act + Assert
      expect(() => (service as any).parseCoordinates(['bad'])).toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException when a coordinate has fewer than two values', () => {
      //Act + Assert
      expect(() => (service as any).parseCoordinates([[28.2]])).toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException when a value is not a number', () => {
      //Act + Assert
      expect(() =>
        (service as any).parseCoordinates([['28.2', -25.7]]),
      ).toThrow(ServiceUnavailableException);
    });

    it('should map coordinates to LatLngDto', () => {
      //Act
      const result = (service as any).parseCoordinates([
        [28.2314, -25.7545],
        [28.232, -25.755],
      ]);

      //Assert
      expect(result).toEqual([
        { lat: -25.7545, lng: 28.2314 },
        { lat: -25.755, lng: 28.232 },
      ]);
    });
  }); //END_Test_parseCoordinates

  describe('Test_parseDistance', () => {
    it('should throw ServiceUnavailableException when value is not a number', () => {
      //Act + Assert
      expect(() => (service as any).parseDistance('120')).toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException when value is not finite', () => {
      //Act + Assert
      expect(() => (service as any).parseDistance(Infinity)).toThrow(
        ServiceUnavailableException,
      );
    });

    it('should round the value to the nearest metre', () => {
      //Act
      const result = (service as any).parseDistance(123.7);

      //Assert
      expect(result).toBe(124);
    });
  }); //END_Test_parseDistance

  describe('Test_makeAlternativeRequest', () => {
    const start = { lat: -25.7545, lng: 28.2314 };
    const end = { lat: -25.755, lng: 28.232 };

    it('should throw BadRequestException when maximumAlternatives is out of range', async () => {
      //Act + Assert
      await expect(
        (service as any).makeAlternativeRequest(start, end, 0),
      ).rejects.toThrow(BadRequestException);
      await expect(
        (service as any).makeAlternativeRequest(start, end, 6),
      ).rejects.toThrow(BadRequestException);
      await expect(
        (service as any).makeAlternativeRequest(start, end, 2.5),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return parsed JSON on a successful response', async () => {
      //Arrange
      const data = { features: [] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(data),
      });

      //Act
      const result = await (service as any).makeAlternativeRequest(
        start,
        end,
        3,
      );

      //Assert
      expect(result).toBe(data);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('geojson'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should throw GatewayTimeoutException on AbortError', async () => {
      //Arrange
      jest.useFakeTimers();
      mockFetch.mockImplementation(
        (_url: string, options: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => {
              const err = new Error('aborted');
              err.name = 'AbortError';
              reject(err);
            });
          }),
      );

      //Act
      const promise = (service as any).makeAlternativeRequest(start, end, 3);
      jest.advanceTimersByTime(100);

      //Assert
      await expect(promise).rejects.toThrow(GatewayTimeoutException);
      jest.useRealTimers();
    });

    it('should throw ServiceUnavailableException on network failure', async () => {
      //Arrange
      mockFetch.mockRejectedValue(new Error('network down'));

      //Act + Assert
      await expect(
        (service as any).makeAlternativeRequest(start, end, 3),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException on a non-OK response', async () => {
      //Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        json: jest.fn(),
      });

      //Act + Assert
      await expect(
        (service as any).makeAlternativeRequest(start, end, 3),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException on invalid JSON', async () => {
      //Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('bad json')),
      });

      //Act + Assert
      await expect(
        (service as any).makeAlternativeRequest(start, end, 3),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  }); //END_Test_makeAlternativeRequest
}); //END_StudentRoutingService
