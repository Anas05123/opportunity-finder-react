/**
 * Anti-Fraud & Disposable Email Detection Engine
 * Blocks throwaway, temporary, and disposable email services from polluting the database.
 */

// Top 120+ known temporary, disposable, and throwaway email domains
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', '10minmail.com',
  'mailinator.com', 'mailinator.net', 'mailinator2.com',
  'tempmail.com', 'temp-mail.org', 'tempmail.net', 'tempmail.plus',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.biz',
  'sharklasers.com', 'grr.la', 'guerrillamailblock.com',
  'trashmail.com', 'trashmail.net', 'trashmail.org', 'trashmail.me',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf', 'jetable.fr.nf',
  'dispostable.com', 'throwawaymail.com', 'fakeinbox.com', 'getairmail.com',
  'burnermail.io', 'mytemp.email', 'mohmal.com', 'inboxkitten.com',
  'crazymailing.com', 'nada.ltd', 'dropmail.me', 'getnada.com',
  'fakemailgenerator.com', 'generator.email', 'emailondeck.com',
  'maildrop.cc', 'harakirimail.com', 'meltmail.com', 'spambog.com',
  'tempail.com', 'tempinbox.com', 'receive-a-mail.com', 'instantemailaddress.com',
  'trashinbox.com', 'tempmailaddress.com', 'mytempemail.com', 'spamex.com',
  'throwawayemailaddress.com', 'trashcanmail.com', 'tempmailer.com',
  'disposablemail.com', 'anonymbox.com', 'eyepaste.com', 'trashymail.com',
  'deadaddress.com', 'nowmymail.com', 'filzmail.com', 'dumpmail.de',
  'discard.email', 'discardmail.com', 'spambox.us', 'binkmail.com',
  'safetymail.info', 'spam4.me', 'zetmail.com', 'zoemail.org',
  'armyspy.com', 'cuvox.de', 'dayrep.com', 'fleckens.hu', 'gustr.com',
  'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us', 'einrot.com',
  'emailfake.com', 'crazymail.com', 'throwaway.email', 'tempmail.ninja',
  'fastmail.fm.tmp', 'chacuo.net', '0-mail.com', '0815.ru', '0clickemail.com',
  '10mail.org', '20minutemail.com', '2prong.com', '30minutemail.com',
  '3d-painting.com', '4warding.com', '5ymail.com', '60minutemail.com',
  '675hosting.com', '675hosting.net', '675hosting.org', '7tags.com',
  '9ox.net', 'a-bc.net', 'anonbox.net', 'antichef.com', 'antichef.net',
  'baxomale.ht.cx', 'beefmilk.com', 'boun.cr', 'bouncr.com',
  'breakthru.com', 'broadbandninja.com', 'bsnow.net', 'bugmenot.com',
  'bupkis.org', 'burntmail.com', 'buyusedcars.biz', 'cachedot.net'
]);

// Basic RFC 5322 email syntax validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates email format and detects disposable domains.
 * @param {string} email
 * @returns {{ isValid: boolean, isDisposable: boolean, normalizedEmail: string, error?: string }}
 */
export function validateEmailSafety(email = '') {
  if (!email || typeof email !== 'string') {
    return { isValid: false, isDisposable: false, normalizedEmail: '', error: 'Email address is required.' };
  }

  const normalized = email.toLowerCase().trim();

  if (normalized.length < 5 || normalized.length > 254) {
    return { isValid: false, isDisposable: false, normalizedEmail: normalized, error: 'Email length must be between 5 and 254 characters.' };
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return { isValid: false, isDisposable: false, normalizedEmail: normalized, error: 'Please enter a valid email format (e.g. name@domain.com).' };
  }

  const parts = normalized.split('@');
  if (parts.length !== 2) {
    return { isValid: false, isDisposable: false, normalizedEmail: normalized, error: 'Invalid email address structure.' };
  }

  const domain = parts[1];

  // Check top-level domain
  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return { isValid: false, isDisposable: false, normalizedEmail: normalized, error: 'Invalid domain name.' };
  }

  // Check disposable domains set
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      isDisposable: true,
      normalizedEmail: normalized,
      error: 'Disposable, temporary, or throwaway email domains are not permitted. Please use a permanent institutional or personal email.'
    };
  }

  return { isValid: true, isDisposable: false, normalizedEmail: normalized };
}

export default { validateEmailSafety, DISPOSABLE_DOMAINS };
