import * as Sentry from '@sentry/react';

/**
 * Careerly Sentry Client-Side Monitoring & Telemetry Integration
 * 
 * Privacy & Security Guarantees:
 * - sendDefaultPii: false (strictly enforced)
 * - Session Replay text masking & media blocking enabled
 * - Strict beforeSend scrubbing for Authorization headers, cookies, and tokens
 * - User context limited solely to opaque userId (no emails, names, passwords, CVs, or profiles)
 */

export function initSentry() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
  const dsn = env.VITE_SENTRY_DSN;
  const isEnabled = Boolean(dsn && String(dsn).trim() !== '');

  Sentry.init({
    dsn: isEnabled ? dsn : undefined,
    environment: env.MODE || env.NODE_ENV || 'development',
    enabled: isEnabled,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance sampling (10% in production)
    tracesSampleRate: env.PROD ? 0.1 : 1.0,

    // Session replay sampling
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,

    // Do not capture standard PII
    sendDefaultPii: false,

    // Privacy & Security Inbound Sanitization
    beforeSend(event, hint) {
      // 1. Strip HTTP Request Authorization headers and cookies
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['Authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['Cookie'];
        delete event.request.headers['x-api-key'];
      }

      // 2. Strip any potential request body payloads
      if (event.request?.data) {
        event.request.data = '[Filtered Request Body]';
      }

      // 3. Drop expected user validation / canceled network errors
      const originalError = hint?.originalException;
      if (originalError && typeof originalError === 'object') {
        const msg = String(originalError.message || '').toLowerCase();
        if (
          msg.includes('invalid credentials') ||
          msg.includes('user cancelled') ||
          (msg.includes('failed to fetch') && typeof window !== 'undefined' && !window.navigator.onLine)
        ) {
          return null; // Don't report expected transient network drops or user validation
        }
      }

      return event;
    }
  });

  // Global Application Identifiers
  Sentry.setTag('application', 'careerly');

  // Safe developer diagnostics in development mode
  if ((env.DEV || env.NODE_ENV !== 'production') && typeof window !== 'undefined') {
    window.__triggerSentryTestError = () => {
      console.warn('[Sentry Dev] Triggering test exception for Careerly verification...');
      Sentry.captureException(new Error('Careerly Sentry verification test error'));
    };
  }
}

/**
 * Safely set non-sensitive user identity context in Sentry
 * Strictly limited to opaque user ID.
 */
export function setSentryUser(userId) {
  if (!userId) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({ id: String(userId) });
}

/**
 * Clear user context on sign out
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Set application area / feature tag for technical triage
 */
export function setSentryArea(area) {
  if (area) {
    Sentry.setTag('area', area);
  }
}

/**
 * Capture unexpected API server failures (500s / unexpected network errors)
 * Omits expected 401s, 403s, 404s, and 422 validation errors.
 */
export function captureApiException(error, context = {}) {
  const status = Number(context.status || error?.status || 0);

  // Filter out expected user/business logic responses
  if (status >= 400 && status < 500) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context.area) scope.setTag('area', context.area);
    if (context.endpoint) scope.setTag('endpoint', context.endpoint);
    if (context.method) scope.setTag('method', context.method);
    if (status) scope.setTag('http.status_code', String(status));

    // Never attach request bodies or tokens
    Sentry.captureException(error);
  });
}

export { Sentry };
export default {
  initSentry,
  setSentryUser,
  clearSentryUser,
  setSentryArea,
  captureApiException,
  Sentry
};
