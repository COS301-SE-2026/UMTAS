import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { PostHog } from 'posthog-node';

@Global()
@Module({
  providers: [
    {
      provide: PostHog,
      useFactory: () =>
        new PostHog(process.env.POSTHOG_K!, {
          host: process.env.POSTHOG_H ?? 'https://eu.i.posthog.com',
        }),
    },
  ],
  exports: [PostHog],
})
export class PostHogModule implements OnApplicationShutdown {
  constructor(private readonly posthog: PostHog) {}

  async onApplicationShutdown() {
    await this.posthog.shutdown();
  }
}
