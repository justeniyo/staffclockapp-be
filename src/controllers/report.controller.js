class ReportController {
  constructor(reportService) {
    this.service = reportService;
  }

  exportAttendance = async (req, res, next) => {
    try {
      const format = req.query.format || 'csv';
      const filters = this.extractFilters(req.query);

      if (format === 'excel') {
        const buffer = await this.service.exportAttendanceExcel(filters);
        return this.sendExcel(res, buffer, 'attendance-report');
      }

      const csv = await this.service.exportAttendanceCsv(filters);
      return this.sendCsv(res, csv, 'attendance-report');
    } catch (error) {
      next(error);
    }
  };

  exportShifts = async (req, res, next) => {
    try {
      const format = req.query.format || 'csv';
      const filters = this.extractFilters(req.query);

      if (format === 'excel') {
        const buffer = await this.service.exportShiftsExcel(filters);
        return this.sendExcel(res, buffer, 'shifts-report');
      }

      const csv = await this.service.exportShiftsCsv(filters);
      return this.sendCsv(res, csv, 'shifts-report');
    } catch (error) {
      next(error);
    }
  };

  exportLeaves = async (req, res, next) => {
    try {
      const format = req.query.format || 'csv';
      const filters = this.extractFilters(req.query);

      if (format === 'excel') {
        const buffer = await this.service.exportLeavesExcel(filters);
        return this.sendExcel(res, buffer, 'leaves-report');
      }

      const csv = await this.service.exportLeavesCsv(filters);
      return this.sendCsv(res, csv, 'leaves-report');
    } catch (error) {
      next(error);
    }
  };

  exportSummary = async (req, res, next) => {
    try {
      const format = req.query.format || 'csv';
      const filters = this.extractFilters(req.query);

      if (format === 'excel') {
        const buffer = await this.service.exportSummaryExcel(filters);
        return this.sendExcel(res, buffer, 'attendance-summary');
      }

      const csv = await this.service.exportSummaryCsv(filters);
      return this.sendCsv(res, csv, 'attendance-summary');
    } catch (error) {
      next(error);
    }
  };

  extractFilters(query) {
    return {
      startDate: query.startDate,
      endDate: query.endDate,
      userId: query.userId ? parseInt(query.userId, 10) : undefined,
      departmentId: query.departmentId ? parseInt(query.departmentId, 10) : undefined,
      locationId: query.locationId ? parseInt(query.locationId, 10) : undefined,
      status: query.status,
      type: query.type,
    };
  }

  sendCsv(res, data, filename) {
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}-${timestamp}.csv"`);
    return res.send(data);
  }

  sendExcel(res, buffer, filename) {
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}-${timestamp}.xlsx"`);
    return res.send(buffer);
  }
}

export default ReportController;
