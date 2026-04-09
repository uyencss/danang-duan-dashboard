import nodemailer from 'nodemailer';
import { logger } from './logger';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async ({ to, subject, html, text }: SendEmailOptions) => {
  const emailLogger = logger.child({ module: 'email', to, subject });
  
  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    
    // Ensure at least one body format is provided
    if (!html && !text) {
      throw new Error('Email body (html or text) is required');
    }

    const info = await transporter.sendMail({
      from: `"GPS Danang Dashboard" <${from}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html,
    });

    emailLogger.info({ msg: 'Message sent', messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    emailLogger.error({ msg: 'Error sending email', err: error instanceof Error ? error.message : error });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
