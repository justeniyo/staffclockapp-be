import { Op } from 'sequelize';
import { LEAVE_STATUS, ROLES } from '../config/constants.js';

// Lightweight notification service: derives recent items from existing data.
//   - Staff/managers see status changes on their own leave requests.
//   - Managers see new pending leaves from their direct reports.
//   - Admins / CEO see all pending leaves company-wide.
// No new table: a "notification" is a transient view of recent leave activity.
// The frontend polls this every minute and renders a bell-icon dropdown.
class NotificationService {
  constructor(db) { this.db = db; }

  async listForUser(user, { since } = {}) {
    const { Leave, User } = this.db;
    const cutoff = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 3600 * 1000); // last 7 days

    const isAdmin = user.role === ROLES.ADMIN || user.role === ROLES.CEO;
    const isManager = user.role === ROLES.STAFF && user.isManager;

    const items = [];

    // 1. Your own leave: any status change in the period.
    const ownActivity = await Leave.findAll({
      where: {
        userId: user.id,
        updatedAt: { [Op.gte]: cutoff },
      },
      order: [['updatedAt', 'DESC']],
      limit: 20,
    });
    for (const l of ownActivity) {
      // Newly created (pending) → "your leave was submitted"
      // Status moved to approved/rejected/cancelled → "your leave was X"
      if (l.status === LEAVE_STATUS.PENDING) {
        items.push({
          id: `leave-own-${l.id}-${l.createdAt.getTime()}`,
          kind: 'leave_submitted',
          title: 'Leave request submitted',
          body: `Your ${l.type} leave for ${l.startDate} – ${l.endDate} is awaiting review.`,
          createdAt: l.createdAt,
          link: '/staff/request-leave',
        });
      } else if (l.reviewedAt && new Date(l.reviewedAt) >= cutoff) {
        items.push({
          id: `leave-reviewed-${l.id}-${new Date(l.reviewedAt).getTime()}`,
          kind: `leave_${l.status}`,
          title: `Leave ${l.status}`,
          body: `Your ${l.type} leave for ${l.startDate} – ${l.endDate} was ${l.status}.`,
          createdAt: l.reviewedAt,
          link: '/staff/request-leave',
        });
      }
    }

    // 2. Inbound: pending leaves the user needs to act on.
    if (isAdmin || isManager) {
      const where = { status: LEAVE_STATUS.PENDING };
      const include = [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'managerId'] }];
      if (isManager && !isAdmin) {
        // managers only see their direct reports
        include[0].where = { managerId: user.id };
      }
      const pending = await Leave.findAll({
        where,
        include,
        order: [['createdAt', 'DESC']],
        limit: 20,
      });
      for (const l of pending) {
        items.push({
          id: `leave-pending-${l.id}`,
          kind: 'leave_pending',
          title: 'Leave request awaiting your review',
          body: `${l.user.firstName} ${l.user.lastName} requested ${l.type} leave for ${l.startDate} – ${l.endDate}.`,
          createdAt: l.createdAt,
          link: isAdmin ? '/admin/leave-requests' : '/manager/leave-requests',
        });
      }
    }

    // Sort newest first, dedupe by id, cap at 30.
    const seen = new Set();
    const sorted = items
      .filter((n) => { if (seen.has(n.id)) return false; seen.add(n.id); return true; })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30);

    return { items: sorted, total: sorted.length };
  }
}

export default NotificationService;
