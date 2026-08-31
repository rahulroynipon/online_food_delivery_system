import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import env from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const faviconPath = path.join(__dirname, '../../../frontend/public/favicon.svg');

// Configure SMTP Transporter
const transportConfig = (env.email.host && env.email.host.includes('gmail'))
  ? {
      service: 'gmail',
      auth: {
        user: env.email.user,
        pass: env.email.pass,
      },
    }
  : {
      host: env.email.host,
      port: env.email.port,
      auth: {
        user: env.email.user,
        pass: env.email.pass,
      },
    };

const transporter = nodemailer.createTransport(transportConfig);

/**
 * Sends a generic email notification.
 * @param {Object} options - Email parameters
 * @param {string} options.to - Receiver email address
 * @param {string} options.subject - Email subject line
 * @param {string} [options.text] - Plain text email body
 * @param {string} [options.html] - HTML formatted email body
 * @returns {Promise<Object>} Sent message details
 */
export const sendEmail = async ({ to, subject, text, html, attachments }) => {
  const mailOptions = {
    from: env.email.from,
    to,
    subject,
    text,
    html,
    attachments,
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

/**
 * Sends a confirmation email to a newly applied Restaurant or Rider.
 * @param {string} to - Receiver email address
 * @param {string} name - Receiver name
 * @param {'restaurant' | 'rider'} type - Onboarding type
 * @returns {Promise<Object>} Sent message details
 */
export const sendOnboardingConfirmationEmail = async (to, name, type) => {
  const isRestaurant = type === 'restaurant';
  const subject = isRestaurant
    ? 'BiteSpeed - Restaurant Onboarding Application Received'
    : 'BiteSpeed - Rider Onboarding Application Received';

  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
      <h2 style="color: #d70f64; text-align: center;">Application Received!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for submitting your onboarding application to join BiteSpeed as a <strong>${isRestaurant ? 'Restaurant Partner' : 'Delivery Rider'}</strong>.</p>
      <p>Our onboarding team is currently reviewing your details. We will verify your application and reach out to you via email or phone within 2-3 business days.</p>
      <br />
      <p>Best regards,</p>
      <p><strong>The BiteSpeed Team</strong></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">This is an automated email. Please do not reply directly to this message.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Hello ${name},\n\nThank you for applying to join BiteSpeed as a ${isRestaurant ? 'Restaurant Partner' : 'Delivery Rider'}. Our onboarding team will review your application within 2-3 business days.`,
  });
};

/**
 * Sends a registration OTP email to the customer.
 */
export const sendRegistrationOTPEmail = async (to, name, otp) => {
  const subject = 'Verify Your Email Address - BiteSpeed';
  const currentYear = new Date().getFullYear();
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #f3f4f6; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="text-align: center; margin-bottom: 12px;">
          <img src="cid:logo" width="50" height="50" style="display: inline-block; border-radius: 14px; box-shadow: 0 4px 10px rgba(215, 15, 100, 0.2);" alt="BiteSpeed Logo" />
        </div>
        <h2 style="color: #d70f64; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">BiteSpeed</h2>
        <p style="font-size: 13px; color: #6b7280; margin: 4px 0 0 0; font-weight: 500;">Verify your customer registration</p>
      </div>
      
      <p style="margin: 0 0 16px 0; font-size: 15px;">Hello <strong>${name}</strong>,</p>
      <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151;">Thank you for signing up for BiteSpeed! To complete your registration and activate your account, please enter the following verification code:</p>
      
      <div style="text-align: center; margin: 28px 0; padding: 20px; background-color: #fff1f2; border: 1px dashed #fecdd3; border-radius: 12px;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #d70f64; display: inline-block; padding-left: 8px;">${otp}</span>
      </div>
      
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 28px 0;">This code is valid for <strong>10 minutes</strong>. If you did not request this verification, you can safely ignore this email.</p>
      
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 28px 0;" />
      
      <div style="font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.6;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #6b7280;">BiteSpeed Online Food Delivery</p>
        <p style="margin: 0 0 12px 0;">© ${currentYear} BiteSpeed Inc. All rights reserved.</p>
        <p style="margin: 0; font-size: 10px;">This is a transactional security notification. To unsubscribe from technical alerts, contact our helpdesk.</p>
      </div>
    </div>
  `;

  console.log(`\n==================================================\n[DEV/TEST] Registration OTP for ${to} (${name}): ${otp}\n==================================================\n`);

  return sendEmail({
    to,
    subject,
    html,
    text: `Hello ${name},\n\nYour registration verification code is: ${otp}\n\nThis code is valid for 10 minutes.`,
    attachments: [
      {
        filename: 'logo.svg',
        path: faviconPath,
        cid: 'logo',
        disposition: 'inline',
      },
    ],
  });
};

/**
 * Sends a password reset OTP email to any user.
 */
export const sendPasswordResetOTPEmail = async (to, name, otp) => {
  const subject = 'Reset Your Password - BiteSpeed';
  const currentYear = new Date().getFullYear();
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #f3f4f6; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="text-align: center; margin-bottom: 12px;">
          <img src="cid:logo" width="50" height="50" style="display: inline-block; border-radius: 14px; box-shadow: 0 4px 10px rgba(215, 15, 100, 0.2);" alt="BiteSpeed Logo" />
        </div>
        <h2 style="color: #d70f64; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">BiteSpeed</h2>
        <p style="font-size: 13px; color: #6b7280; margin: 4px 0 0 0; font-weight: 500;">Password Reset Request</p>
      </div>
      
      <p style="margin: 0 0 16px 0; font-size: 15px;">Hello <strong>${name}</strong>,</p>
      <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151;">We received a request to reset the password for your BiteSpeed account. Please enter the following reset code to establish a new password:</p>
      
      <div style="text-align: center; margin: 28px 0; padding: 20px; background-color: #fff1f2; border: 1px dashed #fecdd3; border-radius: 12px;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #d70f64; display: inline-block; padding-left: 8px;">${otp}</span>
      </div>
      
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 28px 0;">This code is valid for <strong>10 minutes</strong>. If you did not make this request, you can ignore this message. Your password will remain unchanged.</p>
      
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 28px 0;" />
      
      <div style="font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.6;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #6b7280;">BiteSpeed Security Team</p>
        <p style="margin: 0 0 12px 0;">© ${currentYear} BiteSpeed Inc. All rights reserved.</p>
        <p style="margin: 0; font-size: 10px;">This is a transactional security notification. To unsubscribe from technical alerts, contact our helpdesk.</p>
      </div>
    </div>
  `;

  console.log(`\n==================================================\n[DEV/TEST] Password Reset OTP for ${to} (${name}): ${otp}\n==================================================\n`);

  return sendEmail({
    to,
    subject,
    html,
    text: `Hello ${name},\n\nYour password reset verification code is: ${otp}\n\nThis code is valid for 10 minutes.`,
    attachments: [
      {
        filename: 'logo.svg',
        path: faviconPath,
        cid: 'logo',
        disposition: 'inline',
      },
    ],
  });
};

