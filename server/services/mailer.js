import nodemailer from 'nodemailer';

const SMTP_USER = process.env.SMTP_USER || 'ayarianas79@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'nmaanvradoafeuqt';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE !== 'false';

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
  try {
    const mailOptions = {
      from: `"${fromName}" <${SMTP_USER}>`,
      to: to,
      replyTo: SMTP_USER,
      subject: subject,
      text: body
    };

    console.log(`[SMTP] Sending real email from ${SMTP_USER} to: ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Message delivered successfully! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[-] [SMTP ERROR] Failed to send email:`, err.message);
    throw err;
  }
}

export default { transporter, sendOutreachEmail };
