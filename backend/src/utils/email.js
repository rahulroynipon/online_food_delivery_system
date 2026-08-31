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
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">BiteSpeed</h2>
        <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">Verify your customer registration</p>
      </div>
      <p style="margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
      <p style="margin: 0 0 24px 0;">Thank you for signing up for BiteSpeed! To complete your registration and activate your account, please enter the following verification code:</p>
      <div style="text-align: center; margin: 24px 0; padding: 16px; background-color: #fff7ed; border: 1px dashed #fdba74; border-radius: 8px;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #ea580c; display: inline-block; padding-left: 6px;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 24px 0;">This code is valid for <strong>10 minutes</strong>. If you did not request this verification, please ignore this email or contact support.</p>
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">This is an automated email. Please do not reply directly to this message.</p>
    </div>
  `;

  console.log(`\n==================================================\n[DEV/TEST] Registration OTP for ${to} (${name}): ${otp}\n==================================================\n`);

  return sendEmail({
    to,
    subject,
    html,
    text: `Hello ${name},\n\nYour registration verification code is: ${otp}\n\nThis code is valid for 10 minutes.`,
  });
};

/**
 * Sends a password reset OTP email to any user.
 */
export const sendPasswordResetOTPEmail = async (to, name, otp) => {
  const subject = 'Reset Your Password - BiteSpeed';
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">BiteSpeed</h2>
        <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">Password Reset Request</p>
      </div>
      <p style="margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
      <p style="margin: 0 0 24px 0;">We received a request to reset the password for your BiteSpeed account. Please use the verification code below to reset your password:</p>
      <div style="text-align: center; margin: 24px 0; padding: 16px; background-color: #fff7ed; border: 1px dashed #fdba74; border-radius: 8px;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #ea580c; display: inline-block; padding-left: 6px;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 24px 0;">This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please secure your account or ignore this message.</p>
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">This is an automated email. Please do not reply directly to this message.</p>
    </div>
  `;

  console.log(`\n==================================================\n[DEV/TEST] Password Reset OTP for ${to} (${name}): ${otp}\n==================================================\n`);

  return sendEmail({
    to,
    subject,
    html,
    text: `Hello ${name},\n\nYour password reset verification code is: ${otp}\n\nThis code is valid for 10 minutes.`,
  });
};

