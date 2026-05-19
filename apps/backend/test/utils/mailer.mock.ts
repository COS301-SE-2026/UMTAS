export interface MockMailEnvelope {
  template?: string;
  subject?: string;
  to?: string;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

export function createMockMailer() {
  const sent: MockMailEnvelope[] = [];

  const sendMail = jest.fn((options: MockMailEnvelope) => {
    sent.push(options);
    return Promise.resolve(true);
  });

  const sendTemplateMail = jest.fn((opts: MockMailEnvelope) => {
    // mirror shape MailerService.sendTemplateMail expects
    const envelope: MockMailEnvelope = {
      template: opts.template,
      subject: opts.subject,
      to: opts.to,
      context: opts.context || {},
    };
    sent.push(envelope);
    return Promise.resolve(true);
  });

  const sendVerificationEmail = jest.fn(
    (input: { email: string; name: string; url: string }) => {
      const envelope: MockMailEnvelope = {
        template: 'verify-email',
        subject: 'Verify your UMTAS account',
        to: input.email,
        context: { name: input.name, verifyUrl: input.url },
      };
      sent.push(envelope);
      return Promise.resolve(true);
    },
  );

  const sendResetPasswordEmail = jest.fn(
    (input: { email: string; name: string; url: string }) => {
      const envelope: MockMailEnvelope = {
        template: 'reset-password',
        subject: 'Reset your UMTAS password',
        to: input.email,
        context: { name: input.name, resetUrl: input.url, expiresInHours: 1 },
      };
      sent.push(envelope);
      return Promise.resolve(true);
    },
  );

  return {
    sendMail,
    sendTemplateMail,
    sendVerificationEmail,
    sendResetPasswordEmail,
    getSent: () => sent,
    clear: () => {
      sent.length = 0;
    },
  };
}
