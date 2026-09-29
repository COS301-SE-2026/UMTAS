import { MailerService } from './mailer.service';

describe('MailerService', () => {
  let mailerService: MailerService;
  let mockNestMailer: {
    sendMail: jest.Mock;
    transporter: { verify: jest.Mock };
  };

  beforeEach(() => {
    mockNestMailer = {
      sendMail: jest.fn().mockResolvedValue(undefined),
      transporter: { verify: jest.fn().mockResolvedValue(undefined) },
    };
    mailerService = new MailerService(mockNestMailer as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  //verify
  describe('Test_verify', () => {
    it('should call transporter.verify when available', async () => {
      //Act
      await mailerService.verify();

      //Assert
      expect(mockNestMailer.transporter.verify).toHaveBeenCalledTimes(1);
    });

    it('should skip when transporter.verify is not a function', async () => {
      //Arrange
      (mailerService as any).mailerService = { transporter: {} };

      //Act + Assert
      await expect(mailerService.verify()).resolves.toBeUndefined();
    });

    it('should swallow errors when transporter.verify rejects', async () => {
      //Arrange
      mockNestMailer.transporter.verify.mockRejectedValue(
        new Error('SMTP down'),
      );

      //Act + Assert
      await expect(mailerService.verify()).resolves.toBeUndefined();
    });
  }); //END_Test_verify

  //sendMail
  describe('Test_sendMail', () => {
    it('should send a template email', async () => {
      //Act
      await mailerService.sendMail({
        to: 'test@example.com',
        subject: 'Subject',
        template: 'reset-password',
        context: { name: 'User' },
      });

      //Assert
      expect(mockNestMailer.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Subject',
        template: 'reset-password',
        context: { name: 'User' },
      });
    });

    it('should send an HTML email when template is absent', async () => {
      //Act
      await mailerService.sendMail({
        to: 'test@example.com',
        subject: 'Subject',
        html: '<p>Hello</p>',
      });

      //Assert
      expect(mockNestMailer.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Subject',
        html: '<p>Hello</p>',
      });
    });

    it('should fall back to text when neither template nor html is provided', async () => {
      //Act
      await mailerService.sendMail({
        to: 'test@example.com',
        subject: 'Subject',
        text: 'plain text',
      });

      //Assert
      expect(mockNestMailer.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Subject',
        text: 'plain text',
      });
    });

    it('should use subject as text when text is absent', async () => {
      //Act
      await mailerService.sendMail({
        to: 'test@example.com',
        subject: 'Fallback Subject',
      });

      //Assert
      expect(mockNestMailer.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Fallback Subject',
        text: 'Fallback Subject',
      });
    });

    it('should swallow send failures', async () => {
      //Arrange
      mockNestMailer.sendMail.mockRejectedValue(new Error('SMTP down'));

      //Act + Assert
      await expect(
        mailerService.sendMail({
          to: 'test@example.com',
          subject: 'Subject',
        }),
      ).resolves.toBeUndefined();
    });

    it('should swallow non-Error failures', async () => {
      //Arrange
      mockNestMailer.sendMail.mockRejectedValue('string error');

      //Act + Assert
      await expect(
        mailerService.sendMail({
          to: 'test@example.com',
          subject: 'Subject',
        }),
      ).resolves.toBeUndefined();
    });
  }); //END_Test_sendMail

  //sendTemplateMail
  describe('Test_sendTemplateMail', () => {
    it('should delegate to sendMail with the same options', async () => {
      //Arrange
      const spy = jest
        .spyOn(mailerService, 'sendMail')
        .mockResolvedValue(undefined);

      //Act
      await mailerService.sendTemplateMail({
        to: 'test@example.com',
        subject: 'Subject',
        template: 'verify-email',
        context: { name: 'User' },
      });

      //Assert
      expect(spy).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Subject',
        template: 'verify-email',
        context: { name: 'User' },
      });
    });
  }); //END_Test_sendTemplateMail

  // sendVerificationEmail
  describe('Test_sendVerificationEmail', () => {
    it('should delegate to sendTemplateMail with the verification template', async () => {
      //Arrange
      const spy = jest
        .spyOn(mailerService, 'sendTemplateMail')
        .mockResolvedValue(undefined);

      //Act
      await mailerService.sendVerificationEmail({
        email: 'test@example.com',
        name: 'Test User',
        url: 'https://example.com/verify-email',
      });

      //Assert
      expect(spy).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Verify your UMTAS account',
        template: 'verify-email',
        context: {
          name: 'Test User',
          verifyUrl: 'https://example.com/verify-email',
        },
      });
    });
  }); //END_Test_sendVerificationEmail

  //sendResetPasswordEmail
  describe('Test_sendResetPasswordEmail', () => {
    it('should delegate to sendTemplateMail with default 1h expiry', async () => {
      //Arrange
      const spy = jest
        .spyOn(mailerService, 'sendTemplateMail')
        .mockResolvedValue(undefined);

      //Act
      await mailerService.sendResetPasswordEmail({
        email: 'test@example.com',
        name: 'Test User',
        url: 'https://example.com/reset',
      });

      //Assert
      expect(spy).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Reset your UMTAS password',
        template: 'reset-password',
        context: {
          name: 'Test User',
          resetUrl: 'https://example.com/reset',
          expiresInHours: 1,
        },
      });
    });

    it('should use the provided expiresInHours when given', async () => {
      //Arrange
      const spy = jest
        .spyOn(mailerService, 'sendTemplateMail')
        .mockResolvedValue(undefined);

      //Act
      await mailerService.sendResetPasswordEmail({
        email: 'test@example.com',
        name: 'Test User',
        url: 'https://example.com/reset',
        expiresInHours: 24,
      });

      //Assert
      expect(spy).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Reset your UMTAS password',
        template: 'reset-password',
        context: {
          name: 'Test User',
          resetUrl: 'https://example.com/reset',
          expiresInHours: 24,
        },
      });
    });
  }); //END_Test_sendResetPasswordEmail
}); //END_MailerService
