import { useState, useRef } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Activity, 
  Heart, 
  Pill, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle,
  User,
  Clock,
  FileSpreadsheet,
  Share2
} from 'lucide-react';
import { AppData } from '../types';
import { calculateGlucoseStats, classifyGlucose, PERIOD_LABELS } from '../utils/diabetesCalc';
import { exportHealthDataToCSV, exportOfflineHTMLReport } from '../utils/exportFiles';

interface DoctorDashboardViewProps {
  data: AppData;
  onOpenShareModal?: () => void;
}

export function DoctorDashboardView({ data, onOpenShareModal }: DoctorDashboardViewProps) {
  const [reportDays, setReportDays] = useState<14 | 30 | 90>(30);
  const printRef = useRef<HTMLDivElement>(null);

  const stats = calculateGlucoseStats(data.glucoseLogs, reportDays);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - reportDays);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const recentGlucose = data.glucoseLogs
    .filter(g => g.date >= cutoffStr)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const recentVitals = data.vitalsLogs.filter(v => v.date >= cutoffStr);
  const avgSys = recentVitals.length > 0 
    ? Math.round(recentVitals.reduce((s, v) => s + v.sys, 0) / recentVitals.length)
    : 120;
  const avgDia = recentVitals.length > 0
    ? Math.round(recentVitals.reduce((s, v) => s + v.dia, 0) / recentVitals.length)
    : 80;
  const avgPulse = recentVitals.length > 0
    ? Math.round(recentVitals.reduce((s, v) => s + v.pulse, 0) / recentVitals.length)
    : 72;

  // Medication adherence calculation
  const totalMedLogs = data.medLogs.filter(l => l.date >= cutoffStr);
  const takenMeds = totalMedLogs.filter(l => l.status === 'taken').length;
  const adherenceRate = totalMedLogs.length > 0 ? Math.round((takenMeds / totalMedLogs.length) * 100) : 92;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            รายงานสรุปสำหรับแพทย์ (Doctor Clinical Summary)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            สรุปข้อมูลสุขภาพย้อนหลัง {reportDays} วัน พร้อมดัชนีชี้วัดเพื่อใช้ประกอบการตรวจวินิจฉัยของแพทย์
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Day range toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {([14, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setReportDays(d)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  reportDays === d
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d} วัน
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95"
            title="พิมพ์หรือบันทึกเป็น PDF"
          >
            <Printer className="w-4 h-4" /> พิมพ์ / PDF
          </button>

          <button
            onClick={() => exportHealthDataToCSV(data, reportDays)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow transition-all active:scale-95"
            title="ดาวน์โหลดไฟล์ตารางสำหรับเปิดใน Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" /> Excel (CSV)
          </button>

          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl shadow transition-all active:scale-95"
              title="เปิดหน้าต่างดาวน์โหลดไฟล์ & แชร์"
            >
              <Share2 className="w-4 h-4 text-cyan-400" /> แชร์ไฟล์
            </button>
          )}
        </div>
      </div>

      {/* Printable Clinical Sheet Container */}
      <div ref={printRef} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-7 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏥</span>
              <h3 className="text-xl font-bold text-white print:text-black">
                รายงานติดตามผลการรักษาผู้ป่วยเบาหวาน (Diabetes Care Report)
              </h3>
            </div>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
              ช่วงวันที่: <b>{cutoffStr} ถึง {new Date().toISOString().split('T')[0]}</b> (สรุปผล {reportDays} วัน)
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-400 print:text-gray-600">
            <div>แพทย์ผู้ดูแล: <b className="text-white print:text-black">{data.profile.doctorName}</b></div>
            <div>โรงพยาบาล: {data.profile.hospitalName}</div>
          </div>
        </div>

        {/* Patient Profile Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/70 print:bg-gray-100 rounded-2xl p-4 border border-slate-800 print:border-gray-300">
          <div>
            <span className="text-[11px] text-slate-400 print:text-gray-500">ชื่อ-นามสกุล</span>
            <div className="font-bold text-sm text-white print:text-black mt-0.5">{data.profile.name}</div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 print:text-gray-500">อายุ / เพศ</span>
            <div className="font-bold text-sm text-white print:text-black mt-0.5">{data.profile.age} ปี ({data.profile.gender === 'male' ? 'ชาย' : 'หญิง'})</div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 print:text-gray-500">การวินิจฉัย</span>
            <div className="font-bold text-sm text-emerald-400 print:text-emerald-700 mt-0.5">
              {data.profile.diabetesType === 'type1' ? 'เบาหวานชนิดที่ 1' : 'เบาหวานชนิดที่ 2'} (วินิจฉัยปี {data.profile.yearDiagnosed})
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 print:text-gray-500">เป้าหมาย Fasting / HbA1c</span>
            <div className="font-bold text-sm text-white print:text-black mt-0.5">
              70-130 mg/dL / &lt; {data.profile.targetHbA1c}%
            </div>
          </div>
        </div>

        {/* Clinical Key Indicators */}
        <div>
          <h4 className="text-sm font-bold text-cyan-400 print:text-cyan-800 uppercase tracking-wider mb-3">
            1. สรุปดัชนีชี้วัดค่าน้ำตาล (Glycemic Metrics)
          </h4>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-300 rounded-2xl p-4">
              <span className="text-xs text-slate-400 print:text-gray-600">ค่าน้ำตาลเฉลี่ย (Mean Glucose)</span>
              <div className="text-2xl font-bold font-mono text-white print:text-black mt-1">
                {stats.average} <span className="text-xs font-sans font-normal text-slate-400">mg/dL</span>
              </div>
            </div>

            <div className="bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-300 rounded-2xl p-4">
              <span className="text-xs text-slate-400 print:text-gray-600">ประเมิน HbA1c (eA1c)</span>
              <div className="text-2xl font-bold font-mono text-teal-400 print:text-teal-700 mt-1">
                {stats.estimatedA1c}%
              </div>
            </div>

            <div className="bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-300 rounded-2xl p-4">
              <span className="text-xs text-slate-400 print:text-gray-600">Time in Range (70-180 mg/dL)</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 print:text-emerald-700 mt-1">
                {stats.timeInRangePercent}%
              </div>
            </div>

            <div className="bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-300 rounded-2xl p-4">
              <span className="text-xs text-slate-400 print:text-gray-600">อุบัติการณ์น้ำตาลต่ำ (&lt;70 mg/dL)</span>
              <div className={`text-2xl font-bold font-mono mt-1 ${stats.hypoEventsCount > 0 ? 'text-rose-400 print:text-rose-700' : 'text-slate-300 print:text-black'}`}>
                {stats.hypoEventsCount} <span className="text-xs font-sans font-normal text-slate-400">ครั้ง</span>
              </div>
            </div>

          </div>
        </div>

        {/* Vitals & Medication Adherence */}
        <div>
          <h4 className="text-sm font-bold text-cyan-400 print:text-cyan-800 uppercase tracking-wider mb-3">
            2. ความดันโลหิตและการใช้ยา (Vitals & Medication Adherence)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-300 rounded-2xl p-4">
              <span className="text-xs text-slate-400 print:text-gray-600">ความดันเฉลี่ย (Average BP)</span>
              <div className="text-xl font-bold font-mono text-white print:text-black mt-1">
                {avgSys}/{avgDia} <span className="text-xs font-sans text-slate-400">mmHg</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">ชีพจรเฉลี่ย {avgPulse} bpm</span>
            </div>

            <div className="bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-300 rounded-2xl p-4">
              <span className="text-xs text-slate-400 print:text-gray-600">ความสม่ำเสมอการใช้ยา (Adherence)</span>
              <div className="text-xl font-bold font-mono text-purple-400 print:text-purple-700 mt-1">
                {adherenceRate}%
              </div>
              <span className="text-xs text-slate-500 mt-1 block">จากรายการยาทั้งหมด {data.medSchedules.length} ชนิด</span>
            </div>

            <div className="bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-300 rounded-2xl p-4">
              <span className="text-xs text-slate-400 print:text-gray-600">จำนวนบันทึกตรวจน้ำตาลทั้งหมด</span>
              <div className="text-xl font-bold font-mono text-white print:text-black mt-1">
                {recentGlucose.length} <span className="text-xs font-sans text-slate-400">ครั้ง</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">ความถี่เฉลี่ย ~{(recentGlucose.length / reportDays).toFixed(1)} ครั้ง/วัน</span>
            </div>
          </div>
        </div>

        {/* Current Active Prescriptions */}
        <div>
          <h4 className="text-sm font-bold text-cyan-400 print:text-cyan-800 uppercase tracking-wider mb-3">
            3. รายการยาและอินซูลินที่ใช้อยู่ปัจจุบัน (Current Prescriptions)
          </h4>

          <div className="overflow-x-auto border border-slate-800 print:border-gray-300 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 print:bg-gray-100 border-b border-slate-800 print:border-gray-300">
                <tr>
                  <th className="py-2.5 px-3">ชื่อยา / อินซูลิน</th>
                  <th className="py-2.5 px-3">ขนาดยา</th>
                  <th className="py-2.5 px-3">เวลาที่รับประทาน/ฉีด</th>
                  <th className="py-2.5 px-3">ความสัมพันธ์กับมื้ออาหาร</th>
                  <th className="py-2.5 px-3">คำแนะนำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                {data.medSchedules.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 px-3 font-bold text-white print:text-black">{s.name}</td>
                    <td className="py-2.5 px-3">{s.dose}</td>
                    <td className="py-2.5 px-3 font-mono">{s.times.join(', ')} น.</td>
                    <td className="py-2.5 px-3">
                      {s.mealRelation === 'before_meal' ? 'ก่อนอาหาร' : s.mealRelation === 'after_meal' ? 'หลังอาหาร' : 'ก่อนนอน'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 print:text-gray-600">{s.instructions || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent 15 Glucose Logs Table */}
        <div>
          <h4 className="text-sm font-bold text-cyan-400 print:text-cyan-800 uppercase tracking-wider mb-3">
            4. ตารางค่าน้ำตาลล่าสุด (Recent Blood Glucose Logs)
          </h4>

          <div className="overflow-x-auto border border-slate-800 print:border-gray-300 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 print:bg-gray-100 border-b border-slate-800 print:border-gray-300">
                <tr>
                  <th className="py-2.5 px-3">วันที่ / เวลา</th>
                  <th className="py-2.5 px-3">ช่วงเวลา</th>
                  <th className="py-2.5 px-3">ค่าน้ำตาล (mg/dL)</th>
                  <th className="py-2.5 px-3">การประเมิน</th>
                  <th className="py-2.5 px-3">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                {recentGlucose.slice(0, 15).map((r) => {
                  const classification = classifyGlucose(r.value, r.period);

                  return (
                    <tr key={r.id}>
                      <td className="py-2 px-3 font-mono">{r.date} {r.time} น.</td>
                      <td className="py-2 px-3">{PERIOD_LABELS[r.period]}</td>
                      <td className="py-2 px-3 font-bold font-mono text-white print:text-black">{r.value}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          classification.status === 'low' ? 'text-rose-400 print:text-rose-700' :
                          classification.status === 'normal' ? 'text-emerald-400 print:text-emerald-700' : 'text-amber-400 print:text-amber-700'
                        }`}>
                          {classification.label}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 print:text-gray-600">{r.note || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor Signature & Notes Area (for print) */}
        <div className="pt-6 border-t border-slate-800 print:border-gray-300 grid grid-cols-2 gap-8 text-xs">
          <div>
            <p className="font-semibold text-slate-400 print:text-gray-600 mb-6">ความเห็น / แผนการรักษาของแพทย์:</p>
            <div className="border-b border-slate-700 print:border-gray-400 h-16" />
          </div>

          <div className="text-right flex flex-col justify-end items-end">
            <div className="border-b border-slate-700 print:border-gray-400 w-48 mb-1" />
            <p className="text-slate-400 print:text-gray-600">ลงชื่อแพทย์ผู้ตรวจ</p>
            <p className="text-slate-500 print:text-gray-500 text-[10px]">วันที่ ____ / ____ / ________</p>
          </div>
        </div>

      </div>

    </div>
  );
}
