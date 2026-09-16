import {
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { LatLngDto } from 'src/Building/dto/building.dto';

export interface ORSWalkingResult {
  routeCoordinates: LatLngDto[];
  distanceMetres: number;
} //ORSWalkingResult

export interface ORSRouteVariantResult {
  routeIndex: number;
  routeCoordinates: LatLngDto[];
  distanceMetres: number;
} //ORSRouteVariantResult

interface ORSFeature {
  geometry?: {
    coordinates?: unknown;
  };
  properties?: {
    summary?: {
      distance?: unknown;
    };
  };
} //ORSFeature

interface ORSDirectionsResponse {
  features?: ORSFeature[];
} //ORSDirectionsResponse

interface ORSAlternativeRoutesResponse {
  features?: ORSFeature[];
} //ORSAlternativeRoutesResponse

@Injectable()
export class OrsService {
  //Api
  private readonly endpoint =
    'https://api.openrouteservice.org/v2/directions/foot-walking';

  //timeout after 10 seconds
  private readonly requestTimeoutMs = 10_000;

  /**
   * Fetches a walking route between two coordinates
   *
   * @param start - Starting coordinate
   * @param end - Ending coordinate
   * @returns Route coordinates and distance in metres
   * @throws NotFoundException when the provider returns no route
   */
  async getWalkingRoute(
    start: LatLngDto,
    end: LatLngDto,
  ): Promise<ORSWalkingResult> {
    const data = await this.makeRequest(start, end);

    const feature = data.features?.[0];

    if (!feature) {
      throw new NotFoundException(
        'No walking path was found between the buildings',
      );
    }

    const coordinates = this.parseCoordinates(feature.geometry?.coordinates);

    const distanceMetres = this.parseDistance(
      feature.properties?.summary?.distance,
    );

    return {
      routeCoordinates: coordinates,
      distanceMetres,
    };
  } //END_getWalkingRoute

  async getWalkingRouteVariants(
    start: LatLngDto,
    end: LatLngDto,
    maximumAlternatives = 3,
  ): Promise<ORSRouteVariantResult[]> {
    const data = await this.makeAlternativeRequest(
      start,
      end,
      maximumAlternatives,
    );

    const features = data.features;

    if (!Array.isArray(features) || features.length === 0) {
      throw new NotFoundException(
        'No walking paths were found between the buildings',
      );
    }

    return features.map((feature, routeIndex) => ({
      routeIndex,
      routeCoordinates: this.parseCoordinates(feature.geometry?.coordinates),
      distanceMetres: this.parseDistance(feature.properties?.summary?.distance),
    }));
  } //END_getWalkingRouteVarients

  //🎅's little helpers

  /**
   * Fetch the OpenRouteService API key
   *
   * @returns The API key
   * @throws InternalServerErrorException when the key is not set
   */
  private getApiKey(): string {
    const apiKey = process.env.ORS_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException(
        'OpenRouteService API key is not configured',
      );
    }

    return apiKey;
  } //END_getApiKey

  /**
   * Fetches walking directions from OpenRouteService
   *
   * @param start - Starting coordinate
   * @param end - Ending coordinate
   * @returns The parsed directions respons
   * @throws InternalServerErrorException when the API key is missing
   * @throws GatewayTimeoutException when the request exceeds the timeout
   * @throws ServiceUnavailableException when the request fails, returns a non-OK
   *   response, or returns invalid JSON
   */
  private async makeRequest(
    start: LatLngDto,
    end: LatLngDto,
  ): Promise<ORSDirectionsResponse> {
    const apiKey = this.getApiKey();

    const url = new URL(this.endpoint);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('start', `${start.lng},${start.lat}`);
    url.searchParams.set('end', `${end.lng},${end.lat}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('OpenRouteService request timed out');
      }

      throw new ServiceUnavailableException(
        'OpenRouteService could not be reached',
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `OpenRouteService returned HTTP ${response.status}`,
      );
    }

    let data: ORSDirectionsResponse;

    try {
      data = (await response.json()) as ORSDirectionsResponse;
    } catch {
      throw new ServiceUnavailableException(
        'OpenRouteService returned invalid JSON',
      );
    }

    return data;
  } //END_makeRequest

  /**
   * Validates and maps raw route coordinates.
   *
   * @param value - Raw coordinates array from OpenRouteService.
   * @returns Coordinates as LatLngDto objects
   * @throws NotFoundException when the array is empty or not an array
   * @throws ServiceUnavailableException when any coordinate is wrong
   */
  private parseCoordinates(value: unknown): LatLngDto[] {
    //Check type
    if (!Array.isArray(value) || value.length === 0) {
      throw new NotFoundException(
        'OpenRouteService returned no route coordinates',
      );
    }

    //Return LatLngDto
    return value.map((coordinate, index) => {
      if (
        !Array.isArray(coordinate) ||
        coordinate.length < 2 ||
        typeof coordinate[0] !== 'number' ||
        typeof coordinate[1] !== 'number'
      ) {
        throw new ServiceUnavailableException(
          `OpenRouteService returned invalid coordinates at index ${index}`,
        );
      }

      const [lng, lat] = coordinate;

      return { lat, lng };
    });
  } //END_parseCoordinates

  /**
   * Validates and rounds a distance value
   *
   * @param value - Raw distance value
   * @returns The distance rounded to the nearest metre
   * @throws ServiceUnavailableException when the value is not a number
   */
  private parseDistance(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new ServiceUnavailableException(
        'OpenRouteService returned an invalid route distance',
      );
    }

    return Math.round(value);
  } //parseDistance

  private async makeAlternativeRequest(
    start: LatLngDto,
    end: LatLngDto,
    maximumAlternatives: number,
  ): Promise<ORSAlternativeRoutesResponse> {
    if (
      !Number.isInteger(maximumAlternatives) ||
      maximumAlternatives < 1 ||
      maximumAlternatives > 5
    ) {
      throw new BadRequestException(
        'maximumAlternatives must be an integer between 1 and 5',
      );
    }

    const apiKey = this.getApiKey();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    let response: Response;

    try {
      response = await fetch(
        'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
        {
          method: 'POST',
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: [
              [start.lng, start.lat],
              [end.lng, end.lat],
            ],
            alternative_routes: {
              target_count: maximumAlternatives,
              weight_factor: 1.4,
              share_factor: 0.6,
            },
          }),
          signal: controller.signal,
        },
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException(
          'OpenRouteService alternative request timed out',
        );
      }

      throw new ServiceUnavailableException(
        'OpenRouteService could not be reached',
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `OpenRouteService returned HTTP ${response.status}`,
      );
    }

    try {
      return (await response.json()) as ORSAlternativeRoutesResponse;
    } catch {
      throw new ServiceUnavailableException(
        'OpenRouteService returned invalid JSON',
      );
    }
  } //END_makeAlternativeRequest
} //END_OrsService
