import nodemailer from 'nodemailer';
import { env } from '../../config/env';

const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  auth: { user: env.MAIL_USER, pass: env.MAIL_PASS },
});

const sendMail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({ from: env.MAIL_FROM, to, subject, html });
};

export const mailService = {
  sendVerificationEmail: (to: string, name: string, token: string) => {
    const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    return sendMail(to, 'Verify your email',
      `<h2>Hi ${name},</h2><p>Click <a href="${url}">here</a> to verify. Expires in 24h.</p>`
    );
  },
  sendPasswordReset: (to: string, token: string) => {
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    return sendMail(to, 'Reset your password',
      `<p>Click <a href="${url}">here</a> to reset. Expires in 1h.</p>`
    );
  },

  sendWelcome: (to: string, name: string) => {
    return sendMail(
      to,
      'Welcome!',
      `<h1>Welcome ${name}!</h1><p>Thanks for signing up.</p>`
    );
  },
};
