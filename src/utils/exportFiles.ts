import { AppData } from '../types';
import { calculateGlucoseStats, classifyGlucose, PERIOD_LABELS } from './diabetesCalc';

/**
 * Downloads data as a file with the specified filename and MIME type
 */
export function triggerFileDownload(content: string | Blob, filename: string, mimeType = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export Glucose & Vitals records as a UTF-8 BOM CSV file (Excel-friendly with Thai encoding)
 */
export function exportHealthDataToCSV(data: AppData, days = 90): void {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const filteredGlucose = data.glucoseLogs
    .filter((g) => g.date >= cutoffStr)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  // CSV Headers
  const headers = [
    'วันที่ (Date)',
    'เวลา (Time)',
    'ระดับน้ำตาล (mg/dL)',
    'ช่วงเวลาตรวจ (Period)',
    'การประเมิน (Status)',
    'ความดันตัวบน (Sys mmHg)',
    'ความดันตัวล่าง (Dia mmHg)',
    'ชีพจร (bpm)',
    'หมายเหตุ (Notes)',
  ];

  // Map glucose with vitals on same date
  const vitalsMap = new Map(data.vitalsLogs.map((v) => [`${v.date}_${v.time.slice(0, 2)}`, v]));

  const rows = filteredGlucose.map((g) => {
    const periodLabel = PERIOD_LABELS[g.period] || g.period;
    const classification = classifyGlucose(g.value, g.period);
    const nearestVital = vitalsMap.get(`${g.date}_${g.time.slice(0, 2)}`) || data.vitalsLogs.find((v) => v.date === g.date);

    return [
      `"${g.date}"`,
      `"${g.time}"`,
      g.value,
      `"${periodLabel}"`,
      `"${classification.label}"`,
      nearestVital ? nearestVital.sys : '-',
      nearestVital ? nearestVital.dia : '-',
      nearestVital ? nearestVital.pulse : '-',
      `"${(g.note || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  // UTF-8 BOM ensures Thai characters display correctly in Microsoft Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const filename = `รายงานค่าน้ำตาล_${data.profile.name.replace(/\s+/g, '_')}_${dateStr}.csv`;

  triggerFileDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export Full App Backup as JSON file
 */
export function exportAppBackupJSON(data: AppData): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const jsonStr = JSON.stringify(data, null, 2);
  const filename = `สำรองข้อมูลเบาหวานแคร์พลัส_${data.profile.name.replace(/\s+/g, '_')}_${dateStr}.json`;
  triggerFileDownload(jsonStr, filename, 'application/json;charset=utf-8;');
}

/**
 * Generate a standalone offline HTML summary report file that can be opened in any browser without internet
 */
export function exportOfflineHTMLReport(data: AppData, days = 30): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const stats = calculateGlucoseStats(data.glucoseLogs, days);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const recentLogs = data.glucoseLogs
    .filter((g) => g.date >= cutoffStr)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const tableRows = recentLogs
    .map((g) => {
      const pLabel = PERIOD_LABELS[g.period] || g.period;
      const cls = classifyGlucose(g.value, g.period);
      const color = g.value < 70 ? '#f43f5e' : g.value <= 180 ? '#10b981' : '#f59e0b';
      return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${g.date}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${g.time} น.</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${color}; font-size: 16px; font-family: monospace;">${g.value}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${pLabel}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;"><span style="display:inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: ${color}20; color: ${color}; border: 1px solid ${color}40;">${cls.label}</span></td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${g.note || '-'}</td>
        </tr>
      `;
    })
    .join('');

  const medList = data.medSchedules
    .filter((m) => m.isActive)
    .map(
      (m) => `
      <li style="margin-bottom: 8px;">
        <b>${m.name}</b> (${m.dose}) — เวลา ${m.times.join(', ')} น.
        <div style="font-size: 12px; color: #64748b;">${m.instructions}</div>
      </li>
    `
    )
    .join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รายงานสรุปผลสุขภาพเบาหวาน - ${data.profile.name}</title>
  <style>
    body { font-family: 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; padding: 24px; margin: 0; }
    .card { max-width: 900px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0f766e, #047857); color: #ffffff; padding: 28px; }
    .header h1 { margin: 0 0 6px 0; font-size: 24px; }
    .content { padding: 28px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .stat-box { background: #f1f5f9; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .stat-box .title { font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .stat-box .value { font-size: 26px; font-weight: bold; color: #0f172a; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
    th { background: #f8fafc; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; font-weight: 600; color: #475569; }
    .section-title { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 24px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; font-size: 12px; color: #94a3b8; text-align: center; }
    @media print { body { background: #ffffff; padding: 0; } .card { box-shadow: none; border: none; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🩺 รายงานติดตามสุขภาพเบาหวาน (Diabetes Health Summary)</h1>
      <div>ผู้ป่วย: <b>${data.profile.name}</b> (อายุ ${data.profile.age} ปี, ${data.profile.gender === 'male' ? 'เพศชาย' : 'เพศหญิง'})</div>
      <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">แพทย์ผู้ดูแล: ${data.profile.doctorName} • ${data.profile.hospitalName}</div>
      <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">วันที่ออกรายงาน: ${dateStr} (ย้อนหลัง ${days} วัน)</div>
    </div>

    <div class="content">
      <div class="section-title">📊 สรุปดัชนีชี้วัดหลัก (${days} วันที่ผ่านมา)</div>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="title">ค่าน้ำตาลเฉลี่ย</div>
          <div class="value" style="color: #047857;">${stats.average} <span style="font-size: 14px; color: #64748b;">mg/dL</span></div>
        </div>
        <div class="stat-box">
          <div class="title">ประเมิน HbA1c (eA1c)</div>
          <div class="value" style="color: #0284c7;">${stats.estimatedA1c}%</div>
        </div>
        <div class="stat-box">
          <div class="title">ในเกณฑ์เป้าหมาย (TIR 70-180)</div>
          <div class="value" style="color: #059669;">${stats.timeInRangePercent}%</div>
        </div>
        <div class="stat-box">
          <div class="title">ความถี่น้ำตาลต่ำ (&lt;70)</div>
          <div class="value" style="color: ${stats.hypoEventsCount > 0 ? '#e11d48' : '#059669'};">${stats.hypoEventsCount} <span style="font-size: 14px; color: #64748b;">ครั้ง</span></div>
        </div>
      </div>

      <div class="section-title">💊 รายการยาและอินซูลินที่ใช้อยู่ปัจจุบัน</div>
      <ul style="background: #f8fafc; padding: 16px 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 0 0 24px 0;">
        ${medList || '<li>ไม่มีรายการยาที่บันทึกไว้</li>'}
      </ul>

      <div class="section-title">📝 บันทึกการตรวจระดับน้ำตาล (${recentLogs.length} รายการ)</div>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>เวลา</th>
              <th>ค่าน้ำตาล</th>
              <th>มื้อ/ช่วงเวลา</th>
              <th>การประเมิน</th>
              <th>บันทึกเพิ่มเติม</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="6" style="text-align:center; padding: 20px;">ไม่มีข้อมูลการเจาะตรวจในช่วงนี้</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      เอกสารนี้สร้างจากแอปพลิเคชัน "เบาหวาน แคร์พลัส" สำหรับส่งต่อแพทย์ผู้รักษาหรือครอบครัว • วันที่ ${dateStr}
    </div>
  </div>
</body>
</html>`;

  const filename = `สรุปสุขภาพเบาหวาน_${data.profile.name.replace(/\s+/g, '_')}_${dateStr}.html`;
  triggerFileDownload(htmlContent, filename, 'text/html;charset=utf-8;');
}
