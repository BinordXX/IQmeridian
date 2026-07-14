import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  createTransport,
  type SendMailOptions,
  type Transporter,
} from 'nodemailer';

type EmailDeliveryMode = 'console' | 'smtp';

type EmailAddress = {
  email: string;
  name?: string | null;
};

type SendTransactionalEmailInput = {
  to: EmailAddress;
  subject: string;
  text: string;
  html: string;
  replyTo?: string | null;
};

type EmailDeliveryResult = {
  mode: EmailDeliveryMode;
  messageId?: string | null;
  accepted?: string[];
  rejected?: string[];
};

type VerificationEmailInput = {
  to: EmailAddress;
  verificationCode: string;
  verificationUrl?: string | null;
  expiresInMinutes?: number;
};

type PasswordResetEmailInput = {
  to: EmailAddress;
  resetCode?: string | null;
  resetUrl?: string | null;
  expiresInMinutes?: number;
};

type OrganisationAdminInvitationEmailInput = {
  to: EmailAddress;
  organisationName: string;
  invitationUrl: string;
  expiresAt: Date;
};

type CandidateInvitationEmailInput = {
  to: EmailAddress;
  organisationName?: string | null;
  campaignName?: string | null;
  invitationUrl: string;
  expiresAt?: Date | null;
};

type CandidateInvitationExtendedEmailInput = {
  to: EmailAddress;
  organisationName?: string | null;
  campaignName?: string | null;
  invitationUrl: string;
  expiresAt: Date;
};

type CandidateInvitationCancelledEmailInput = {
  to: EmailAddress;
  organisationName?: string | null;
  campaignName?: string | null;
};

@Injectable()
export class EmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  async onModuleDestroy() {
    if (this.transporter) {
      this.transporter.close();
    }
  }

  async onModuleInit() {
    const mode = this.getDeliveryMode();

    if (mode === 'smtp') {
      const transporter = this.getSmtpTransporter();

      await transporter.verify();

      this.logger.log('SMTP transporter verified successfully.');
      return;
    }

    this.logger.warn(
      'Email delivery is running in console mode. Real emails will not be sent.',
    );
  }

  async sendVerificationEmail(
    input: VerificationEmailInput,
  ): Promise<EmailDeliveryResult> {
    const expiresInMinutes = input.expiresInMinutes ?? 15;

    const safeCode = this.escapeHtml(input.verificationCode);
    const safeUrl = input.verificationUrl
      ? this.escapeHtml(input.verificationUrl)
      : null;

    const actionHtml = safeUrl
      ? `<p><a href="${safeUrl}" style="${this.buttonStyle()}">Verify email address</a></p>`
      : '';

    const html = this.buildHtmlDocument({
      title: 'Verify your IQMeridian email address',
      preview:
        'Use the verification code to complete your IQMeridian registration.',
      body: `
        <p>Hello${this.getNameSuffix(input.to.name)},</p>
        <p>Use the verification code below to complete your IQMeridian registration.</p>
        <div style="${this.codeBoxStyle()}">${safeCode}</div>
        ${actionHtml}
        <p>This code expires in ${expiresInMinutes} minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });

    const text = [
      `Hello${this.getNameSuffix(input.to.name)},`,
      '',
      'Use this verification code to complete your IQMeridian registration:',
      input.verificationCode,
      '',
      input.verificationUrl
        ? `Verification link: ${input.verificationUrl}`
        : undefined,
      `This code expires in ${expiresInMinutes} minutes.`,
      '',
      'If you did not request this, you can ignore this email.',
    ]
      .filter(Boolean)
      .join('\n');

    return this.sendTransactionalEmail({
      to: input.to,
      subject: 'Verify your IQMeridian email address',
      text,
      html,
    });
  }

  async sendPasswordResetEmail(
    input: PasswordResetEmailInput,
  ): Promise<EmailDeliveryResult> {
    const expiresInMinutes = input.expiresInMinutes ?? 15;

    const safeResetUrl = input.resetUrl
      ? this.escapeHtml(input.resetUrl)
      : null;
    const safeResetCode = input.resetCode
      ? this.escapeHtml(input.resetCode)
      : null;

    const linkHtml = safeResetUrl
      ? `<p><a href="${safeResetUrl}" style="${this.buttonStyle()}">Reset password</a></p>`
      : '';

    const codeHtml = safeResetCode
      ? `<div style="${this.codeBoxStyle()}">${safeResetCode}</div>`
      : '';

    const html = this.buildHtmlDocument({
      title: 'Reset your IQMeridian password',
      preview: 'Use this secure reset request to change your password.',
      body: `
        <p>Hello${this.getNameSuffix(input.to.name)},</p>
        <p>A password reset was requested for your IQMeridian account.</p>
        ${linkHtml}
        ${codeHtml}
        <p>This reset request expires in ${expiresInMinutes} minutes.</p>
        <p>If you did not request this reset, ignore this email and keep your password unchanged.</p>
      `,
    });

    const text = [
      `Hello${this.getNameSuffix(input.to.name)},`,
      '',
      'A password reset was requested for your IQMeridian account.',
      input.resetUrl ? `Reset link: ${input.resetUrl}` : undefined,
      input.resetCode ? `Reset code: ${input.resetCode}` : undefined,
      `This reset request expires in ${expiresInMinutes} minutes.`,
      '',
      'If you did not request this reset, ignore this email and keep your password unchanged.',
    ]
      .filter(Boolean)
      .join('\n');

    return this.sendTransactionalEmail({
      to: input.to,
      subject: 'Reset your IQMeridian password',
      text,
      html,
    });
  }

  async sendOrganisationAdminInvitationEmail(
    input: OrganisationAdminInvitationEmailInput,
  ): Promise<EmailDeliveryResult> {
    const safeOrganisationName = this.escapeHtml(input.organisationName);
    const safeInvitationUrl = this.escapeHtml(input.invitationUrl);

    const html = this.buildHtmlDocument({
      title: 'Your IQMeridian employer-admin invitation',
      preview: `You have been invited to administer ${input.organisationName} on IQMeridian.`,
      body: `
        <p>Hello${this.getNameSuffix(input.to.name)},</p>
        <p>You have been invited to become an employer administrator for <strong>${safeOrganisationName}</strong> on IQMeridian.</p>
        <p><a href="${safeInvitationUrl}" style="${this.buttonStyle()}">Accept employer-admin invitation</a></p>
        <p>This invitation expires on ${this.formatDate(input.expiresAt)}.</p>
        <p>If you were not expecting this invitation, ignore this email.</p>
      `,
    });

    const text = [
      `Hello${this.getNameSuffix(input.to.name)},`,
      '',
      `You have been invited to become an employer administrator for ${input.organisationName} on IQMeridian.`,
      '',
      `Accept invitation: ${input.invitationUrl}`,
      '',
      `This invitation expires on ${this.formatDate(input.expiresAt)}.`,
      '',
      'If you were not expecting this invitation, ignore this email.',
    ].join('\n');

    return this.sendTransactionalEmail({
      to: input.to,
      subject: `IQMeridian employer-admin invitation for ${input.organisationName}`,
      text,
      html,
    });
  }

  async sendCandidateInvitationEmail(
    input: CandidateInvitationEmailInput,
  ): Promise<EmailDeliveryResult> {
    const organisationName = input.organisationName ?? 'an organisation';
    const campaignName = input.campaignName ?? 'an assessment campaign';

    const safeOrganisationName = this.escapeHtml(organisationName);
    const safeCampaignName = this.escapeHtml(campaignName);
    const safeInvitationUrl = this.escapeHtml(input.invitationUrl);

    const expiryText = input.expiresAt
      ? `This invitation expires on ${this.formatDate(input.expiresAt)}.`
      : 'Follow the link when you are ready to begin.';

    const html = this.buildHtmlDocument({
      title: 'Your IQMeridian assessment invitation',
      preview: `You have been invited to complete ${campaignName}.`,
      body: `
        <p>Hello${this.getNameSuffix(input.to.name)},</p>
        <p>You have been invited by <strong>${safeOrganisationName}</strong> to complete <strong>${safeCampaignName}</strong> on IQMeridian.</p>
        <p><a href="${safeInvitationUrl}" style="${this.buttonStyle()}">Open assessment invitation</a></p>
        <p>${this.escapeHtml(expiryText)}</p>
        <p>If you were not expecting this invitation, contact the organisation before proceeding.</p>
      `,
    });

    const text = [
      `Hello${this.getNameSuffix(input.to.name)},`,
      '',
      `You have been invited by ${organisationName} to complete ${campaignName} on IQMeridian.`,
      '',
      `Open invitation: ${input.invitationUrl}`,
      '',
      expiryText,
      '',
      'If you were not expecting this invitation, contact the organisation before proceeding.',
    ].join('\n');

    return this.sendTransactionalEmail({
      to: input.to,
      subject: `IQMeridian assessment invitation: ${campaignName}`,
      text,
      html,
    });
  }

  async sendCandidateInvitationExtendedEmail(
    input: CandidateInvitationExtendedEmailInput,
  ): Promise<EmailDeliveryResult> {
    const organisationName = input.organisationName ?? 'an organisation';
    const campaignName = input.campaignName ?? 'an assessment campaign';

    const safeOrganisationName = this.escapeHtml(organisationName);
    const safeCampaignName = this.escapeHtml(campaignName);
    const safeInvitationUrl = this.escapeHtml(input.invitationUrl);
    const safeExpiresAt = this.escapeHtml(this.formatDate(input.expiresAt));

    const html = this.buildHtmlDocument({
      title: 'Your IQMeridian assessment invitation was extended',
      preview: `Your invitation for ${campaignName} has been extended.`,
      body: `
        <p>Hello${this.getNameSuffix(input.to.name)},</p>
        <p>Your invitation from <strong>${safeOrganisationName}</strong> to complete <strong>${safeCampaignName}</strong> on IQMeridian has been extended.</p>
        <p><a href="${safeInvitationUrl}" style="${this.buttonStyle()}">Open assessment invitation</a></p>
        <p>The invitation now expires on ${safeExpiresAt}.</p>
        <p>If you were not expecting this invitation, contact the organisation before proceeding.</p>
      `,
    });

    const text = [
      `Hello${this.getNameSuffix(input.to.name)},`,
      '',
      `Your invitation from ${organisationName} to complete ${campaignName} on IQMeridian has been extended.`,
      '',
      `Open invitation: ${input.invitationUrl}`,
      '',
      `The invitation now expires on ${this.formatDate(input.expiresAt)}.`,
      '',
      'If you were not expecting this invitation, contact the organisation before proceeding.',
    ].join('\n');

    return this.sendTransactionalEmail({
      to: input.to,
      subject: `IQMeridian assessment invitation extended: ${campaignName}`,
      text,
      html,
    });
  }

  async sendCandidateInvitationCancelledEmail(
    input: CandidateInvitationCancelledEmailInput,
  ): Promise<EmailDeliveryResult> {
    const organisationName = input.organisationName ?? 'an organisation';
    const campaignName = input.campaignName ?? 'an assessment campaign';

    const safeOrganisationName = this.escapeHtml(organisationName);
    const safeCampaignName = this.escapeHtml(campaignName);

    const html = this.buildHtmlDocument({
      title: 'Your IQMeridian assessment invitation was cancelled',
      preview: `Your invitation for ${campaignName} has been cancelled.`,
      body: `
        <p>Hello${this.getNameSuffix(input.to.name)},</p>
        <p>Your invitation from <strong>${safeOrganisationName}</strong> to complete <strong>${safeCampaignName}</strong> on IQMeridian has been cancelled.</p>
        <p>The previous invitation link will no longer allow you to claim or begin this assessment.</p>
        <p>If you believe this was a mistake, contact the organisation that invited you.</p>
      `,
    });

    const text = [
      `Hello${this.getNameSuffix(input.to.name)},`,
      '',
      `Your invitation from ${organisationName} to complete ${campaignName} on IQMeridian has been cancelled.`,
      '',
      'The previous invitation link will no longer allow you to claim or begin this assessment.',
      '',
      'If you believe this was a mistake, contact the organisation that invited you.',
    ].join('\n');

    return this.sendTransactionalEmail({
      to: input.to,
      subject: `IQMeridian assessment invitation cancelled: ${campaignName}`,
      text,
      html,
    });
  }

  async sendTransactionalEmail(
    input: SendTransactionalEmailInput,
  ): Promise<EmailDeliveryResult> {
    const mode = this.getDeliveryMode();
    const from = this.getFromAddress();
    const replyTo = input.replyTo ?? process.env.TRANSACTIONAL_EMAIL_REPLY_TO;

    const mailOptions: SendMailOptions = {
      from,
      to: this.formatAddress(input.to),
      replyTo: replyTo || undefined,
      subject: input.subject,
      text: input.text,
      html: input.html,
    };

    if (mode === 'console') {
      this.logConsoleEmail(mailOptions);

      return {
        mode,
        messageId: null,
        accepted: [this.formatAddress(input.to)],
        rejected: [],
      };
    }

    const transporter = this.getSmtpTransporter();
    const result = await transporter.sendMail(mailOptions);

    return {
      mode,
      messageId: result.messageId,
      accepted: this.toStringArray(result.accepted),
      rejected: this.toStringArray(result.rejected),
    };
  }

  private getDeliveryMode(): EmailDeliveryMode {
    const configuredMode =
      process.env.EMAIL_DELIVERY_MODE?.trim().toLowerCase();
    const isProduction = process.env.NODE_ENV === 'production';

    if (configuredMode === 'smtp') {
      return 'smtp';
    }

    if (configuredMode === 'console' && !isProduction) {
      return 'console';
    }

    if (!configuredMode && !isProduction) {
      return 'console';
    }

    throw new Error(
      'EMAIL_DELIVERY_MODE=smtp is required outside local development.',
    );
  }

  private getSmtpTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.SMTP_HOST?.trim();
    const rawPort = process.env.SMTP_PORT?.trim();
    const port = rawPort ? Number(rawPort) : 587;
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASSWORD;

    if (!host) {
      throw new Error('SMTP_HOST is required when EMAIL_DELIVERY_MODE=smtp.');
    }

    if (!Number.isInteger(port) || port <= 0) {
      throw new Error('SMTP_PORT must be a valid positive number.');
    }

    if (!user) {
      throw new Error('SMTP_USER is required when EMAIL_DELIVERY_MODE=smtp.');
    }

    if (!pass) {
      throw new Error(
        'SMTP_PASSWORD is required when EMAIL_DELIVERY_MODE=smtp.',
      );
    }

    this.transporter = createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  private getFromAddress() {
    const email =
      process.env.SMTP_FROM_EMAIL ??
      process.env.TRANSACTIONAL_EMAIL_FROM ??
      'no-reply@iqmeridian.local';

    const name =
      process.env.SMTP_FROM_NAME ??
      process.env.TRANSACTIONAL_EMAIL_FROM_NAME ??
      'IQMeridian';

    return this.formatAddress({
      email,
      name,
    });
  }

  private formatAddress(address: EmailAddress) {
    const email = address.email.trim();
    const name = address.name?.trim();

    if (!name) {
      return email;
    }

    return `"${name.replace(/"/g, '\\"')}" <${email}>`;
  }

  private buildHtmlDocument(input: {
    title: string;
    preview: string;
    body: string;
  }) {
    return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${this.escapeHtml(input.title)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;background:#020817;color:#e5e7eb;font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
      ${this.escapeHtml(input.preview)}
    </span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#020817;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border:1px solid rgba(34,211,238,0.18);border-radius:24px;background:#07142f;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 18px 28px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0;color:#67e8f9;font-size:12px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;">IQMeridian</p>
                <h1 style="margin:12px 0 0 0;color:#ffffff;font-size:26px;line-height:1.2;font-weight:900;">${this.escapeHtml(input.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:#cbd5e1;font-size:15px;line-height:1.7;">
                ${input.body}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 28px 28px;color:#64748b;font-size:12px;line-height:1.6;border-top:1px solid rgba(255,255,255,0.08);">
                This is an automated IQMeridian email. Do not share verification, reset, or invitation links with anyone else.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private buttonStyle() {
    return [
      'display:inline-block',
      'background:rgba(34,211,238,0.14)',
      'border:1px solid rgba(34,211,238,0.35)',
      'border-radius:14px',
      'color:#cffafe',
      'font-weight:800',
      'padding:12px 18px',
      'text-decoration:none',
    ].join(';');
  }

  private codeBoxStyle() {
    return [
      'display:inline-block',
      'margin:12px 0',
      'background:rgba(255,255,255,0.06)',
      'border:1px solid rgba(255,255,255,0.12)',
      'border-radius:16px',
      'color:#ffffff',
      'font-size:28px',
      'font-weight:900',
      'letter-spacing:0.18em',
      'padding:14px 18px',
    ].join(';');
  }

  private getNameSuffix(name?: string | null) {
    const trimmedName = name?.trim();

    return trimmedName ? ` ${trimmedName}` : '';
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(value);
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private toStringArray(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => String(item));
  }

  private logConsoleEmail(mailOptions: SendMailOptions) {
    this.logger.log('Transactional email generated in console mode.');
    this.logger.log(`To: ${String(mailOptions.to ?? '')}`);
    this.logger.log(`Subject: ${mailOptions.subject ?? ''}`);
    this.logger.log(`Text:\n${mailOptions.text ?? ''}`);
  }
}
