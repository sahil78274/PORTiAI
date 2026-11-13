import { AdminAuditLog } from '../models/AdminAuditLog.js';

/**
 * Writes an audit record for a sensitive admin action.
 *
 * Never throws: a failed audit write is logged to the console but must not
 * turn an otherwise successful, already-validated action into a 500. Callers
 * must only pass safe, non-secret details (ids, emails, counts, reasons).
 */
export const logAdminAction = async (req, { action, targetType = '', targetId = '', targetEmail = '', details = {} } = {}) => {
  try {
    await AdminAuditLog.create({
      adminId: req.user?._id,
      adminEmail: req.user?.email || '',
      action,
      targetType,
      targetId: String(targetId || ''),
      targetEmail: targetEmail || '',
      details: details && typeof details === 'object' ? details : { note: String(details).slice(0, 500) },
      ip: req.ip || '',
    });
  } catch (error) {
    console.error(`[admin-audit] failed to record ${action}: ${error.message}`);
  }
};
