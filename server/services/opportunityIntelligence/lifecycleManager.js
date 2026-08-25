import db from '../../db/sqliteClient.js';

/**
 * Opportunity Lifecycle Management Engine
 * States: DISCOVERED -> VALIDATED -> ACTIVE -> STALE -> EXPIRED -> REMOVED
 */
export function runLifecycleReconciliation() {
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();
  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Mark expired if past deadline_utc
  const expiredByDeadline = db.prepare(`
    UPDATE opportunities
    SET lifecycle_status = 'EXPIRED',
        status = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE deadline_utc IS NOT NULL 
      AND deadline_utc < ? 
      AND lifecycle_status != 'EXPIRED'
  `).run(todayStr);

  // 2. Mark stale if not seen in 30+ days and active
  const markedStale = db.prepare(`
    UPDATE opportunities
    SET lifecycle_status = 'STALE',
        updated_at = CURRENT_TIMESTAMP
    WHERE last_seen_at < ? 
      AND lifecycle_status = 'ACTIVE'
  `).run(thirtyDaysAgo);

  // 3. Mark expired if not seen in 60+ days
  const markedExpired = db.prepare(`
    UPDATE opportunities
    SET lifecycle_status = 'EXPIRED',
        status = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE last_seen_at < ? 
      AND lifecycle_status = 'STALE'
  `).run(sixtyDaysAgo);

  return {
    expired_by_deadline: expiredByDeadline.changes,
    marked_stale: markedStale.changes,
    marked_expired: markedExpired.changes
  };
}

export default { runLifecycleReconciliation };
