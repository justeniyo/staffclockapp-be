import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Op } from 'sequelize';

// Column schemas — one definition serves CSV, Excel, and PDF.
const REPORT_SCHEMAS = {
  attendance: {
    title: 'Attendance Report',
    sheet: 'Attendance Report',
    columns: [
      { header: 'ID', key: 'id', width: 8, pdfWidth: 30 },
      { header: 'Employee ID', key: 'employeeId', width: 12, pdfWidth: 50 },
      { header: 'Employee Name', key: 'employeeName', width: 25, pdfWidth: 110 },
      { header: 'Email', key: 'email', width: 30, pdfWidth: 130 },
      { header: 'Department', key: 'department', width: 20, pdfWidth: 90 },
      { header: 'Location', key: 'userLocation', width: 20, pdfWidth: 90 },
      { header: 'Clock In', key: 'clockIn', width: 20, pdfWidth: 100 },
      { header: 'Clock Out', key: 'clockOut', width: 20, pdfWidth: 100 },
      { header: 'Work (min)', key: 'workMinutes', width: 12, pdfWidth: 60 },
      { header: 'Work (hrs)', key: 'workHours', width: 12, pdfWidth: 60 },
      { header: 'Clock Location', key: 'clockLocation', width: 20, pdfWidth: 90 },
      { header: 'Notes', key: 'notes', width: 30, pdfWidth: 130 },
    ],
  },
  shifts: {
    title: 'Shift Report',
    sheet: 'Shift Report',
    columns: [
      { header: 'ID', key: 'id', width: 8, pdfWidth: 30 },
      { header: 'Employee ID', key: 'employeeId', width: 12, pdfWidth: 50 },
      { header: 'Employee Name', key: 'employeeName', width: 25, pdfWidth: 110 },
      { header: 'Email', key: 'email', width: 30, pdfWidth: 130 },
      { header: 'Department', key: 'department', width: 20, pdfWidth: 90 },
      { header: 'Date', key: 'date', width: 12, pdfWidth: 70 },
      { header: 'Start', key: 'startTime', width: 10, pdfWidth: 50 },
      { header: 'End', key: 'endTime', width: 10, pdfWidth: 50 },
      { header: 'Scheduled (hrs)', key: 'scheduledHours', width: 15, pdfWidth: 70 },
      { header: 'Location', key: 'location', width: 20, pdfWidth: 90 },
      { header: 'Status', key: 'status', width: 12, pdfWidth: 60 },
      { header: 'Created By', key: 'createdBy', width: 20, pdfWidth: 100 },
      { header: 'Notes', key: 'notes', width: 30, pdfWidth: 130 },
    ],
  },
  leaves: {
    title: 'Leave Report',
    sheet: 'Leave Report',
    columns: [
      { header: 'ID', key: 'id', width: 8, pdfWidth: 30 },
      { header: 'Employee ID', key: 'employeeId', width: 12, pdfWidth: 50 },
      { header: 'Employee Name', key: 'employeeName', width: 25, pdfWidth: 110 },
      { header: 'Email', key: 'email', width: 30, pdfWidth: 130 },
      { header: 'Department', key: 'department', width: 20, pdfWidth: 90 },
      { header: 'Type', key: 'type', width: 12, pdfWidth: 60 },
      { header: 'Start Date', key: 'startDate', width: 12, pdfWidth: 70 },
      { header: 'End Date', key: 'endDate', width: 12, pdfWidth: 70 },
      { header: 'Total Days', key: 'totalDays', width: 12, pdfWidth: 60 },
      { header: 'Status', key: 'status', width: 12, pdfWidth: 60 },
      { header: 'Reason', key: 'reason', width: 30, pdfWidth: 130 },
      { header: 'Reviewed By', key: 'reviewedBy', width: 20, pdfWidth: 100 },
      { header: 'Reviewed At', key: 'reviewedAt', width: 20, pdfWidth: 100 },
      { header: 'Review Notes', key: 'reviewNotes', width: 30, pdfWidth: 130 },
    ],
  },
  summary: {
    title: 'Attendance Summary',
    sheet: 'Attendance Summary',
    columns: [
      { header: 'Employee ID', key: 'employeeId', width: 12, pdfWidth: 60 },
      { header: 'Employee Name', key: 'employeeName', width: 25, pdfWidth: 130 },
      { header: 'Department', key: 'department', width: 20, pdfWidth: 110 },
      { header: 'Total Days', key: 'totalDays', width: 12, pdfWidth: 70 },
      { header: 'Total Work (min)', key: 'totalWorkMinutes', width: 15, pdfWidth: 80 },
      { header: 'Total Work (hrs)', key: 'totalWorkHours', width: 15, pdfWidth: 80 },
      { header: 'Avg Hours/Day', key: 'avgWorkHoursPerDay', width: 15, pdfWidth: 80 },
    ],
  },
};


const fullName = (u) => `${u.firstName} ${u.lastName}`;
const optName = (obj) => obj?.name || '';
const escapeCsv = (val) => {
  if (val == null) return '';
  const s = String(val);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Format a date/datetime as compact numeric string ("2024-01-15 17:30" or "2024-01-15").
export function formatNumericDateTime(value) {
  if (!value) return '';
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : formatNumericDateTime(d);
  }
  return s;
}

/** Per-column formatter for PDF cells. */
function formatCellForPdf(value, _key) {
  if (value == null || value === '') return '';
  return String(value);
}

/** Calculate work minutes from clockIn/clockOut timestamps (no break subtraction). */
const minutesBetween = (start, end) => {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
};
const calcShiftHrs = (start, end) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (((eh * 60 + em) - (sh * 60 + sm)) / 60).toFixed(2);
};
const dateRange = (where, field, start, end, isTimestamp = false) => {
  if (start) where[field] = { [Op.gte]: isTimestamp ? new Date(start) : start };
  if (end) where[field] = { ...where[field], [Op.lte]: isTimestamp ? new Date(end + 'T23:59:59') : end };
};

class ReportService {
  constructor(db) { this.db = db; }


  async export(type, filters, format = 'csv') {
    const data = await this[`get${type.charAt(0).toUpperCase() + type.slice(1)}Data`](filters);
    if (format === 'excel') return this.toExcel(type, data);
    if (format === 'pdf')   return this.toPdf(type, data, filters);
    return this.toCsv(type, data);
  }

  toCsv(type, data) {
    const { columns } = REPORT_SCHEMAS[type];
    const keys = columns.map((c) => c.key);
    const header = columns.map((c) => c.header).join(',');
    return [header, ...data.map((row) => keys.map((k) => escapeCsv(row[k])).join(','))].join('\n');
  }

  async toExcel(type, data) {
    const schema = REPORT_SCHEMAS[type];
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(schema.sheet);
    ws.columns = schema.columns.map(({ header, key, width }) => ({ header, key, width }));
    const hdr = ws.getRow(1);
    hdr.font = { bold: true };
    hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    hdr.alignment = { horizontal: 'center' };
    data.forEach((row) => ws.addRow(row));
    return wb.xlsx.writeBuffer();
  }

  // PDF: rows wrap (no truncation), heights adapt, header repeats per page.
  toPdf(type, data, filters = {}) {
    const schema = REPORT_SCHEMAS[type];
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A3', layout: 'landscape', margin: 28, bufferPages: true });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).font('Helvetica-Bold').fillColor('#111').text(schema.title, { align: 'left' });
      doc.moveDown(0.2);
      doc.fontSize(9).font('Helvetica').fillColor('#666');
      const filterLine = [
        filters.startDate && filters.endDate
          ? `Period: ${filters.startDate} \u2192 ${filters.endDate}`
          : 'Period: All time',
        `Records: ${data.length}`,
        `Generated: ${formatNumericDateTime(new Date())}`,
      ].join('   |   ');
      doc.text(filterLine);
      doc.moveDown(0.6);

      const columns = schema.columns;
      const totalWidth = columns.reduce((s, c) => s + c.pdfWidth, 0);
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const scale = pageWidth / totalWidth;
      const colWidths = columns.map((c) => c.pdfWidth * scale);

      const PADDING_X = 4;
      const PADDING_Y = 4;
      const FONT_SIZE = 7.5;
      const LINE_HEIGHT = FONT_SIZE * 1.25;
      const startX = doc.page.margins.left;

      const cellText = (row, col) => formatCellForPdf(row[col.key], col.key);

      const measureRow = (cells) => {
        let maxH = LINE_HEIGHT;
        cells.forEach((text, i) => {
          doc.fontSize(FONT_SIZE).font('Helvetica');
          const h = doc.heightOfString(text || '', { width: colWidths[i] - PADDING_X * 2 });
          if (h > maxH) maxH = h;
        });
        return Math.max(LINE_HEIGHT, maxH) + PADDING_Y * 2;
      };

      const drawRow = (cells, y, isHeader = false) => {
        const rowH = measureRow(cells);
        if (isHeader) {
          doc.rect(startX, y, pageWidth, rowH).fillAndStroke('#1f2937', '#1f2937');
          doc.fillColor('#fff').font('Helvetica-Bold');
        } else {
          doc.fillColor('#111').font('Helvetica');
        }
        doc.fontSize(FONT_SIZE);
        let x = startX;
        cells.forEach((text, i) => {
          doc.text(text || '', x + PADDING_X, y + PADDING_Y, {
            width: colWidths[i] - PADDING_X * 2,
            // No ellipsis — wrap to multiple lines so the full value is visible.
          });
          x += colWidths[i];
        });
        if (!isHeader) {
          doc.strokeColor('#e5e7eb').lineWidth(0.5)
            .moveTo(startX, y + rowH).lineTo(startX + pageWidth, y + rowH).stroke();
        }
        return rowH;
      };

      const headerCells = columns.map((c) => c.header);
      let y = doc.y;
      y += drawRow(headerCells, y, true);

      const pageBottom = doc.page.height - doc.page.margins.bottom - 20;

      for (const row of data) {
        const cells = columns.map((c) => cellText(row, c));
        const rowH = measureRow(cells);
        if (y + rowH > pageBottom) {
          doc.addPage();
          y = doc.page.margins.top;
          y += drawRow(headerCells, y, true);
        }
        y += drawRow(cells, y);
      }

      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        doc.fontSize(8).fillColor('#999').font('Helvetica')
          .text(`Page ${i + 1} of ${range.count}`,
            doc.page.margins.left,
            doc.page.height - doc.page.margins.bottom + 5,
            { align: 'center', width: pageWidth });
      }

      doc.end();
    });
  }


  async getAttendanceData({ startDate, endDate, userId, departmentId, locationId }) {
    const { Attendance, User, Department, Location } = this.db;
    const where = { status: 'clocked_out' };
    dateRange(where, 'clockIn', startDate, endDate, true);
    if (userId) where.userId = userId;

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;
    if (locationId) userWhere.locationId = locationId;

    const rows = await Attendance.findAll({
      where,
      include: [
        { model: User, as: 'user', ...(Object.keys(userWhere).length && { where: userWhere }), attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [{ model: Department, as: 'department', attributes: ['name'] }, { model: Location, as: 'location', attributes: ['name'] }] },
        { model: Location, as: 'location', attributes: ['name'] },
      ],
      order: [['clockIn', 'DESC']],
    });

    return rows.map((r) => {
      // Work time is total elapsed clockOut - clockIn (no break subtraction)
      const workMins = minutesBetween(r.clockIn, r.clockOut);
      return {
        id: r.id, employeeId: r.user.id, employeeName: fullName(r.user), email: r.user.email,
        department: optName(r.user.department), userLocation: optName(r.user.location),
        clockIn: formatNumericDateTime(r.clockIn),
        clockOut: formatNumericDateTime(r.clockOut),
        workMinutes: workMins, workHours: (workMins / 60).toFixed(2),
        clockLocation: optName(r.location), notes: r.notes || '',
      };
    });
  }

  async getShiftsData({ startDate, endDate, userId, departmentId, locationId, status }) {
    const { Shift, User, Department, Location } = this.db;
    const where = {};
    dateRange(where, 'date', startDate, endDate);
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (locationId) where.locationId = locationId;

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;

    const rows = await Shift.findAll({
      where,
      include: [
        { model: User, as: 'user', ...(Object.keys(userWhere).length && { where: userWhere }), attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [{ model: Department, as: 'department', attributes: ['name'] }] },
        { model: Location, as: 'location', attributes: ['name'] },
        { model: User, as: 'creator', attributes: ['firstName', 'lastName'] },
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });

    return rows.map((r) => ({
      id: r.id, employeeId: r.user.id, employeeName: fullName(r.user), email: r.user.email,
      department: optName(r.user.department), date: r.date, startTime: r.startTime, endTime: r.endTime,
      scheduledHours: calcShiftHrs(r.startTime, r.endTime),
      location: optName(r.location), status: r.status, createdBy: r.creator ? fullName(r.creator) : '', notes: r.notes || '',
    }));
  }

  async getLeavesData({ startDate, endDate, userId, departmentId, status, type }) {
    const { Leave, User, Department } = this.db;
    const where = {};
    if (startDate) where.startDate = { [Op.gte]: startDate };
    if (endDate) where.endDate = { [Op.lte]: endDate };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (type) where.type = type;

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;

    const rows = await Leave.findAll({
      where,
      include: [
        { model: User, as: 'user', ...(Object.keys(userWhere).length && { where: userWhere }), attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [{ model: Department, as: 'department', attributes: ['name'] }] },
        { model: User, as: 'reviewer', attributes: ['firstName', 'lastName'] },
      ],
      order: [['startDate', 'DESC']],
    });

    return rows.map((r) => ({
      id: r.id, employeeId: r.user.id, employeeName: fullName(r.user), email: r.user.email,
      department: optName(r.user.department), type: r.type, startDate: r.startDate, endDate: r.endDate,
      totalDays: r.totalDays, status: r.status, reason: r.reason || '',
      reviewedBy: r.reviewer ? fullName(r.reviewer) : '', reviewedAt: formatNumericDateTime(r.reviewedAt), reviewNotes: r.reviewNotes || '',
    }));
  }

  async getSummaryData({ startDate, endDate, departmentId }) {
    const { Attendance, User, Department } = this.db;
    const where = { status: 'clocked_out' };
    dateRange(where, 'clockIn', startDate, endDate, true);

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;

    const rows = await Attendance.findAll({
      where,
      include: [{ model: User, as: 'user', ...(Object.keys(userWhere).length && { where: userWhere }), attributes: ['id', 'firstName', 'lastName'],
        include: [{ model: Department, as: 'department', attributes: ['name'] }] }],
      attributes: ['userId', 'clockIn', 'clockOut'],
    });

    const map = {};
    for (const r of rows) {
      const s = map[r.userId] ??= { employeeId: r.user.id, employeeName: fullName(r.user), department: optName(r.user.department), totalDays: 0, totalWorkMinutes: 0 };
      s.totalDays++;
      s.totalWorkMinutes += minutesBetween(r.clockIn, r.clockOut);
    }

    return Object.values(map).map((u) => ({
      ...u,
      totalWorkHours: (u.totalWorkMinutes / 60).toFixed(2),
      avgWorkHoursPerDay: u.totalDays ? (u.totalWorkMinutes / 60 / u.totalDays).toFixed(2) : '0',
    }));
  }
}

export default ReportService;
