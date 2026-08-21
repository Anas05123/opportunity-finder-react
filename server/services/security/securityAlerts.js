/**
 * CAREERLY ENTERPRISE SECURITY ALERTING & OPERATIONAL MONITORING (PHASE 5C-5)
 * Privacy-preserving, fail-safe, rate-limited, and SSRF-hardened notification engine.
 * 
 * CORE ARCHITECTURAL INVARIANTS:
 * 1. Fail-Safe Delivery: Notification failure NEVER disrupts or bypasses security enforcement.
 * 2. Absolute Privacy: Zero raw secrets, passwords, JWTs, or private keys in alert payloads or logs.
 * 3. SSRF-Hardened Webhooks: Strict HTTPS validation rejecting loopback, private IPs, and cloud metadata.
 * 4. Deterministic Deduplication: Incident fingerprinting and configurable cooldown windows.
 * 5. Storm & Flooding Control: Global rate bounds and aggregated burst processing.
 */

import crypto from 'crypto';
import axios from 'axios';
import db from '../../db/sqliteClient.js';
import { transporter } from '../mailer.js';
import { sanitizeSecurityDetails } from './securityEvents.js';
import { getAppVersion, getGitCommit } from './securityMeta.js';

/**
 * Deterministic Alert Policy Matrix
 */
export const ALERT_POLICY = {
  // CRITICAL Conditions: Immediate notification (5m cooldown)
  CRITICAL_SECURITY_SCORE: { severity: 'CRITICAL', minScore: 0, cooldownMs: 5 * 60 * 1000 },
  IDOR_ATTEMPT: { severity: 'CRITICAL', cooldownMs: 5 * 60 * 1000 },
  BUNDLE_SECRET_EXPOSURE: { severity: 'CRITICAL', cooldownMs: 5 * 60 * 1000 },
  DEPENDENCY_CRITICAL_VULNERABILITY: { severity: 'CRITICAL', cooldownMs: 5 * 60 * 1000 },
  SOURCE_CRITICAL_SECRET: { severity: 'CRITICAL', cooldownMs: 5 * 60 * 1000 },
  GIT_HISTORY_CRITICAL_SECRET: { severity: 'CRITICAL', cooldownMs: 5 * 60 * 1000 },

  // HIGH Conditions: Notification (15m cooldown)
  DEGRADED_SECURITY_SCORE: { severity: 'HIGH', cooldownMs: 15 * 60 * 1000 },
  SECURITY_VERIFICATION_OUTDATED: { severity: 'HIGH', cooldownMs: 15 * 60 * 1000 },
  NOT_VERIFIED: { severity: 'HIGH', cooldownMs: 15 * 60 * 1000 },
  DEPENDENCY_HIGH_VULNERABILITY: { severity: 'HIGH', cooldownMs: 15 * 60 * 1000 },
  SOURCE_HIGH_SECRET: { severity: 'HIGH', cooldownMs: 15 * 60 * 1000 },
  SSRF_BLOCKED: { severity: 'HIGH', cooldownMs: 15 * 60 * 1000 },
  PROMPT_INJECTION_DETECTED: { severity: 'HIGH', cooldownMs: 15 * 60 * 1000 },
  AUTH_FAILURE_BURST: { severity: 'HIGH', cooldownMs: 15 * 60 * 1000 },
  TOKEN_INVALID_BURST: { severity: 'HIGH', cooldownMs: 15 * 60 * 1000 },
  ADMIN_ACCESS_DENIED_BURST: { severity: 'HIGH', cooldownMs: 15 * 60 * 1000 },
  CI_GATE_BLOCKED: { severity: 'HIGH', cooldownMs: 15 * 60 * 1000 },
  SCANNER_INFRASTRUCTURE_FAILURE: { severity: 'HIGH', cooldownMs: 15 * 60 * 1000 },

  // MEDIUM Conditions: Aggregated (60m cooldown)
  RATE_LIMIT_EXCEEDED_BURST: { severity: 'MEDIUM', cooldownMs: 60 * 60 * 1000 },

  // LOW / INFORMATIONAL: Suppressed from outbound alerting
  TOKEN_EXPIRED: { severity: 'LOW', suppressOutbound: true },
  INFORMATIONAL_EVENT: { severity: 'INFORMATIONAL', suppressOutbound: true }
};

// In-memory Deduplication & Rate Limiting Caches
const recentAlertsCache = new Map(); // fingerprint -> timestamp
let alertHourCount = 0;
let lastHourReset = Date.now();
const MAX_ALERTS_PER_HOUR = 30;

/**
 * Validates outbound Webhook URLs to strictly prevent Server-Side Request Forgery (SSRF)
 * Rejects HTTP, localhost, private IP subnets, loopbacks, and cloud metadata endpoints.
 */
export function validateWebhookUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, reason: 'URL string is required' };
  }

  try {
    const parsed = new URL(rawUrl.trim());

    // 1. Enforce HTTPS
    if (parsed.protocol !== 'https:') {
      return { valid: false, reason: 'Webhook URL must use secure HTTPS protocol' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Reject Localhost & Loopbacks
    if (hostname === 'localhost' || hostname.endsWith('.local') || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
      return { valid: false, reason: 'Webhook cannot target loopback or localhost address' };
    }

    // 3. Reject Cloud Metadata (AWS/GCP/Azure 169.254.169.254)
    if (hostname.includes('169.254.169.254') || hostname.includes('metadata.google.internal')) {
      return { valid: false, reason: 'Webhook cannot target cloud instance metadata endpoints' };
    }

    // 4. Reject Private Class A, B, C RFC-1918 Ranges
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return { valid: false, reason: 'Webhook cannot target private internal subnet' };
    }

    return { valid: true, url: parsed.toString() };
  } catch (err) {
    return { valid: false, reason: `Malformed URL format: ${err.message}` };
  }
}

/**
 * Generate a deterministic fingerprint for deduplication
 */
export function generateAlertFingerprint(alertType, severity, targetKey = '') {
  const seed = `${alertType}:${severity}:${targetKey}`;
  return crypto.createHash('sha256').update(seed).digest('hex').slice(0, 16);
}

/**
 * Get current configured alert channels status (strictly without exposing credentials/URLs)
 */
export function getAlertingConfigStatus() {
  const emailEnabled = process.env.SECURITY_ALERT_EMAIL_ENABLED === 'true' || Boolean(process.env.SECURITY_ALERT_EMAIL_TO);
  const slackEnabled = process.env.SECURITY_ALERT_SLACK_ENABLED === 'true' || Boolean(process.env.SECURITY_ALERT_SLACK_WEBHOOK_URL);
  const webhookEnabled = process.env.SECURITY_ALERT_WEBHOOK_ENABLED === 'true' || Boolean(process.env.SECURITY_ALERT_WEBHOOK_URL);

  return {
    email: {
      enabled: emailEnabled,
      configured: Boolean(process.env.SECURITY_ALERT_EMAIL_TO || process.env.ADMIN_ALERT_EMAIL || 'ayarianas79@gmail.com')
    },
    slack: {
      enabled: slackEnabled,
      configured: Boolean(process.env.SECURITY_ALERT_SLACK_WEBHOOK_URL)
    },
    webhook: {
      enabled: webhookEnabled,
      configured: Boolean(process.env.SECURITY_ALERT_WEBHOOK_URL)
    },
    globalRateLimit: {
      maxPerHour: MAX_ALERTS_PER_HOUR,
      currentHourCount: alertHourCount
    }
  };
}

/**
 * Dispatch Email Alert via safe SMTP Transporter
 */
async function dispatchEmailAlert(alert) {
  const recipient = process.env.SECURITY_ALERT_EMAIL_TO || process.env.ADMIN_ALERT_EMAIL || 'ayarianas79@gmail.com';
  const subject = `[SECURITY ${alert.severity}] Careerly Alert: ${alert.title}`;
  
  const textBody = [
    `CAREERLY ENTERPRISE SECURITY ALERT`,
    `=================================`,
    `Alert Type:  ${alert.alert_type}`,
    `Severity:    ${alert.severity}`,
    `Timestamp:   ${alert.created_at || new Date().toISOString()}`,
    `Source:      ${alert.source}`,
    `Summary:     ${alert.summary}`,
    ``,
    `Safe Metadata:`,
    JSON.stringify(alert.details, null, 2),
    ``,
    `-- Careerly Security Operations Subsystem`
  ].join('\n');

  const t0 = Date.now();
  try {
    const info = await transporter.sendMail({
      from: `"Careerly Security Operations" <${process.env.SMTP_USER || 'ayarianas79@gmail.com'}>`,
      to: recipient,
      subject,
      text: textBody
    });

    return {
      channel: 'EMAIL',
      status: 'SUCCESS',
      duration_ms: Date.now() - t0,
      messageId: info.messageId
    };
  } catch (err) {
    return {
      channel: 'EMAIL',
      status: 'FAILED',
      duration_ms: Date.now() - t0,
      error: err.message
    };
  }
}

/**
 * Dispatch Slack-compatible Webhook Alert
 */
async function dispatchSlackAlert(alert) {
  const rawUrl = process.env.SECURITY_ALERT_SLACK_WEBHOOK_URL;
  const validation = validateWebhookUrl(rawUrl);
  if (!validation.valid) {
    return {
      channel: 'SLACK',
      status: 'FAILED',
      duration_ms: 0,
      error: `Invalid Slack Webhook URL: ${validation.reason}`
    };
  }

  const payload = {
    text: `🛡️ *[SECURITY ${alert.severity}] Careerly Alert: ${alert.title}*`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `🛡️ Security Alert: ${alert.severity}` }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Type:*\n${alert.alert_type}` },
          { type: 'mrkdwn', text: `*Source:*\n${alert.source}` },
          { type: 'mrkdwn', text: `*Severity:*\n${alert.severity}` },
          { type: 'mrkdwn', text: `*Timestamp:*\n${alert.created_at || new Date().toISOString()}` }
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Summary:*\n${alert.summary}` }
      }
    ]
  };

  const t0 = Date.now();
  try {
    await axios.post(validation.url, payload, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    return {
      channel: 'SLACK',
      status: 'SUCCESS',
      duration_ms: Date.now() - t0
    };
  } catch (err) {
    return {
      channel: 'SLACK',
      status: 'FAILED',
      duration_ms: Date.now() - t0,
      error: err.message
    };
  }
}

/**
 * Dispatch Generic HTTPS Webhook Alert
 */
async function dispatchGenericWebhookAlert(alert) {
  const rawUrl = process.env.SECURITY_ALERT_WEBHOOK_URL;
  const validation = validateWebhookUrl(rawUrl);
  if (!validation.valid) {
    return {
      channel: 'WEBHOOK',
      status: 'FAILED',
      duration_ms: 0,
      error: `Invalid Webhook URL: ${validation.reason}`
    };
  }

  const payload = {
    event: 'careerly.security.alert',
    alert_id: alert.id,
    alert_type: alert.alert_type,
    severity: alert.severity,
    title: alert.title,
    summary: alert.summary,
    source: alert.source,
    timestamp: alert.created_at || new Date().toISOString(),
    details: alert.details
  };

  const t0 = Date.now();
  try {
    await axios.post(validation.url, payload, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    return {
      channel: 'WEBHOOK',
      status: 'SUCCESS',
      duration_ms: Date.now() - t0
    };
  } catch (err) {
    return {
      channel: 'WEBHOOK',
      status: 'FAILED',
      duration_ms: Date.now() - t0,
      error: err.message
    };
  }
}

/**
 * Core Security Alert Processing & Dispatch Engine
 * 
 * @param {Object} alertPayload
 * @param {string} alertPayload.alert_type - One of ALERT_POLICY keys
 * @param {string} [alertPayload.severity] - Severity override if valid
 * @param {string} alertPayload.title - Clean human-readable title
 * @param {string} alertPayload.summary - Clean sanitized summary
 * @param {string} [alertPayload.source='RUNTIME_TELEMETRY'] - Originating subsystem
 * @param {Object} [alertPayload.details={}] - Additional sanitized metadata
 * @param {string} [alertPayload.targetKey=''] - Disambiguation target for deduplication
 * @param {boolean} [alertPayload.force=false] - Force bypass cooldown (e.g. for test alert)
 * @returns {Promise<Object>} Safe alert processing result
 */
export async function triggerSecurityAlert(alertPayload = {}) {
  try {
    const {
      alert_type,
      severity: explicitSeverity,
      title = 'Security Incident Detected',
      summary = 'Anomalous security behavior detected by defensive monitoring.',
      source = 'RUNTIME_TELEMETRY',
      details = {},
      targetKey = '',
      force = false
    } = alertPayload;

    const policy = ALERT_POLICY[alert_type] || { severity: 'MEDIUM', cooldownMs: 15 * 60 * 1000 };
    const severity = explicitSeverity || policy.severity || 'MEDIUM';

    // 1. Suppress low/informational events from outbound channels
    if (policy.suppressOutbound && !force) {
      return { status: 'SUPPRESSED', reason: 'Severity policy suppresses outbound alert' };
    }

    // 2. Sanitize details
    const sanitizedDetails = sanitizeSecurityDetails(details);

    // 3. Deduplication and Cooldown Evaluation
    const fingerprint = generateAlertFingerprint(alert_type, severity, targetKey);
    const now = Date.now();
    const cooldownMs = policy.cooldownMs || 15 * 60 * 1000;

    if (!force) {
      const lastTriggered = recentAlertsCache.get(fingerprint);
      if (lastTriggered && (now - lastTriggered < cooldownMs)) {
        return { status: 'DEDUPLICATED', fingerprint, cooldownRemainingMs: cooldownMs - (now - lastTriggered) };
      }
    }
    recentAlertsCache.set(fingerprint, now);

    // 4. Rate Limiting Flooding Protection
    if (now - lastHourReset > 60 * 60 * 1000) {
      alertHourCount = 0;
      lastHourReset = now;
    }
    if (alertHourCount >= MAX_ALERTS_PER_HOUR && !force) {
      return { status: 'RATE_LIMITED', reason: 'Global hourly notification threshold reached' };
    }
    alertHourCount++;

    // 5. Persist Alert Record in SQLite
    const alertId = `alt-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
    try {
      db.prepare(`
        INSERT INTO security_alerts (
          id, alert_type, severity, title, summary, source, status, fingerprint, details_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'TRIGGERED', ?, ?, CURRENT_TIMESTAMP)
      `).run(
        alertId,
        alert_type,
        severity,
        title.slice(0, 200),
        summary.slice(0, 500),
        source.slice(0, 50),
        fingerprint,
        JSON.stringify(sanitizedDetails)
      );
    } catch (dbErr) {
      console.error('[SecurityAlerts] DB Insert Warning:', dbErr.message);
    }

    const alertRecord = {
      id: alertId,
      alert_type,
      severity,
      title,
      summary,
      source,
      fingerprint,
      details: sanitizedDetails,
      created_at: new Date().toISOString()
    };

    // 6. Dispatch across Active Notification Channels
    const deliveries = [];
    const configStatus = getAlertingConfigStatus();

    // Channel A: Email Dispatch
    if (configStatus.email.enabled && configStatus.email.configured) {
      const emailResult = await dispatchEmailAlert(alertRecord);
      deliveries.push(emailResult);
    }

    // Channel B: Slack Dispatch
    if (configStatus.slack.enabled && configStatus.slack.configured) {
      const slackResult = await dispatchSlackAlert(alertRecord);
      deliveries.push(slackResult);
    }

    // Channel C: Generic Webhook Dispatch
    if (configStatus.webhook.enabled && configStatus.webhook.configured) {
      const webhookResult = await dispatchGenericWebhookAlert(alertRecord);
      deliveries.push(webhookResult);
    }

    // 7. Persist Delivery Audit Records in SQLite
    let anySuccess = deliveries.some(d => d.status === 'SUCCESS');
    const finalAlertStatus = deliveries.length === 0 ? 'DELIVERED' : (anySuccess ? 'DELIVERED' : 'FAILED');

    for (const deliv of deliveries) {
      try {
        const deliveryId = `ald-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
        db.prepare(`
          INSERT INTO security_alert_deliveries (
            id, alert_id, channel, status, error_message, duration_ms, attempt_count, delivered_at
          ) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        `).run(
          deliveryId,
          alertId,
          deliv.channel,
          deliv.status,
          deliv.error || null,
          deliv.duration_ms || 0
        );
      } catch (delivDbErr) {
        console.error('[SecurityAlerts] Delivery Log Warning:', delivDbErr.message);
      }
    }

    // Update alert status
    try {
      db.prepare('UPDATE security_alerts SET status = ? WHERE id = ?').run(finalAlertStatus, alertId);
    } catch (e) {}

    return {
      status: finalAlertStatus,
      alertId,
      deliveriesCount: deliveries.length,
      deliveries
    };

  } catch (err) {
    // FAIL-SAFE: Operational alert failure NEVER throws or compromises application flow
    console.error('[SecurityAlerts Fail-Safe Catch]:', err.message);
    return {
      status: 'FAILED',
      error: err.message
    };
  }
}

/**
 * Trigger an authorized Administrator Test Notification
 */
export async function triggerTestAlert(adminUserId = 'admin') {
  return await triggerSecurityAlert({
    alert_type: 'CRITICAL_SECURITY_SCORE',
    severity: 'INFORMATIONAL',
    title: 'Test Operational Notification',
    summary: `Test security alert triggered by authorized administrator (ID: ${adminUserId}) to verify dispatch channels.`,
    source: 'ADMIN_TEST_DISPATCH',
    details: {
      initiated_by: adminUserId,
      app_version: getAppVersion(),
      git_commit: getGitCommit()
    },
    force: true // bypass cooldown for testing
  });
}

export default {
  ALERT_POLICY,
  validateWebhookUrl,
  generateAlertFingerprint,
  getAlertingConfigStatus,
  triggerSecurityAlert,
  triggerTestAlert
};
