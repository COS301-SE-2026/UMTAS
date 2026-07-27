import { MailerService } from './mailer.service';

describe('MailerService', () => {
  it('sends password reset email', async () => {
    const mailerService = new MailerService({} as any);
    const sendMailSpy = jest
      .spyOn(mailerService, 'sendMail')
      .mockResolvedValue();

    await mailerService.sendMail({
      to: 'test@example.com',
      subject: 'Password Reset',
      template: 'reset-password',
      context: {
        name: 'Test User',
        resetUrl: 'https://example.com/reset-password',
      },
    });

    expect(sendMailSpy).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Password Reset',
      template: 'reset-password',
      context: {
        name: 'Test User',
        resetUrl: 'https://example.com/reset-password',
      },
    });
  });

  it('sends verification email', async () => {
    const mailerService = new MailerService({} as any);
    const sendTemplateMailSpy = jest
      .spyOn(mailerService, 'sendTemplateMail')
      .mockResolvedValue();

    await mailerService.sendVerificationEmail({
      email: 'test@example.com',
      name: 'Test User',
      url: 'https://example.com/verify-email',
    });

    expect(sendTemplateMailSpy).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Verify your UMTAS account',
      template: 'verify-email',
      context: {
        name: 'Test User',
        verifyUrl: 'https://example.com/verify-email',
      },
    });
  });
});
