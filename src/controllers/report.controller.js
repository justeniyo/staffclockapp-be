import { wrap } from './base.controller.js';

const TIMESTAMP = () => new Date().toISOString().split('T')[0];

class ReportController {
  constructor(reportService) { this.svc = reportService; }

  /** Generic export handler — works for attendance, shifts, leaves, summary */
  exportReport = (type) => wrap(async (req, res) => {
    const format = req.query.format || 'csv';
    const filters = this.parseFilters(req.query);
    const result = await this.svc.export(type, filters, format);

    if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${TIMESTAMP()}.xlsx"`);
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${TIMESTAMP()}.csv"`);
    }
    return res.send(result);
  });

  // Route handlers bound to specific report types
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
