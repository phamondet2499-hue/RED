import { useState } from 'react';
import { 
  Activity, 
  Droplet, 
  Heart, 
  Footprints, 
  Pill, 
  Plus, 
  Check, 
  Calendar, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  BarChart2,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  ReferenceArea,
  CartesianGrid
} from 'recharts';
import { AppData, GlucoseRecord, MedicationSchedule, MedicationLog } from '../types';
import { calculateGlucoseStats, classifyGlucose, INJECTION_SITES, PERIOD_LABELS } from '../utils/diabetesCalc';
import { soundFx } from '../utils/sound';
import confetti from 'canvas-confetti';
import { DailyDiabetesTip } from './DailyDiabetesTip';

interface DashboardViewProps {
  data: AppData;
  onNavigate: (tab: any) => void;
  onLogWater: (amount: number) => void;
  onQuickToggleMed: (scheduleId: string, time: string) => void;
  onOpenQuickLogModal: (type: 'glucose' | 'medication' | 'vitals' | 'food' | 'appointment') => void;
  onOpenShareModal?: () => void;
}

export function DashboardView({
  data,
  onNavigate,
  onLogWater,
  onQuickToggleMed,
  onOpenQuickLogModal,
  onOpenShareModal,
}: DashboardViewProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [trendMode, setTrendMode] = useState<'all' | 'daily' | 'fasting'>('all');

  // 7-day Glucose Trend Data Processing
  const sevenDaysCutoff = new Date();
  sevenDaysCutoff.setDate(sevenDaysCutoff.getDate() - 6);
  sevenDaysCutoff.setHours(0, 0, 0, 0);
  const sevenDaysCutoffStr = sevenDaysCutoff.toISOString().split('T')[0];

  const last7DaysGlucoseLogs = data.glucoseLogs
    .filter(g => g.date >= sevenDaysCutoffStr)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  // 7-day stats
  const sevenDayValues = last7DaysGlucoseLogs.map(g => g.value);
  const sevenDayAvg = sevenDayValues.length > 0
    ? Math.round(sevenDayValues.reduce((s, v) => s + v, 0) / sevenDayValues.length)
    : 0;
  const sevenDayMin = sevenDayValues.length > 0 ? Math.min(...sevenDayValues) : 0;
  const sevenDayMax = sevenDayValues.length > 0 ? Math.max(...sevenDayValues) : 0;
  const sevenDayInRangeCount = sevenDayValues.filter(v => v >= 70 && v <= 180).length;
  const sevenDayBelowCount = sevenDayValues.filter(v => v < 70).length;
  const sevenDayAboveCount = sevenDayValues.filter(v => v > 180).length;
  const sevenDayTirPercent = sevenDayValues.length > 0
    ? Math.round((sevenDayInRangeCount / sevenDayValues.length) * 100)
    : 0;
  const sevenDayHypoPercent = sevenDayValues.length > 0
    ? Math.round((sevenDayBelowCount / sevenDayValues.length) * 100)
    : 0;
  const sevenDayHyperPercent = sevenDayValues.length > 0
    ? Math.round((sevenDayAboveCount / sevenDayValues.length) * 100)
    : 0;

  // Trend comparison (first half vs second half of the 7-day window)
  const halfLen = Math.floor(sevenDayValues.length / 2);
  const prevHalf = sevenDayValues.slice(0, halfLen);
  const currHalf = sevenDayValues.slice(halfLen);
  const prevHalfAvg = prevHalf.length > 0 ? prevHalf.reduce((s, v) => s + v, 0) / prevHalf.length : sevenDayAvg;
  const currHalfAvg = currHalf.length > 0 ? currHalf.reduce((s, v) => s + v, 0) / currHalf.length : sevenDayAvg;
  const trendDiff = prevHalfAvg > 0 ? Math.round(((currHalfAvg - prevHalfAvg) / prevHalfAvg) * 100) : 0;

  // Chart data for "all" mode (individual tests in chronological order)
  const chartAllReadings = last7DaysGlucoseLogs.map((r, idx) => {
    const d = new Date(r.date + 'T' + (r.time.length === 5 ? r.time + ':00' : '00:00:00'));
    const dayLabel = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
    return {
      id: r.id,
      index: idx,
      date: r.date,
      time: r.time,
      displayLabel: `${dayLabel} ${r.time} น.`,
      shortLabel: `${d.getDate()}/${d.getMonth() + 1} ${r.time}`,
      value: r.value,
      period: r.period,
      periodLabel: PERIOD_LABELS[r.period] || r.period,
      note: r.note,
    };
  });

  // Chart data for "daily" mode (daily aggregate)
  const chartDailyReadings = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const dayLogs = data.glucoseLogs.filter(g => g.date === dStr);
    const dayName = d.toLocaleDateString('th-TH', { weekday: 'short' });
    const dayNum = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    
    if (dayLogs.length > 0) {
      const vals = dayLogs.map(l => l.value);
      const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      chartDailyReadings.push({
        date: dStr,
        displayLabel: `${dayName} (${dayNum})`,
        shortLabel: `${dayName} ${d.getDate()}/${d.getMonth() + 1}`,
        value: avg,
        min,
        max,
        count: dayLogs.length,
        periodLabel: `เฉลี่ย ${dayLogs.length} ครั้ง/วัน`,
      });
    } else {
      chartDailyReadings.push({
        date: dStr,
        displayLabel: `${dayName} (${dayNum})`,
        shortLabel: `${dayName} ${d.getDate()}/${d.getMonth() + 1}`,
        value: null,
        min: null,
        max: null,
        count: 0,
        periodLabel: 'ไม่มีบันทึก',
      });
    }
  }

  // Chart data for "fasting" mode
  const chartFastingReadings = last7DaysGlucoseLogs
    .filter(g => g.period === 'fasting')
    .map((r, idx) => {
      const d = new Date(r.date + 'T' + (r.time.length === 5 ? r.time + ':00' : '00:00:00'));
      const dayLabel = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
      return {
        id: r.id,
        index: idx,
        date: r.date,
        time: r.time,
        displayLabel: `${dayLabel} (เช้า) ${r.time} น.`,
        shortLabel: `${dayLabel} ${d.getDate()}/${d.getMonth() + 1}`,
        value: r.value,
        period: r.period,
        periodLabel: 'ก่อนอาหารเช้า (Fasting)',
        note: r.note,
      };
    });

  const activeChartData = 
    trendMode === 'daily' 
      ? chartDailyReadings 
      : trendMode === 'fasting' 
        ? chartFastingReadings 
        : chartAllReadings;

  // Today's specific data
  const todayGlucose = data.glucoseLogs.filter(g => g.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const latestGlucose = data.glucoseLogs.length > 0 
    ? [...data.glucoseLogs].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0] 
    : null;

  const todayVitals = data.vitalsLogs.filter(v => v.date === selectedDate).slice(-1)[0] 
    || data.vitalsLogs.slice(-1)[0];

  const todayExercise = data.exerciseLogs.filter(e => e.date === selectedDate);
  const totalSteps = todayExercise.reduce((sum, e) => sum + (e.steps || 0), 0);

  const todayWater = data.waterLogs.find(w => w.date === selectedDate);
  const currentWaterMl = todayWater ? todayWater.amountMl : 0;
  const waterTargetMl = data.profile.waterDailyTargetMl || 2000;
  const waterPercent = Math.min(100, Math.round((currentWaterMl / waterTargetMl) * 100));

  // Glucose stats over last 14 days
  const glucoseStats = calculateGlucoseStats(data.glucoseLogs, 14);

  // Medication completion for today
  const activeSchedules = data.medSchedules.filter(s => s.isActive);
  const totalScheduledDoses = activeSchedules.reduce((sum, s) => sum + s.times.length, 0);
  const todayMedLogs = data.medLogs.filter(l => l.date === selectedDate && l.status === 'taken');
  const medCompletionPercent = totalScheduledDoses > 0 
    ? Math.round((todayMedLogs.length / totalScheduledDoses) * 100) 
    : 100;

  // Next upcoming appointment
  const upcomingAppointments = data.appointments
    .filter(a => a.date >= todayStr && a.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextAppt = upcomingAppointments[0];

  // Next recommended insulin site (rotate to least recently used)
  const insulinLogs = data.medLogs.filter(l => l.injectionSite);
  const lastSiteId = insulinLogs.length > 0 ? insulinLogs[insulinLogs.length - 1].injectionSite : undefined;
  const nextSite = INJECTION_SITES.find(s => s.id !== lastSiteId) || INJECTION_SITES[0];

  // Helper for quick water addition with sound
  const handleAddWater = (ml: number) => {
    onLogWater(ml);
    soundFx.playSuccessTone();
    if (currentWaterMl + ml >= waterTargetMl) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }
  };

  const handleMedCheck = (scheduleId: string, time: string) => {
    onQuickToggleMed(scheduleId, time);
    soundFx.playSuccessTone();
  };

  // Thai Date Formatter
  const formattedToday = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold">
                {formattedToday}
              </span>
              {medCompletionPercent === 100 && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                  <Award className="w-3.5 h-3.5" /> ทานยาครบวันนี้!
                </span>
              )}
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mt-2 font-sans">
              สวัสดีครับ, คุณ{data.profile.name}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              เป้าหมายวันนี้: คุมระดับน้ำตาลให้อยู่ในเกณฑ์ • ดื่มน้ำให้ครบ {waterTargetMl} มล. • หมั่นขยับร่างกาย
            </p>
          </div>

          {/* Quick Action Buttons Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => onOpenQuickLogModal('glucose')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> เจาะตรวจน้ำตาล
            </button>
            <button
              onClick={() => onOpenQuickLogModal('medication')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
            >
              <Pill className="w-4 h-4" /> ฉีดอินซูลิน / ทานยา
            </button>
            <button
              onClick={() => onOpenQuickLogModal('food')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> บันทึกอาหาร
            </button>
            <button
              onClick={() => onOpenQuickLogModal('vitals')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
            >
              <Heart className="w-4 h-4" /> วัดความดัน
            </button>

            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                title="ดาวน์โหลดไฟล์หรือแชร์ให้คนอื่น"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 hover:border-cyan-500/50 text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4 text-cyan-400" /> ดาวน์โหลดไฟล์ / แชร์
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Daily Diabetes Evidence-Based Tip Component */}
      <DailyDiabetesTip data={data} onOpenShareModal={onOpenShareModal} />

      {/* 4 Core Health Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-4">
        
        {/* 1. Blood Glucose Card */}
        <div 
          onClick={() => onNavigate('glucose')}
          className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 lg:p-5 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ค่าน้ำตาลล่าสุด</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-bold font-mono text-white">
                {latestGlucose ? latestGlucose.value : '--'}
              </span>
              <span className="text-xs text-slate-400 font-sans">mg/dL</span>
            </div>

            {latestGlucose ? (
              <div className="mt-2 flex items-center justify-between">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${classifyGlucose(latestGlucose.value, latestGlucose.period).badgeBg}`}>
                  {classifyGlucose(latestGlucose.value, latestGlucose.period).label}
                </span>
                <span className="text-[10px] text-slate-500">{latestGlucose.time} น.</span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 mt-2 block">ยังไม่มีบันทึกวันนี้</span>
            )}
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 absolute right-3 bottom-3 transition-colors" />
        </div>

        {/* 2. Blood Pressure Card */}
        <div 
          onClick={() => onNavigate('selfcare')}
          className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 lg:p-5 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ความดัน / ชีพจร</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-bold font-mono text-white">
                {todayVitals ? `${todayVitals.sys}/${todayVitals.dia}` : '120/80'}
              </span>
              <span className="text-xs text-slate-400 font-sans">mmHg</span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                ชีพจร: <b className="text-white font-mono">{todayVitals ? todayVitals.pulse : 75}</b> bpm
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">ปกติ</span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 absolute right-3 bottom-3 transition-colors" />
        </div>

        {/* 3. Water Hydration Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 lg:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ดื่มน้ำวันนี้</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Droplet className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl lg:text-3xl font-bold font-mono text-white">{currentWaterMl}</span>
                <span className="text-xs text-slate-400">/{waterTargetMl} ml</span>
              </div>
              <span className="text-xs font-bold font-mono text-cyan-400">{waterPercent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>

          <div className="flex gap-1.5 mt-3">
            <button
              onClick={() => handleAddWater(250)}
              className="flex-1 py-1 px-2 bg-slate-800 hover:bg-cyan-900/40 text-cyan-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/40 rounded-lg text-xs font-medium transition-colors"
            >
              +250ml
            </button>
            <button
              onClick={() => handleAddWater(500)}
              className="flex-1 py-1 px-2 bg-slate-800 hover:bg-cyan-900/40 text-cyan-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/40 rounded-lg text-xs font-medium transition-colors"
            >
              +500ml
            </button>
          </div>
        </div>

        {/* 4. Medication Adherence & Steps Card */}
        <div 
          onClick={() => onNavigate('medication')}
          className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 lg:p-5 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">การทานยา / อินซูลิน</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-bold font-mono text-white">
                {todayMedLogs.length}/{totalScheduledDoses}
              </span>
              <span className="text-xs text-slate-400 font-sans">มื้อ</span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span className="text-xs text-purple-300 font-medium">ทานแล้ว {medCompletionPercent}%</span>
              </div>
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                <Footprints className="w-3 h-3" /> {totalSteps.toLocaleString()} ก้าว
              </span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 absolute right-3 bottom-3 transition-colors" />
        </div>

      </div>

      {/* Main Row: 7-Day Glucose Trends Widget + Today's Medication Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: 7-Day Glucose Trends Widget (Powered by Recharts) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 lg:p-6 space-y-5 flex flex-col justify-between">
          
          {/* Widget Header & Filter Controls */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      แนวโน้มระดับน้ำตาล 7 วัน (7-Day Glucose Trends)
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Sparkline & วิเคราะห์ผลตรวจย้อนหลัง 7 วันเพื่อติดตามความนิ่งของระดับน้ำตาล
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  onClick={() => setTrendMode('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    trendMode === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ทุกลำดับตรวจ
                </button>
                <button
                  onClick={() => setTrendMode('daily')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    trendMode === 'daily'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  เฉลี่ยรายวัน
                </button>
                <button
                  onClick={() => setTrendMode('fasting')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    trendMode === 'fasting'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ก่อนอาหารเช้า
                </button>
              </div>
            </div>

            {/* 4 Mini KPI Cards for the last 7 days */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
              
              {/* 1. 7-Day Average */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                <span className="text-[11px] text-slate-400 font-medium">ค่าเฉลี่ย 7 วัน</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold font-mono text-white">
                    {sevenDayAvg > 0 ? sevenDayAvg : '--'}
                  </span>
                  <span className="text-[10px] text-slate-400">mg/dL</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  {trendDiff < 0 ? (
                    <span className="text-emerald-400 flex items-center gap-0.5 font-medium">
                      <TrendingDown className="w-3 h-3" /> ลดลง {Math.abs(trendDiff)}%
                    </span>
                  ) : trendDiff > 0 ? (
                    <span className="text-amber-400 flex items-center gap-0.5 font-medium">
                      <TrendingUp className="w-3 h-3" /> เพิ่มขึ้น {trendDiff}%
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-0.5">
                      <Minus className="w-3 h-3" /> เสถียรดี
                    </span>
                  )}
                </div>
              </div>

              {/* 2. 7-Day Time In Range */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                <span className="text-[11px] text-slate-400 font-medium">ในเกณฑ์ (70-180)</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {sevenDayTirPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400">TIR</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-400 truncate">
                  เป้าหมาย &gt; 70%
                </div>
              </div>

              {/* 3. 7-Day Range Min-Max */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                <span className="text-[11px] text-slate-400 font-medium">ช่วงต่ำสุด - สูงสุด</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-sm font-bold font-mono text-white">
                    {sevenDayMin > 0 ? `${sevenDayMin} - ${sevenDayMax}` : '--'}
                  </span>
                  <span className="text-[10px] text-slate-400">mg/dL</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  {sevenDayBelowCount > 0 ? (
                    <span className="text-rose-400 font-medium">พบน้ำตาลต่ำ {sevenDayBelowCount} ครั้ง</span>
                  ) : (
                    <span className="text-emerald-400">ไม่พบภาวะน้ำตาลต่ำ</span>
                  )}
                </div>
              </div>

              {/* 4. Total Tests in 7 Days */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                <span className="text-[11px] text-slate-400 font-medium">ความถี่การเจาะตรวจ</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold font-mono text-cyan-400">
                    {last7DaysGlucoseLogs.length}
                  </span>
                  <span className="text-[10px] text-slate-400">ครั้ง/7วัน</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  เฉลี่ย {(last7DaysGlucoseLogs.length / 7).toFixed(1)} ครั้ง/วัน
                </div>
              </div>

            </div>
          </div>

          {/* Sparkline / Chart Container Powered by Recharts */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-3 sm:p-4 space-y-2">
            
            <div className="flex justify-between items-center text-xs px-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">
                  {trendMode === 'all' && 'เส้นแนวโน้มการเจาะตรวจทุกช่วงเวลา 7 วัน'}
                  {trendMode === 'daily' && 'Sparkline ค่าเฉลี่ยรายวัน (7 วันย้อนหลัง)'}
                  {trendMode === 'fasting' && 'กราฟระดับน้ำตาลก่อนอาหารเช้า (Fasting 7 วัน)'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  โซนเป้าหมาย 70-180 mg/dL
                </span>
              </div>

              <div className="text-[11px] text-slate-400 hidden sm:block">
                ชี้ที่จุดเพื่อดูเวลาและมื้ออาหาร
              </div>
            </div>

            {/* Recharts Render */}
            <div className="h-48 w-full pt-2">
              {activeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={activeChartData}
                    margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="glucoseTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#1E293B" 
                      vertical={false} 
                    />

                    <XAxis
                      dataKey="shortLabel"
                      stroke="#475569"
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />

                    <YAxis
                      domain={[50, 'auto']}
                      stroke="#475569"
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      ticks={[70, 100, 140, 180, 220]}
                    />

                    {/* Target Zone Green Shading */}
                    <ReferenceArea
                      y1={70}
                      y2={180}
                      shape={(props: any) => (
                        <rect {...props} fill="#10B981" fillOpacity={0.07} stroke="none" />
                      )}
                    />

                    {/* Reference Lines */}
                    <ReferenceLine
                      y={180}
                      stroke="#F59E0B"
                      strokeDasharray="3 3"
                      strokeOpacity={0.6}
                      label={{
                        value: 'เกณฑ์สูง 180',
                        fill: '#F59E0B',
                        fontSize: 9,
                        position: 'insideTopRight',
                      }}
                    />

                    <ReferenceLine
                      y={70}
                      stroke="#F43F5E"
                      strokeDasharray="3 3"
                      strokeOpacity={0.6}
                      label={{
                        value: 'เกณฑ์ต่ำ 70',
                        fill: '#F43F5E',
                        fontSize: 9,
                        position: 'insideBottomRight',
                      }}
                    />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          if (item.value === null || item.value === undefined) {
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs text-slate-300 shadow-xl">
                                <div className="font-semibold text-slate-400">{item.displayLabel}</div>
                                <div className="text-slate-500 mt-1">ไม่มีบันทึกการตรวจ</div>
                              </div>
                            );
                          }

                          const val = item.value;
                          const classification = classifyGlucose(val, item.period || 'fasting');

                          return (
                            <div className="bg-slate-900/95 border border-slate-700/90 p-3 rounded-2xl shadow-2xl backdrop-blur-md min-w-[190px] space-y-1.5 pointer-events-none">
                              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                                <span>{item.displayLabel || item.date}</span>
                                {item.time && <span className="font-mono text-emerald-400">{item.time} น.</span>}
                              </div>

                              <div className="flex items-baseline justify-between pt-0.5">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold font-mono text-white">{val}</span>
                                  <span className="text-xs text-slate-400">mg/dL</span>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${classification.badgeBg}`}>
                                  {classification.label}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>{item.periodLabel || 'ค่าน้ำตาล'}</span>
                              </div>

                              {item.min !== undefined && item.max !== undefined && item.count > 1 && (
                                <div className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2 py-1 rounded-lg">
                                  ต่ำสุด-สูงสุด: {item.min} - {item.max} mg/dL ({item.count} ครั้ง)
                                </div>
                              )}

                              {item.note && (
                                <div className="text-[11px] text-amber-300/90 italic bg-amber-950/30 border border-amber-800/30 p-1.5 rounded-lg">
                                  "{item.note}"
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fill="url(#glucoseTrendGrad)"
                      connectNulls
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (!cx || !cy || payload?.value === null || payload?.value === undefined) return null;
                        const val = payload.value;
                        const isHypo = val < 70;
                        const isNormal = val >= 70 && val <= 180;
                        const dotColor = isHypo ? '#F43F5E' : isNormal ? '#10B981' : '#F59E0B';

                        return (
                          <g key={`dot-${payload.id || payload.date || cx}`}>
                            <circle cx={cx} cy={cy} r={4} fill={dotColor} stroke="#0F172A" strokeWidth={1.5} />
                            <circle cx={cx} cy={cy} r={7} fill={dotColor} opacity={0.2} />
                          </g>
                        );
                      }}
                      activeDot={{
                        r: 6,
                        stroke: '#FFFFFF',
                        strokeWidth: 2,
                        fill: '#10B981',
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <span>ยังไม่มีข้อมูลการเจาะตรวจในช่วง 7 วันนี้</span>
                  <button
                    onClick={() => onOpenQuickLogModal('glucose')}
                    className="mt-2 text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    + บันทึกค่าน้ำตาลแรก
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Time In Range (TIR) Breakdown Bar & Footer */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">
                การกระจายตัวของค่าน้ำตาล 7 วัน (TIR Breakdown)
              </span>
              <span className="text-emerald-400 font-bold font-mono text-sm">
                {sevenDayTirPercent}% อยู่ในเกณฑ์
              </span>
            </div>

            {/* Stacked TIR Bar */}
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                title={`ต่ำกว่าเกณฑ์ (<70): ${sevenDayHypoPercent}%`}
                className="bg-rose-500 h-full transition-all" 
                style={{ width: `${sevenDayHypoPercent}%` }} 
              />
              <div 
                title={`อยู่ในเกณฑ์ดี (70-180): ${sevenDayTirPercent}%`}
                className="bg-emerald-500 h-full transition-all" 
                style={{ width: `${sevenDayTirPercent}%` }} 
              />
              <div 
                title={`สูงกว่าเกณฑ์ (>180): ${sevenDayHyperPercent}%`}
                className="bg-amber-500 h-full transition-all" 
                style={{ width: `${sevenDayHyperPercent}%` }} 
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> ต่ำ (&lt;70): {sevenDayHypoPercent}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> ในเกณฑ์ (70-180): {sevenDayTirPercent}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> สูง (&gt;180): {sevenDayHyperPercent}%
                </span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => onNavigate('insights')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 bg-cyan-950/50 border border-cyan-800/60 px-2.5 py-1 rounded-xl transition hover:bg-cyan-900/40"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  วิเคราะห์ความสัมพันธ์กับยา (Insights)
                </button>
                <button
                  onClick={() => onNavigate('glucose')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  ดูประวัติละเอียด <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Today's Medication & Insulin Checklist */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 lg:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-400" />
                ตารางยา & อินซูลินวันนี้
              </h3>
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                {todayMedLogs.length}/{totalScheduledDoses}
              </span>
            </div>

            {/* List of items */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {activeSchedules.map((schedule) => {
                return schedule.times.map((t) => {
                  const isTaken = data.medLogs.some(
                    l => l.scheduleId === schedule.id && l.date === selectedDate && l.scheduledTime === t && l.status === 'taken'
                  );
                  const isInsulin = schedule.type.includes('insulin');

                  return (
                    <div
                      key={`${schedule.id}_${t}`}
                      onClick={() => handleMedCheck(schedule.id, t)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isTaken
                          ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                          : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                          isTaken
                            ? 'bg-emerald-500 text-slate-950'
                            : 'border border-slate-500 text-slate-400'
                        }`}>
                          {isTaken ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                        </div>

                        <div>
                          <div className={`text-sm font-semibold text-white ${isTaken ? 'line-through text-slate-400' : ''}`}>
                            {schedule.name}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-purple-300">{t} น.</span>
                            <span>• {schedule.dose}</span>
                            {isInsulin && (
                              <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.2 rounded">
                                ฉีดอินซูลิน
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                        isTaken ? 'text-emerald-400' : 'text-slate-400 bg-slate-700/50'
                      }`}>
                        {isTaken ? 'เรียบร้อย' : 'แตะเพื่อบันทึก'}
                      </span>
                    </div>
                  );
                });
              })}
            </div>
          </div>

          {/* Next Insulin Site Recommendation */}
          <div className="bg-purple-950/30 border border-purple-800/40 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <div className="font-semibold text-purple-200">ตำแหน่งฉีดอินซูลินรอบถัดไป:</div>
              <div className="text-slate-300 mt-0.5">
                👉 <b>{nextSite.label}</b> ({nextSite.description})
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row: Doctor Appointment & Foot Check Reminder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Next Doctor Appointment Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 lg:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" />
                <h3 className="text-lg font-bold text-white">นัดพบแพทย์ครั้งถัดไป</h3>
              </div>
              {nextAppt && (
                <span className="px-2.5 py-1 bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold rounded-full">
                  อีก {Math.max(0, Math.ceil((new Date(nextAppt.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} วัน
                </span>
              )}
            </div>

            {nextAppt ? (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-base">{nextAppt.doctorName}</h4>
                    <p className="text-xs text-teal-300 mt-0.5">{nextAppt.hospital} • {nextAppt.department}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white font-mono">{nextAppt.date}</span>
                    <p className="text-xs text-slate-400 font-mono">เวลา {nextAppt.time} น.</p>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="font-semibold text-amber-300">สิ่งที่ต้องเตรียม: </span>
                  {nextAppt.preparationNotes && nextAppt.preparationNotes.length > 0 
                    ? nextAppt.preparationNotes.join(' • ')
                    : 'งดน้ำงดอาหารหลัง 4 ทุ่ม และนำยาเดิมมาด้วย'}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                ยังไม่มีรายการนัดหมายแพทย์
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => onNavigate('appointments')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              จัดการนัดหมายทั้งหมด <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Self-Care & Foot Care Alert Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 lg:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-emerald-400" />
                การดูแลสุขภาพเท้าประจำวัน (Foot Care)
              </h3>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                ป้องกันแผลเบาหวาน
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              ผู้ป่วยเบาหวานควรตรวจดูฝ่าเท้า ซอกนิ้ว และขอบเล็บทุกวัน เพื่อป้องกันการเกิดแผลเรื้อรังโดยไม่รู้ตัว
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-2 text-slate-300">
                <span>🔍</span> ตรวจหารอยแดง / แผลพุพอง
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-2 text-slate-300">
                <span>🧴</span> ทาโลชั่นกันผิวเท้าแตกแห้ง
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-2 text-slate-300">
                <span>🧦</span> สวมถุงเท้าสะอาด ไม่รัดแน่น
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-2 text-slate-300">
                <span>👟</span> ไม่เดินเท้าเปล่าทั้งใน/นอกบ้าน
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => onNavigate('selfcare')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              บันทึกการตรวจเท้าวันนี้ <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
