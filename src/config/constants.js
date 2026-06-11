export const ROLES = Object.freeze({
  STAFF: 'staff',
  ADMIN: 'admin',
  SECURITY: 'security',
  CEO: 'ceo',
});

export const VALID_ROLES = Object.values(ROLES);

export const ROLE_HIERARCHY = Object.freeze({
  [ROLES.STAFF]: 1,
  [ROLES.SECURITY]: 2,
  [ROLES.ADMIN]: 3,
  [ROLES.CEO]: 4,
});

export const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
});

export const VALID_STATUSES = Object.values(USER_STATUS);

export const ATTENDANCE_STATUS = Object.freeze({
  CLOCKED_IN: 'clocked_in',
  ON_BREAK: 'on_break',
  CLOCKED_OUT: 'clocked_out',
});

export const SHIFT_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  MISSED: 'missed',
  CANCELLED: 'cancelled',
});

export const LEAVE_TYPE = Object.freeze({
  ANNUAL: 'annual',
  SICK: 'sick',
  PERSONAL: 'personal',
  UNPAID: 'unpaid',
  MATERNITY: 'maternity',
  PATERNITY: 'paternity',
  BEREAVEMENT: 'bereavement',
  OTHER: 'other',
});

// Types where the requester must give a written reason. Discretionary or
// catch-all categories need context; statutory and self-evident types don't.
export const LEAVE_TYPES_REQUIRING_REASON = Object.freeze([
  LEAVE_TYPE.PERSONAL,
  LEAVE_TYPE.UNPAID,
  LEAVE_TYPE.OTHER,
]);

export const leaveTypeRequiresReason = (type) =>
  LEAVE_TYPES_REQUIRING_REASON.includes(type);

export const LEAVE_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
});

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
});
