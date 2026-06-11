import { wrap } from './base.controller.js';

const TIMESTAMP = () => new Date().toISOString().split('T')[0];

const CONTENT_TYPES = {
  csv:   { mime: 'text/csv', ext: 'csv' },
  excel: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' },
  pdf:   { mime: 'application/pdf', ext: 'pdf' },
};

class ReportController {
  constructor(reportService) { this.svc = reportService; }

  // Generic export handler — works for attendance, shifts, leaves, summary
  exportReport = (type) => wrap(async (req, res) => {
    const format = req.query.format || 'csv';
    const ct = CONTENT_TYPES[format] || CONTENT_TYPES.csv;
    const filters = this.parseFilters(req.query);

    // PDF header surfaces who generated the report and on whose behalf.
    const context = {
      customerName: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : '',
      customerEmail: req.user?.email || '',
      generatedBy: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : '',
      generatedByEmail: req.user?.email || '',
    };

    const result = await this.svc.export(type, filters, format, context);

    res.setHeader('Content-Type', ct.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${TIMESTAMP()}.${ct.ext}"`);
    return res.send(result);
  });

  exportAttendance = this.exportReport('attendance');
  exportShifts     = this.exportReport('shifts');
  exportLeaves     = this.exportReport('leaves');
  exportSummary    = this.exportReport('summary');

  parseFilters({ startDate, endDate, userId, departmentId, locationId, status, type }) {
    return {
      startDate, endDate, status, type,
      userId: userId ? parseInt(userId, 10) : undefined,
      departmentId: departmentId ? parseInt(departmentId, 10) : undefined,
      locationId: locationId ? parseInt(locationId, 10) : undefined,
    };
  }
}

export default ReportController;
