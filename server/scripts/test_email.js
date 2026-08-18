import { sendOutreachEmail } from '../services/mailer.js';

async function test() {
  console.log('Sending test email via Gmail SMTP...');
  const res = await sendOutreachEmail({
    to: 'ayarianas79@gmail.com',
    subject: 'OpportunityHub — Verified SMTP Email Dispatch Test',
    body: `Hello Anas,\n\nYour automated Gmail SMTP email engine is 100% active and connected to ayarianas79@gmail.com!\n\nYou can now click 'Send Email' on any opportunity (Chevening, Erasmus+, MEXT, Oxford, Stanford, Ogilvy, Google, etc.) to automatically dispatch human-written letters to admissions teams and professors.\n\nBest regards,\nOpportunityHub Team`,
    fromName: 'OpportunityHub'
  });
  console.log('TEST RESULT:', res);
}

test();
