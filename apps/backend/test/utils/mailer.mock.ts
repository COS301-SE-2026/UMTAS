export function createMockMailer() {
  const sent: any[] = [];

  const sendMail = jest.fn(async (options: any) => {
    sent.push(options);
    return Promise.resolve(true);
  });

  const sendTemplateMail = jest.fn(async (opts: any) => {
    // mirror shape MailerService.sendTemplateMail expects
    const envelope = {
      template: opts.template,
      subject: opts.subject,
      to: opts.to,
      context: opts.context || {},
    };
    sent.push(envelope);
    return Promise.resolve(true);
  });

  const sendVerificationEmail = jest.fn(async (input: any) => {
    const envelope = {
      template: 'verify-email',
      subject: 'Verify your UMTAS account',
      to: input.email,
      context: { name: input.name, verifyUrl: input.url },
    };
    sent.push(envelope);
    return Promise.resolve(true);
  });

  const sendResetPasswordEmail = jest.fn(async (input: any) => {
    const envelope = {
      template: 'reset-password',
      subject: 'Reset your UMTAS password',
      to: input.email,
      context: { name: input.name, resetUrl: input.url, expiresInHours: 1 },
    };
    sent.push(envelope);
    return Promise.resolve(true);
  });

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
