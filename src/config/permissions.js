import { ROLES } from './constants.js';

const { STAFF, ADMIN, SECURITY, CEO } = ROLES;
const ALL_ROLES = [STAFF, ADMIN, SECURITY, CEO];
const MANAGERS = [ADMIN, CEO];

const permissions = Object.freeze({
  users: {
    create: MANAGERS,
    read: MANAGERS,
    readOwn: ALL_ROLES,
    update: MANAGERS,
    updateOwn: ALL_ROLES,
    delete: MANAGERS,
    list: MANAGERS,
    listByRole: MANAGERS,
    directReports: ALL_ROLES,
  },

  departments: {
    create: MANAGERS,
    read: ALL_ROLES,
    update: MANAGERS,
    delete: [CEO],
    list: ALL_ROLES,
  },

  locations: {
    create: MANAGERS,
    read: ALL_ROLES,
    update: MANAGERS,
    delete: [CEO],
    list: ALL_ROLES,
  },

  attendance: {
    clockIn: ALL_ROLES,
    clockOut: ALL_ROLES,
    startBreak: ALL_ROLES,
    endBreak: ALL_ROLES,
    viewOwn: ALL_ROLES,
    viewAll: MANAGERS,
    viewByUser: MANAGERS,
    update: MANAGERS,
    delete: [CEO],
  },

  shifts: {
    create: MANAGERS,
    read: ALL_ROLES,
    readOwn: ALL_ROLES,
    update: MANAGERS,
    delete: MANAGERS,
    list: MANAGERS,
    listOwn: ALL_ROLES,
  },

  leaves: {
    create: ALL_ROLES,
    readOwn: ALL_ROLES,
    read: MANAGERS,
    update: MANAGERS,
    cancel: ALL_ROLES,
    approve: MANAGERS,
    reject: MANAGERS,
    list: MANAGERS,
    listOwn: ALL_ROLES,
  },

  auth: {
    changePassword: ALL_ROLES,
    viewProfile: ALL_ROLES,
  },
});

export const hasPermission = (role, resource, action) => {
  const allowedRoles = permissions[resource]?.[action];
  return allowedRoles ? allowedRoles.includes(role) : false;
};

export const getAllowedRoles = (resource, action) => {
  return permissions[resource]?.[action] || [];
};

export default permissions;
