// Custom human-readable identifiers for records.
// The numeric primary key stays as-is for joins; this is purely for display.

const pad = (n, width) => String(n).padStart(width, '0');

const stampDate = (d) => {
  const dt = d instanceof Date ? d : new Date(d || Date.now());
  if (isNaN(dt.getTime())) return '00000000';
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1, 2)}${pad(dt.getDate(), 2)}`;
};

const stampDateTime = (d) => {
  const dt = d instanceof Date ? d : new Date(d || Date.now());
  if (isNaN(dt.getTime())) return '00000000000000';
  return `${stampDate(dt)}${pad(dt.getHours(), 2)}${pad(dt.getMinutes(), 2)}${pad(dt.getSeconds(), 2)}`;
};

// staff_0000042
export const staffId = (user) => `staff_${pad(user.id, 7)}`;

// leave_20260607143012_42
export const leaveId = (leave) => `leave_${stampDateTime(leave.createdAt)}_${leave.id}`;

// shift_20260607_42
export const shiftId = (shift) => `shift_${stampDate(shift.date || shift.createdAt)}_${shift.id}`;

// att_202606071430_42
export const attendanceId = (att) => {
  const dt = att.clockIn instanceof Date ? att.clockIn : new Date(att.clockIn || att.createdAt || Date.now());
  if (isNaN(dt.getTime())) return `att_${pad(att.id, 6)}`;
  return `att_${stampDate(dt)}${pad(dt.getHours(), 2)}${pad(dt.getMinutes(), 2)}_${att.id}`;
};

export const departmentId = (d) => `dept_${pad(d.id, 4)}`;
export const locationId   = (l) => `loc_${pad(l.id, 4)}`;
