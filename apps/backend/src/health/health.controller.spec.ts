import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('readiness', () => {
  const check = jest.fn();
  const controller = new HealthController({
    check,
  } as unknown as HealthService);

  it.each(['database', 'redis'])(
    'returns 503 when %s is unavailable',
    async (dependency) => {
      check.mockResolvedValue({
        status: 'degraded',
        services: { database: 'ok', redis: 'ok', [dependency]: 'error' },
      });
      await expect(controller.ready()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    },
  );

  it('accepts ready dependencies even when optional mail is degraded', async () => {
    const result = {
      status: 'degraded',
      services: { database: 'ok', redis: 'ok', mailer: 'error' },
    };
    check.mockResolvedValue(result);
    await expect(controller.ready()).resolves.toEqual(result);
    expect(controller.liveness()).toEqual({ status: 'ok' });
  });
});
