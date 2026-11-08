import { AppData } from '../types';
import { calculateGlucoseStats, classifyGlucose, PERIOD_LABELS } from './diabetesCalc';
import { DIABETES_TIPS } from '../data/diabetesTips';

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
 * Generate a comprehensive standalone offline HTML handbook & practical companion
 * Ready to use anywhere, anytime without internet, across all categories.
 */
export function exportOfflineDiabetesCompanionHTML(data: AppData, days = 30): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const stats = calculateGlucoseStats(data.glucoseLogs, days);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const recentLogs = data.glucoseLogs
    .filter((g) => g.date >= cutoffStr)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  // Serialize existing logs as JSON for offline interactivity
  const initialLogsJson = JSON.stringify(recentLogs);
  const initialProfileJson = JSON.stringify(data.profile);
  const initialMedsJson = JSON.stringify(data.medSchedules.filter((m) => m.isActive));
  const tipsJson = JSON.stringify(DIABETES_TIPS);

  const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>คู่มือและสมุดบันทึกเบาหวานฉบับพกพา (ใช้งานออฟไลน์) - ${data.profile.name}</title>
  <style>
    :root {
      --primary: #0d9488;
      --primary-dark: #0f766e;
      --accent: #0284c7;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #0f172a;
      --muted: #64748b;
      --border: #e2e8f0;
      --green: #10b981;
      --amber: #f59e0b;
      --rose: #f43f5e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Thai", Tahoma, sans-serif;
      line-height: 1.6;
      color: var(--text);
      background-color: var(--bg);
      padding: 12px;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
      background: var(--card-bg);
      border-radius: 24px;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    /* Banner */
    .hero {
      background: linear-gradient(135deg, #115e59 0%, #0f766e 50%, #047857 100%);
      color: #ffffff;
      padding: 24px;
      position: relative;
    }
    .hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(4px);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .hero h1 {
      font-size: 22px;
      line-height: 1.3;
      margin-bottom: 6px;
    }
    .hero-meta {
      font-size: 13px;
      opacity: 0.92;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
    }
    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      text-decoration: none;
    }
    .btn-white {
      background: #ffffff;
      color: #0f766e;
    }
    .btn-white:hover { background: #f1f5f9; }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.3); }
    .btn-primary {
      background: var(--primary);
      color: #ffffff;
    }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-danger {
      background: var(--rose);
      color: #ffffff;
    }

    /* Tabs Navigation */
    .tabs-bar {
      display: flex;
      overflow-x: auto;
      background: #f1f5f9;
      border-bottom: 1px solid var(--border);
      padding: 6px 12px;
      gap: 6px;
      scrollbar-width: thin;
    }
    .tab-btn {
      padding: 8px 14px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: #ffffff;
      color: var(--primary-dark);
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }

    /* Content Pages */
    .tab-pane {
      display: none;
      padding: 24px;
    }
    .tab-pane.active {
      display: block;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #f8fafc;
      padding: 16px;
      border-radius: 16px;
      border: 1px solid var(--border);
    }
    .stat-title {
      font-size: 12px;
      color: var(--muted);
      font-weight: 500;
      margin-bottom: 4px;
    }
    .stat-val {
      font-size: 26px;
      font-weight: 700;
      font-family: monospace;
    }

    /* Tip Cards */
    .tips-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    @media (min-width: 768px) {
      .tips-grid { grid-template-columns: 1fr 1fr; }
    }
    .tip-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      transition: transform 0.2s;
      position: relative;
    }
    .tip-card:hover {
      border-color: var(--primary);
    }
    .tip-tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .tag-green { background: #dcfce7; color: #15803d; }
    .tag-amber { background: #fef3c7; color: #b45309; }
    .tag-rose { background: #ffe4e6; color: #be123c; }
    .tag-blue { background: #e0f2fe; color: #0369a1; }
    .tag-purple { background: #f3e8ff; color: #7e22ce; }

    .tip-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 6px;
    }
    .tip-summary {
      font-size: 13px;
      color: #334155;
      margin-bottom: 10px;
    }
    .tip-action-box {
      background: #f8fafc;
      border-left: 3px solid var(--primary);
      padding: 10px 12px;
      border-radius: 0 8px 8px 0;
      font-size: 12px;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .tip-footer {
      font-size: 11px;
      color: var(--muted);
      border-top: 1px dashed var(--border);
      padding-top: 8px;
    }

    /* Logger Form */
    .form-card {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 24px;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .form-group label {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }
    .form-group input, .form-group select {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 14px;
      background: #ffffff;
      outline: none;
    }
    .form-group input:focus, .form-group select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 13px;
    }
    th {
      background: #f1f5f9;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 2px solid var(--border);
      color: #475569;
      font-weight: 600;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
    }

    /* Emergency Alert Box */
    .emergency-box {
      background: #fff1f2;
      border: 2px solid #fda4af;
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 20px;
    }
    .emergency-title {
      color: #9f1239;
      font-size: 16px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    /* Print & Offline footer */
    .footer {
      background: #f8fafc;
      border-top: 1px solid var(--border);
      padding: 16px 24px;
      font-size: 12px;
      color: var(--muted);
      text-align: center;
    }

    @media print {
      body { background: #ffffff; padding: 0; }
      .container { border: none; box-shadow: none; max-width: 100%; }
      .tabs-bar, .hero-actions, .form-card, #add-log-section { display: none !important; }
      .tab-pane { display: block !important; padding: 12px 0 !important; page-break-after: auto; }
      .stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Top Hero Header -->
    <div class="hero">
      <div class="hero-tag">
        📱 ไฟล์คู่มือและบันทึกออฟไลน์ (เปิดใช้งานได้ทันทีแม้ไม่มีอินเทอร์เน็ต)
      </div>
      <h1>สมุดคู่มือและบันทึกสุขภาพเบาหวานฉบับพกพา</h1>
      <div class="hero-meta">
        <div>👤 ผู้ป่วย: <b>${data.profile.name}</b> (อายุ ${data.profile.age} ปี)</div>
        <div>🏥 สถานพยาบาล: <b>${data.profile.hospitalName}</b></div>
        <div>🩺 แพทย์ผู้ดูแล: <b>${data.profile.doctorName}</b></div>
        <div>📅 วันที่ออกเอกสาร: <b>${dateStr}</b></div>
      </div>

      <div class="hero-actions">
        <button class="btn btn-white" onclick="window.print()">
          🖨️ พิมพ์เอกสาร / บันทึกเป็น PDF
        </button>
        <button class="btn btn-secondary" onclick="exportOfflineLogsCSV()">
          📊 ดาวน์โหลดข้อมูลตาราง Excel (.csv)
        </button>
        <button class="btn btn-secondary" onclick="switchTab('tab-logger')">
          ➕ บันทึกค่าน้ำตาลใหม่ออฟไลน์
        </button>
      </div>
    </div>

    <!-- Navigation Tabs Bar -->
    <div class="tabs-bar" id="tabsBar">
      <button class="tab-btn active" onclick="switchTab('tab-dashboard')">📊 สรุปสุขภาพ & ดัชนี</button>
      <button class="tab-btn" onclick="switchTab('tab-logger')">✍️ บันทึกค่าน้ำตาลออฟไลน์</button>
      <button class="tab-btn" onclick="switchTab('tab-all-tips')">📘 คู่มือดูแลตนเองครบทุกหมวด</button>
      <button class="tab-btn" onclick="switchTab('tab-meds')">💊 ยา & วิธีเก็บอินซูลิน</button>
      <button class="tab-btn" onclick="switchTab('tab-hypo')">🚨 น้ำตาลต่ำ & กฎ 15-15</button>
      <button class="tab-btn" onclick="switchTab('tab-foot')">🦶 ดูแลเท้าป้องกันตัดขา</button>
    </div>

    <!-- TAB 1: Dashboard & Summary -->
    <div id="tab-dashboard" class="tab-pane active">
      <h2 style="font-size: 18px; margin-bottom: 12px;">📊 ดัชนีชี้วัดสุขภาพเบาหวาน (${days} วันที่ผ่านมา)</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">ค่าน้ำตาลเฉลี่ย</div>
          <div class="stat-val" id="stat-avg" style="color: #0d9488;">${stats.average} <span style="font-size: 13px; color: #64748b;">mg/dL</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-title">ประมาณการ HbA1c (eA1c)</div>
          <div class="stat-val" id="stat-a1c" style="color: #0284c7;">${stats.estimatedA1c}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">ในเกณฑ์เป้าหมาย (TIR 70-180)</div>
          <div class="stat-val" id="stat-tir" style="color: #10b981;">${stats.timeInRangePercent}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">ความถี่น้ำตาลต่ำ (&lt;70)</div>
          <div class="stat-val" id="stat-hypo" style="color: ${stats.hypoEventsCount > 0 ? '#f43f5e' : '#10b981'};">${stats.hypoEventsCount} <span style="font-size: 13px; color: #64748b;">ครั้ง</span></div>
        </div>
      </div>

      <div style="background: #f1f5f9; padding: 14px 18px; border-radius: 12px; margin-bottom: 24px; font-size: 13px;">
        💡 <b>เคล็ดลับช่วยเหลือผู้ป่วย:</b> ไฟล์ HTML นี้สามารถส่งทาง LINE หรือบลูทูธให้ผู้ป่วยหรือ อสม. ประจำหมู่บ้าน เปิดดูได้บนมือถือทุกเครื่องแม้อยู่ในพื้นที่ไม่มีสัญญาณเน็ต!
      </div>

      <h3 style="font-size: 16px; margin-bottom: 10px;">📋 ประวัติการเจาะตรวจน้ำตาลล่าสุด</h3>
      <div style="overflow-x: auto;">
        <table id="logsTable">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>เวลา</th>
              <th>ค่าน้ำตาล (mg/dL)</th>
              <th>ช่วงเวลา</th>
              <th>การประเมิน</th>
              <th>บันทึกเพิ่มเติม</th>
            </tr>
          </thead>
          <tbody id="logsTableBody">
            <!-- Dynamically rendered via JS -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 2: Offline Logger -->
    <div id="tab-logger" class="tab-pane">
      <h2 style="font-size: 18px; margin-bottom: 6px;">✍️ บันทึกค่าน้ำตาลและความดันออฟไลน์</h2>
      <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">
        ท่านสามารถพิมพ์บันทึกค่าน้ำตาลในหน้านี้ได้ตลอดเวลา ข้อมูลจะถูกบันทึกเก็บไว้ในเครื่องโทรศัพท์นี้ทันที แม้ไม่มีเน็ต
      </p>

      <div class="form-card" id="add-log-section">
        <form id="offlineLogForm" onsubmit="handleSaveLog(event)">
          <div class="form-row">
            <div class="form-group">
              <label>วันที่ตรวจ</label>
              <input type="date" id="inputDate" required />
            </div>
            <div class="form-group">
              <label>เวลาตรวจ</label>
              <input type="time" id="inputTime" required />
            </div>
            <div class="form-group">
              <label>ค่าน้ำตาล (mg/dL) *</label>
              <input type="number" id="inputValue" min="20" max="600" placeholder="เช่น 115" required />
            </div>
            <div class="form-group">
              <label>ช่วงเวลาที่เจาะ</label>
              <select id="inputPeriod">
                <option value="fasting">ก่อนอาหารเช้า (อดอาหาร 8 ชม.)</option>
                <option value="before_meal">ก่อนอาหารกลางวัน/เย็น</option>
                <option value="after_meal">หลังอาหาร 2 ชม.</option>
                <option value="bedtime">ก่อนนอน</option>
                <option value="night">กลางดึก (02:00-04:00)</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="grid-column: span 2;">
              <label>บันทึกเพิ่มเติม (อาหารที่กิน / อาการผิดปกติ)</label>
              <input type="text" id="inputNote" placeholder="เช่น เดินแกว่งแขน 15 นาที, รู้สึกหวิวๆ นิดหน่อย" />
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="submit" class="btn btn-primary">
              💾 บันทึกข้อมูลลงเครื่อง
            </button>
            <button type="button" class="btn btn-white" onclick="document.getElementById('offlineLogForm').reset()">
              ล้างฟอร์ม
            </button>
          </div>
        </form>
      </div>

      <div id="saveFeedback" style="display: none; padding: 10px 14px; background: #dcfce7; color: #166534; border-radius: 10px; margin-bottom: 16px; font-size: 13px; font-weight: 600;">
        ✅ บันทึกค่าน้ำตาลสำเร็จแล้ว และอัปเดตสถิติเรียบร้อย!
      </div>
    </div>

    <!-- TAB 3: All Diabetes Tips -->
    <div id="tab-all-tips" class="tab-pane">
      <h2 style="font-size: 18px; margin-bottom: 6px;">📘 คู่มือดูแลเบาหวานฉบับพกพา (ครบทุกหมวดหมู่)</h2>
      <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">
        คำแนะนำที่อิงตามแนวทางเวชปฏิบัติสมาคมโรคเบาหวานแห่งประเทศไทยฯ และกระทรวงสาธารณสุข เน้นวิธีทำได้จริงและประหยัดค่าใช้จ่าย
      </p>

      <div class="tips-grid" id="allTipsContainer">
        <!-- Rendered by JS -->
      </div>
    </div>

    <!-- TAB 4: Medication & Fridge-Free Insulin -->
    <div id="tab-meds" class="tab-pane">
      <h2 style="font-size: 18px; margin-bottom: 8px;">💊 ยาและการเก็บรักษาอินซูลินอย่างปลอดภัย</h2>
      
      <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px; padding: 18px; margin-bottom: 20px;">
        <h3 style="color: #6b21a8; font-size: 16px; margin-bottom: 6px;">🧊 เทคนิคการเก็บอินซูลินสำหรับบ้านที่ไม่มีตู้เย็น</h3>
        <p style="font-size: 13px; color: #4c1d95; line-height: 1.6;">
          อินซูลินขวดหรือหลอดยาที่กำลังเปิดใช้อยู่ สามารถเก็บในอุณหภูมิห้อง (ไม่เกิน 30°C) ในที่ร่มและมีอากาศถ่ายเทได้นานถึง 28-30 วันโดยยาไม่เสื่อมสภาพ
        </p>
        <ul style="margin: 10px 0 0 20px; font-size: 13px; color: #581c87; line-height: 1.7;">
          <li><b>ใช้กระติกน้ำแข็ง:</b> ห่อหลอดยาด้วยผ้าหนาๆ ก่อนใส่ในกระติก เพื่อป้องกันไม่ให้ยาโดนน้ำแข็งโดยตรงจนเป็นเกล็ดน้ำแข็ง (หากอินซูลินแข็งตัว ยาจะเสียทันที)</li>
          <li><b>ใช้หม้อดินเผาหล่อน้ำ:</b> นำอินซูลินใส่ถุงซิปล็อคกันน้ำ วางในถ้วยเล็กแล้วใส่ในหม้อดินเผาที่มีน้ำหล่อไว้ด้านนอก ตั้งในที่ร่ม ลมพัดผ่าน ความเย็นจากการระเหยของดินเผาช่วยรักษาอุณหภูมิยาได้ดี</li>
          <li><b>ห้ามวางไว้หน้ารถ หรือบริเวณที่แดดส่องถึงโดยเด็ดขาด</b></li>
        </ul>
      </div>

      <h3 style="font-size: 16px; margin-bottom: 10px;">📋 ตารางยาและอินซูลินที่แพทย์สั่ง</h3>
      <div id="medsListDisplay" style="background: #f8fafc; border: 1px solid var(--border); border-radius: 14px; padding: 16px;">
        <!-- Meds injected by JS -->
      </div>

      <!-- ICR Guide Box -->
      <div style="margin-top: 16px; background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 16px; padding: 18px;">
        <h3 style="color: #86198f; font-size: 16px; margin-bottom: 6px;">💉 การคำนวณอัตราส่วนอินซูลินต่อคาร์บ (Insulin-to-Carb Ratio : ICR)</h3>
        <p style="font-size: 13px; color: #701a75; line-height: 1.6;">
          สำหรับผู้ที่ใช้อินซูลินออกฤทธิ์เร็วคุมมื้ออาหาร (เช่น NovoRapid, Humalog, Apidra):
        </p>
        <ul style="margin: 8px 0 0 20px; font-size: 13px; color: #701a75; line-height: 1.7;">
          <li><b>สูตรกฎ 500:</b> <span style="font-family: monospace; background: #fae8ff; padding: 2px 6px; border-radius: 6px;">ICR = 500 ÷ อินซูลินรวมต่อวัน (TDD)</span></li>
          <li><b>ตัวอย่าง:</b> หากฉีดอินซูลินรวมวันละ 26 ยูนิต → ICR = 500 ÷ 26 ≈ <b>19 กรัม</b> (อินซูลิน 1 ยูนิตคุมคาร์บได้ 19 กรัม หรือข้าวสวย ~1.3 ทัพพี)</li>
          <li><b>การคำนวณขนาดยาฉีด:</b> <span style="font-family: monospace; background: #fae8ff; padding: 2px 6px; border-radius: 6px;">ขนาดยา = คาร์โบไฮเดรตในมื้อ (กรัม) ÷ ICR</span></li>
          <li><b>สำคัญ:</b> ผู้ป่วยต้องปรึกษาแพทย์หรือทีมให้ความรู้เบาหวานเพื่อกำหนดอัตราส่วนเฉพาะบุคคลอย่างปลอดภัย</li>
        </ul>
      </div>

      <div style="margin-top: 16px; padding: 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; font-size: 13px; color: #92400e;">
        ⚠️ <b>ข้อห้ามสำคัญ:</b> ห้ามหยุดยาหรือปรับขนาดยาเองเด็ดขาด แม้ผลตรวจน้ำตาลจะลดลงแล้ว เพราะยาช่วยประคองตับอ่อนและป้องกันโรคไตเสื่อมระยะยาว
      </div>
    </div>

    <!-- TAB 5: Hypo Emergency & 15-15 Rule -->
    <div id="tab-hypo" class="tab-pane">
      <div class="emergency-box">
        <div class="emergency-title">🚨 ภาวะน้ำตาลในเลือดต่ำ (&lt; 70 mg/dL) อันตรายถึงชีวิต</div>
        <p style="font-size: 14px; color: #881337; margin-bottom: 12px;">
          หากมีอาการ: <b>ใจสั่น มือสั่น เหงื่อแตกท่วมตัว หน้ามืด ตาพร่า อารมณ์ฉุนเฉียว หิวโซ หรือพูดจาสับสน</b> ให้รีบทำตามกฎ 15-15 ทันที
        </p>

        <div style="background: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #fecdd3;">
          <h4 style="color: #be123c; font-size: 15px; margin-bottom: 8px;">กฎ 15-15 กู้ชีวิต (The 15-15 Rule):</h4>
          <ol style="margin-left: 20px; font-size: 13px; color: #4c0519; line-height: 1.8;">
            <li><b>กินคาร์โบไฮเดรตดูดซึมเร็ว 15 กรัมทันที:</b>
              <ul style="margin-left: 16px; list-style-type: circle;">
                <li>น้ำหวานเฮลซ์บลูบอย 1 ช้อนโต๊ะผสมน้ำครึ่งแก้ว หรือ</li>
                <li>น้ำผลไม้กล่องเล็ก หรือน้ำอัดลมธรรมดา (ไม่ใช่สูตรซีโร่) ครึ่งแก้ว หรือ</li>
                <li>ลูกอมรสหวาน 3 เม็ด หรือน้ำตาลทราย 3 ช้อนชาละลายน้ำ</li>
              </ul>
            </li>
            <li><b>นั่งพักนิ่งๆ 15 นาที:</b> ห้ามเดินไปไหนเพราะอาจวูบล้มกระแทก</li>
            <li><b>ตรวจน้ำตาลซ้ำ:</b> หากค่าน้ำตาลยังต่ำกว่า 70 mg/dL ให้กินน้ำหวานซ้ำอีก 1 รอบ</li>
            <li><b>เมื่อค่าน้ำตาลเกิน 70 mg/dL:</b> หากอีกเกิน 1 ชั่วโมงกว่าจะถึงมื้ออาหารหลัก ให้กินอาหารว่าง เช่น นมจืดครึ่งกล่อง หรือกล้วยน้ำว้า 1 ลูก</li>
          </ol>
        </div>

        <div style="margin-top: 12px; font-size: 12px; color: #9f1239;">
          ❌ <b>สิ่งที่ห้ามทำ:</b> ห้ามกินช็อกโกแลต เค้ก หรือไอศกรีมเพื่อแก้น้ำตาลต่ำ เพราะไขมันจะชะลอการดูดซึมน้ำตาล ทำให้ฟื้นตัวช้าและเสี่ยงหมดสติ
        </div>
      </div>
    </div>

    <!-- TAB 6: Foot Care & Amputation Prevention -->
    <div id="tab-foot" class="tab-pane">
      <h2 style="font-size: 18px; margin-bottom: 8px;">🦶 คู่มือ 5 ข้อทองคำ ดูแลเท้าเบาหวาน ป้องกันการถูกตัดขา</h2>
      <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">
        แผลที่เท้าเป็นสาเหตุอันดับ 1 ของการตัดขาในผู้ป่วยเบาหวาน เนื่องจากเส้นประสาทเสื่อมจนไม่รู้สึกเจ็บ
      </p>

      <div class="tips-grid">
        <div class="tip-card">
          <div class="tip-title">1. ส่องกระจกดูฝ่าเท้าทุกวัน</div>
          <div class="tip-summary">วางกระจกเงาไว้ที่พื้น ส่องดูใต้ฝ่าเท้า ส้นเท้า และซอกนิ้ว มองหารอยแดง ตุ่มพอง แผลถลอก หรือรอยแตก</div>
        </div>
        <div class="tip-card">
          <div class="tip-title">2. ห้ามเดินเท้าเปล่าเด็ดขาด</div>
          <div class="tip-summary">สวมรองเท้าที่มีพื้นนุ่มและส้นปิดเสมอ แม้อยู่ในบ้าน เพื่อป้องกันการเหยียบเศษแก้ว เสี้ยนไม้ หรือก้อนหิน</div>
        </div>
        <div class="tip-card">
          <div class="tip-title">3. ตัดเล็บเท้าเป็นแนวเส้นตรง</div>
          <div class="tip-summary">อย่าตัดซอกเล็บด้านข้างให้โค้งลึก เพราะจะทำให้เป็นเล็บขบและเกิดหนอง หากสายตาฝ้าฟาง ให้ลูกหลานหรือ อสม. ตัดให้</div>
        </div>
        <div class="tip-card">
          <div class="tip-title">4. ล้างเท้าและเช็ดซอกนิ้วให้แห้งสนิท</div>
          <div class="tip-summary">ล้างด้วยสบู่ธรรมดาและน้ำอุณหภูมิปกติ เช็ดซอกนิ้วให้แห้งเพื่อป้องกันเชื้อรา ทาโลชั่นที่หลังเท้าและฝ่าเท้าเพื่อกันผิวแตก แต่ห้ามทาในซอกนิ้ว</div>
        </div>
        <div class="tip-card" style="grid-column: 1 / -1;">
          <div class="tip-title">5. หากพบแผล บวมแดง มีน้ำเหลือง หรือสีผิวเปลี่ยนเป็นคล้ำ</div>
          <div class="tip-summary" style="color: #be123c; font-weight: 600;">
            ต้องรีบไปพบแพทย์ที่ รพ.สต. หรือโรงพยาบาลทันทีภายใน 24-48 ชั่วโมง ห้ามเอาเข็มบ่งหนองเอง และห้ามซื้อยาชุดมากินเองเด็ดขาด
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Footer -->
    <div class="footer">
      สมุดคู่มือสุขภาพเบาหวานฉบับพกพา (Diabetes Care Companion Offline Edition) • วันที่ออกเอกสาร: ${dateStr}<br/>
      สามารถบันทึกเก็บไว้ในโทรศัพท์มือถือ เปิดใช้งานออฟไลน์ได้ 100% โดยไม่ต้องใช้อินเทอร์เน็ต
    </div>
  </div>

  <script>
    // Initial Data Preloaded from App
    var initialLogs = ${initialLogsJson};
    var initialProfile = ${initialProfileJson};
    var initialMeds = ${initialMedsJson};
    var tipsData = ${tipsJson};

    // Load from LocalStorage if user previously added entries in this standalone file
    var savedLogs = localStorage.getItem('offline_diabetes_logs');
    var logs = savedLogs ? JSON.parse(savedLogs) : initialLogs;

    // Set today's date and time in the form
    document.addEventListener('DOMContentLoaded', function() {
      var now = new Date();
      var dateStr = now.toISOString().split('T')[0];
      var timeStr = now.toTimeString().slice(0, 5);
      
      var dateInput = document.getElementById('inputDate');
      var timeInput = document.getElementById('inputTime');
      if (dateInput) dateInput.value = dateStr;
      if (timeInput) timeInput.value = timeStr;

      renderLogsTable();
      renderAllTips();
      renderMedsList();
      recalculateStats();
    });

    // Switch Tabs
    function switchTab(tabId) {
      var panes = document.querySelectorAll('.tab-pane');
      panes.forEach(function(p) { p.classList.remove('active'); });

      var btns = document.querySelectorAll('.tab-btn');
      btns.forEach(function(b) { b.classList.remove('active'); });

      var targetPane = document.getElementById(tabId);
      if (targetPane) targetPane.classList.add('active');

      // Update active button
      btns.forEach(function(b) {
        if (b.getAttribute('onclick') && b.getAttribute('onclick').indexOf(tabId) !== -1) {
          b.classList.add('active');
        }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Render Logs Table
    function renderLogsTable() {
      var tbody = document.getElementById('logsTableBody');
      if (!tbody) return;

      if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color:#64748b;">ยังไม่มีข้อมูลบันทึก กดปุ่ม "บันทึกค่าน้ำตาลออฟไลน์" เพื่อเริ่มต้น</td></tr>';
        return;
      }

      var html = '';
      logs.slice(0, 50).forEach(function(g) {
        var color = g.value < 70 ? '#f43f5e' : (g.value <= 180 ? '#10b981' : '#f59e0b');
        var label = g.value < 70 ? 'น้ำตาลต่ำ' : (g.value <= 130 ? 'ปกติ' : (g.value <= 180 ? 'ยอมรับได้' : 'สูง'));
        var periodMap = {
          'fasting': 'ก่อนอาหารเช้า',
          'before_meal': 'ก่อนอาหาร',
          'after_meal': 'หลังอาหาร 2 ชม.',
          'bedtime': 'ก่อนนอน',
          'night': 'กลางดึก'
        };
        var periodLabel = periodMap[g.period] || g.period;

        html += '<tr>' +
          '<td style="font-family: monospace;">' + g.date + '</td>' +
          '<td style="font-family: monospace;">' + g.time + ' น.</td>' +
          '<td style="font-weight: bold; color: ' + color + '; font-size: 15px; font-family: monospace;">' + g.value + '</td>' +
          '<td>' + periodLabel + '</td>' +
          '<td><span style="display:inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: ' + color + '20; color: ' + color + ';">' + label + '</span></td>' +
          '<td style="color: #64748b;">' + (g.note || '-') + '</td>' +
        '</tr>';
      });
      tbody.innerHTML = html;
    }

    // Save Log from Offline Form
    function handleSaveLog(e) {
      e.preventDefault();
      var dateVal = document.getElementById('inputDate').value;
      var timeVal = document.getElementById('inputTime').value;
      var numVal = parseInt(document.getElementById('inputValue').value, 10);
      var periodVal = document.getElementById('inputPeriod').value;
      var noteVal = document.getElementById('inputNote').value;

      if (!numVal || isNaN(numVal)) return;

      var newLog = {
        id: 'offline_' + Date.now(),
        date: dateVal,
        time: timeVal,
        value: numVal,
        period: periodVal,
        note: noteVal
      };

      logs.unshift(newLog);
      localStorage.setItem('offline_diabetes_logs', JSON.stringify(logs));

      renderLogsTable();
      recalculateStats();

      // Show feedback
      var fb = document.getElementById('saveFeedback');
      if (fb) {
        fb.style.display = 'block';
        setTimeout(function() { fb.style.display = 'none'; }, 3500);
      }

      // Check Hypo Alert
      if (numVal < 70) {
        alert('⚠️ เตือน: ระดับน้ำตาล ' + numVal + ' mg/dL ต่ำกว่า 70! โปรดดื่มน้ำหวาน 1 แก้ว หรืออมลูกอม 3 เม็ดตามกฎ 15-15 ทันที!');
        switchTab('tab-hypo');
      } else {
        document.getElementById('inputValue').value = '';
        document.getElementById('inputNote').value = '';
      }
    }

    // Recalculate Stats in Standalone Page
    function recalculateStats() {
      if (!logs || logs.length === 0) return;
      var sum = 0;
      var inRange = 0;
      var hypo = 0;

      logs.forEach(function(l) {
        sum += l.value;
        if (l.value >= 70 && l.value <= 180) inRange++;
        if (l.value < 70) hypo++;
      });

      var avg = Math.round(sum / logs.length);
      var tir = Math.round((inRange / logs.length) * 100);
      var ea1c = ((avg + 46.7) / 28.7).toFixed(1);

      var avgElem = document.getElementById('stat-avg');
      var a1cElem = document.getElementById('stat-a1c');
      var tirElem = document.getElementById('stat-tir');
      var hypoElem = document.getElementById('stat-hypo');

      if (avgElem) avgElem.innerHTML = avg + ' <span style="font-size: 13px; color: #64748b;">mg/dL</span>';
      if (a1cElem) a1cElem.innerText = ea1c + '%';
      if (tirElem) tirElem.innerText = tir + '%';
      if (hypoElem) {
        hypoElem.innerHTML = hypo + ' <span style="font-size: 13px; color: #64748b;">ครั้ง</span>';
        hypoElem.style.color = hypo > 0 ? '#f43f5e' : '#10b981';
      }
    }

    // Render All Tips
    function renderAllTips() {
      var container = document.getElementById('allTipsContainer');
      if (!container || !tipsData) return;

      var tagColors = {
        nutrition: 'tag-green',
        medication: 'tag-purple',
        footcare: 'tag-amber',
        hypo_emergency: 'tag-rose',
        exercise: 'tag-blue',
        mental_sleep: 'tag-purple',
        healthcare_rights: 'tag-blue'
      };

      var html = '';
      tipsData.forEach(function(t) {
        var cls = tagColors[t.category] || 'tag-green';
        html += '<div class="tip-card">' +
          '<span class="tip-tag ' + cls + '">' + t.categoryLabel + '</span>' +
          '<h3 class="tip-title">' + t.title + '</h3>' +
          '<p class="tip-summary">' + t.summary + '</p>' +
          '<div class="tip-action-box">👉 <b>คำแนะนำปฏิบัติจริง:</b> ' + t.practicalAdvice + '</div>' +
          '<div style="font-size: 11px; color: #b45309; margin-bottom: 6px;">⭐ <b>ข้อควรจำ:</b> ' + t.keyTakeaway + '</div>' +
          '<div class="tip-footer">แหล่งอ้างอิง: ' + t.evidenceSource + '</div>' +
        '</div>';
      });
      container.innerHTML = html;
    }

    // Render Medications
    function renderMedsList() {
      var container = document.getElementById('medsListDisplay');
      if (!container) return;

      if (!initialMeds || initialMeds.length === 0) {
        container.innerHTML = '<p style="color: #64748b; font-size: 13px;">ไม่มีรายการยาที่บันทึกไว้ในระบบ</p>';
        return;
      }

      var html = '<ul style="list-style: none; padding: 0;">';
      initialMeds.forEach(function(m) {
        html += '<li style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">' +
          '<b style="color: #0f172a;">' + m.name + '</b> (' + m.dose + ') — เวลา: <b>' + m.times.join(', ') + ' น.</b>' +
          '<div style="font-size: 12px; color: #64748b; margin-top: 2px;">' + (m.instructions || '') + '</div>' +
        '</li>';
      });
      html += '</ul>';
      container.innerHTML = html;
    }

    // Export Offline Logs to CSV
    function exportOfflineLogsCSV() {
      if (!logs || logs.length === 0) {
        alert('ยังไม่มีข้อมูลบันทึก');
        return;
      }

      var headers = ['วันที่ (Date)', 'เวลา (Time)', 'ระดับน้ำตาล (mg/dL)', 'ช่วงเวลา (Period)', 'หมายเหตุ (Notes)'];
      var rows = logs.map(function(l) {
        return ['"' + l.date + '"', '"' + l.time + '"', l.value, '"' + (l.period || '') + '"', '"' + (l.note || '').replace(/"/g, '""') + '"'].join(',');
      });

      var csvContent = '\\uFEFF' + [headers.join(','), rows.join('\\r\\n')].join('\\r\\n');
      var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'รายงานค่าน้ำตาล_ออฟไลน์.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  </script>
</body>
</html>`;

  const filename = `คู่มือและสมุดบันทึกเบาหวานออฟไลน์_${data.profile.name.replace(/\s+/g, '_')}_${dateStr}.html`;
  triggerFileDownload(htmlContent, filename, 'text/html;charset=utf-8;');
}

/**
 * Generate a standalone offline HTML summary report file that can be opened in any browser without internet
 */
export function exportOfflineHTMLReport(data: AppData, days = 30): void {
  // Directly provide the complete, comprehensive offline companion
  exportOfflineDiabetesCompanionHTML(data, days);
}
