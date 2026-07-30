const DEFAULT_MAILHOG_URL = 'http://mailhog:8025';

type MailHogSearchResult = {
  readonly items?: Array<{
    readonly Content?: { readonly Body?: string };
    readonly Raw?: { readonly Data?: string };
  }>;
};

export async function waitForVerificationToken(
  email: string,
  timeoutMs = 30_000,
): Promise<string> {
  const mailhogUrl = process.env.FULL_STACK_MAILHOG_URL ?? DEFAULT_MAILHOG_URL;
  const deadline = performance.now() + timeoutMs;
  let lastResponse = '';

  while (performance.now() < deadline) {
    const response = await fetch(
      `${mailhogUrl}/api/v2/search?kind=to&query=${encodeURIComponent(email)}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (response.ok) {
      const result = (await response.json()) as MailHogSearchResult;
      for (const message of result.items ?? []) {
        const body = decodeMailBody(
          message.Content?.Body ?? message.Raw?.Data ?? '',
        );
        lastResponse = body;
        const match = body.match(/[?&]token=([^&\s"'<>]+)/);
        if (match) return decodeURIComponent(match[1]);
      }
    } else {
      lastResponse = `${response.status} ${await response.text()}`;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(
    `Verification email did not arrive for ${email}. Last MailHog response: ${lastResponse}`,
  );
}

function decodeMailBody(body: string): string {
  return body
    .replace(/=\r?\n/g, '')
    .replace(/=3D/gi, '=')
    .replace(/&amp;/g, '&');
}
