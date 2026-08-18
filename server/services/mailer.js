import nodemailer from 'nodemailer';

// Configure SMTP with Gmail App Password
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'ayarianas79@gmail.com',
    pass: 'nmaanvradoafeuqt'
  }
});

export async function sendOutreachEmail({ to, subject, body, fromName = 'Anas' }) {
  try {
    const mailOptions = {
      from: `"${fromName}" <ayarianas79@gmail.com>`,
      to: to,
      replyTo: 'ayarianas79@gmail.com',
      subject: subject,
      text: body
    };

    console.log(`[SMTP] Sending real email from ayarianas79@gmail.com to: ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Message delivered successfully! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[-] [SMTP ERROR] Failed to send email:`, err.message);
    throw err;
  }
}
