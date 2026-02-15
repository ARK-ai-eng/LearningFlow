import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// E-Mail-Konfiguration aus Environment Variables
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'; // true für Port 465, false für andere Ports
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@aismarterflow.com';
const EMAIL_TO = process.env.EMAIL_TO || 'info@aismarterflow.com';

// Transporter-Instanz (wird lazy initialisiert)
let transporter: Transporter | null = null;

/**
 * Initialisiert den Nodemailer Transporter
 */
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Prüft ob SMTP-Konfiguration vorhanden ist
 */
export function isEmailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

/**
 * Sendet eine Kontaktformular-E-Mail
 */
export async function sendContactEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Prüfe ob E-Mail konfiguriert ist
    if (!isEmailConfigured()) {
      console.warn('[Email] SMTP not configured, logging to console instead');
      console.log('[Contact Form]', {
        from: params.email,
        name: params.name,
        subject: params.subject,
        message: params.message,
        timestamp: new Date().toISOString(),
      });
      return { success: true }; // Erfolg zurückgeben, auch wenn nur geloggt wurde
    }

    const transport = getTransporter();

    // HTML-Template für die E-Mail
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #374151; margin-bottom: 5px; }
            .value { background: white; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🎓 LearningFlow Kontaktanfrage</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${params.name}</div>
              </div>
              <div class="field">
                <div class="label">E-Mail:</div>
                <div class="value"><a href="mailto:${params.email}">${params.email}</a></div>
              </div>
              <div class="field">
                <div class="label">Betreff:</div>
                <div class="value">${params.subject}</div>
              </div>
              <div class="field">
                <div class="label">Nachricht:</div>
                <div class="value" style="white-space: pre-wrap;">${params.message}</div>
              </div>
              <div class="field">
                <div class="label">Zeitstempel:</div>
                <div class="value">${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</div>
              </div>
            </div>
            <div class="footer">
              <p>Diese E-Mail wurde über das Kontaktformular auf LearningFlow gesendet.</p>
              <p>© ${new Date().getFullYear()} LearningFlow - Eine Marke der AISmarterFlow UG (haftungsbeschränkt)</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Plain-Text-Version für E-Mail-Clients ohne HTML-Unterstützung
    const textContent = `
LearningFlow Kontaktanfrage

Name: ${params.name}
E-Mail: ${params.email}
Betreff: ${params.subject}

Nachricht:
${params.message}

---
Zeitstempel: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}
Diese E-Mail wurde über das Kontaktformular auf LearningFlow gesendet.
    `.trim();

    // E-Mail senden
    const info = await transport.sendMail({
      from: `"LearningFlow" <${EMAIL_FROM}>`,
      to: EMAIL_TO,
      replyTo: params.email, // Antwort geht direkt an den Absender
      subject: `Kontaktanfrage: ${params.subject}`,
      text: textContent,
      html: htmlContent,
    });

    console.log('[Email] Contact form email sent:', info.messageId);
    return { success: true };

  } catch (error) {
    console.error('[Email] Failed to send contact form email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Testet die E-Mail-Konfiguration
 */
export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isEmailConfigured()) {
      return { success: false, error: 'SMTP not configured' };
    }

    const transport = getTransporter();
    await transport.verify();
    console.log('[Email] SMTP connection verified successfully');
    return { success: true };

  } catch (error) {
    console.error('[Email] SMTP connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
