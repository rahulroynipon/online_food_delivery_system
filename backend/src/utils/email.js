import nodemailer from 'nodemailer';
import env from '../config/env.js';

// Configure SMTP Transporter
const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  auth: {
    user: env.email.user,
    pass: env.email.pass,
  },
});

/**
 * Sends a generic email notification.
 * @param {Object} options - Email parameters
 * @param {string} options.to - Receiver email address
 * @param {string} options.subject - Email subject line
 * @param {string} [options.text] - Plain text email body
 * @param {string} [options.html] - HTML formatted email body
 * @returns {Promise<Object>} Sent message details
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: env.email.from,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[Mailer] Error sending email:', error);
    throw error;
  }
};

/**
 * Sends an email verification / confirmation email.
 * @param {string} to - Receiver email address
 * @param {string} name - Receiver name
 * @param {string} confirmUrl - Verification endpoint URL
 * @returns {Promise<Object>} Sent message details
 */
export const sendVerificationEmail = async (to, name, confirmUrl) => {
  const subject = 'Confirm Your Email Address';
  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #ea580c; text-align: center;">Welcome to Online Food Delivery!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering on our platform. Please confirm your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmUrl}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Confirm Email Address</a>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${confirmUrl}" style="color: #ea580c; word-break: break-all;">${confirmUrl}</a></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">This is an automated email. Please do not reply directly to this message.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Hello ${name},\n\nPlease confirm your email by visiting: ${confirmUrl}`,
  });
};
