import nodemailer from 'nodemailer';

const SMTP_USER = process.env.SMTP_USER || 'ayarianas79@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'nmaanvradoafeuqt';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE !== 'false';

// Helper to determine if an email is for automated testing, CI, or dummy domains
export function isTestOrMockEmail(email = '') {
  if (!email || typeof email !== 'string') return true;
  const lower = email.toLowerCase().trim();
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.MUTE_TEST_EMAILS === 'true' ||
    lower.endsWith('@example.com') ||
    lower.endsWith('@example.org') ||
    lower.endsWith('@example.net') ||
    lower.endsWith('@test.com') ||
    lower.endsWith('@test.local') ||
    lower.includes('.test.') ||
    lower.includes('audit.') ||
    lower.startsWith('test.') ||
    lower.startsWith('mock.')
  );
}

// Configure SMTP transporter
export const transporter = nodemailer.createTransport({
  service: SMTP_HOST.includes('gmail') ? 'gmail' : undefined,
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

export async function sendOutreachEmail({ to, subject, body, fromName = 'Anas' }) {
  if (isTestOrMockEmail(to)) {
    console.log(`[SMTP Mock] Skipped real delivery to test address: ${to}`);
    return { success: true, messageId: `mock-outreach-${Date.now()}`, simulated: true };
  }

  try {
    const mailOptions = {
      from: `"${fromName}" <${SMTP_USER}>`,
      to: to,
      replyTo: SMTP_USER,
      subject: subject,
      text: body
    };

    console.log(`[SMTP] Sending outreach email to: ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[-] [SMTP ERROR] Failed to send outreach email:`, err.message);
    throw err;
  }
}

export async function sendVerificationEmail({ to, code, token, name = 'Member' }) {
  if (isTestOrMockEmail(to)) {
    console.log(`[SMTP Mock] Skipped real delivery to test address: ${to} (Verification Code: ${code})`);
    return { success: true, messageId: `mock-verify-${Date.now()}`, simulated: true };
  }

  const subject = `Your Careerly Verification Code: ${code}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #06070a; color: #f8fafc; padding: 40px 20px; border-radius: 12px;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #0c0f17; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
          <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
            Careerly <span style="font-size: 11px; background: #1FE477; color: #06070a; padding: 2px 6px; border-radius: 4px; font-weight: 800;">CYBER 2.0</span>
          </div>
        </div>
        <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Verify your email address</h2>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
          Hi ${name}, welcome to Careerly! Please use the 6-digit verification code below to activate your account and access 3,400+ verified opportunities.
        </p>
        <div style="background: rgba(31, 228, 119, 0.08); border: 1.5px solid #1FE477; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1FE477; font-family: monospace;">
            ${code}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Expires in 15 minutes</div>
        </div>
        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Careerly" <${SMTP_USER}>`,
      to,
      subject,
      text: `Your Careerly verification code is: ${code}. It expires in 15 minutes.`,
      html
    });
    console.log(`[SMTP] Verification email dispatched to ${to} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.warn(`[SMTP Warning] Could not deliver verification email to ${to}: ${err.message}. Verification code: ${code}`);
    return { success: false, fallbackCode: code, error: err.message };
  }
}

export async function sendPasswordResetEmail({ to, code, token, name = 'Member' }) {
  if (isTestOrMockEmail(to)) {
    console.log(`[SMTP Mock] Skipped real delivery to test address: ${to} (Reset Code: ${code})`);
    return { success: true, messageId: `mock-reset-${Date.now()}`, simulated: true };
  }

  const subject = `Reset Your Careerly Password: ${code}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #06070a; color: #f8fafc; padding: 40px 20px; border-radius: 12px;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #0c0f17; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 32px;">
        <div style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 24px;">Careerly Security</div>
        <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Password Reset Request</h2>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
          Hi ${name}, we received a request to reset your Careerly password. Enter the code below to set a new password:
        </p>
        <div style="background: rgba(56, 189, 248, 0.08); border: 1.5px solid #38bdf8; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">
            ${code}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Expires in 15 minutes</div>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Careerly Security" <${SMTP_USER}>`,
      to,
      subject,
      text: `Your password reset code is: ${code}. It expires in 15 minutes.`,
      html
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.warn(`[SMTP Warning] Password reset email not delivered to ${to}: ${err.message}. Code: ${code}`);
    return { success: false, fallbackCode: code, error: err.message };
  }
}

export default { isTestOrMockEmail, transporter, sendOutreachEmail, sendVerificationEmail, sendPasswordResetEmail };
