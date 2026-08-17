import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const apiKey =
      (request.headers['x-api-key'] as string) ||
      request.headers['authorization']?.replace('Bearer ', '') ||
      request.headers['authorization']?.replace('bearer ', '');

    const expectedApiKey = process.env.SIMULATION_API_KEY;

    if (!expectedApiKey) {
      throw new UnauthorizedException('SIMULATION_API_KEY is not configured');
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  } //END_canActivate
}
