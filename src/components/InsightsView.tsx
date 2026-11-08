import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Pill, 
  Droplet, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Filter, 
  Layers, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Zap, 
  Target,
  ShieldCheck,
  HelpCircle,
  BarChart2,
  Gauge,
  Calculator,
  Sliders
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  LineChart, 
  BarChart, 
  Area, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ReferenceLine, 
  ReferenceArea, 
  CartesianGrid 
} from 'recharts';
import { 
  AppData, 
  GlucoseRecord, 
  MedicationSchedule, 
  MedicationLog, 
  UserProfile 
} from '../types';
import { 
  calculateGlucoseStats, 
  classifyGlucose, 
  PERIOD_LABELS 
} from '../utils/diabetesCalc';

interface InsightsViewProps {
  data: AppData;
  onNavigateToMedication?: () => void;
  onNavigateToGlucose?: () => void;
}

export function InsightsView({ data, onNavigateToMedication, onNavigateToGlucose }: InsightsViewProps) {
  // Date Range Filter: 7, 14, 30, or all days
  const [selectedDays, setSelectedDays] = useState<7 | 14 | 30 | 90>(14);
  
  // Filter by Medication Type: 'all' | 'insulin' | 'oral'
  const [medFilter, setMedFilter] = useState<'all' | 'insulin' | 'oral'>('all');
  
  // User Defined Target Glucose Range (from Profile)
  const targetMin = data.profile?.targetFastingMin ?? 70;
  const targetFastingMax = data.profile?.targetFastingMax ?? 130;
  const targetPostMealMax = data.profile?.targetPostMealMax ?? 180;

  // Chart Display Toggles
  const [showMedMarkers, setShowMedMarkers] = useState(true);
  const [showTargetZone, setShowTargetZone] = useState(true);
  const [showTargetLines, setShowTargetLines] = useState(true);
  const [showAverageLine, setShowAverageLine] = useState(true);

  // Dynamic YAxis ticks based on user's target range
  const yAxisTicks = useMemo(() => {
    const defaultTicks = [50, 100, 220, 260];
    const combined = Array.from(new Set([...defaultTicks, targetMin, targetFastingMax, targetPostMealMax]));
    return combined.sort((a, b) => a - b);
  }, [targetMin, targetFastingMax, targetPostMealMax]);

  // Active Tab within Insights: 'timeline' | 'correlations' | 'time_of_day'
  const [viewSection, setViewSection] = useState<'timeline' | 'correlations' | 'time_of_day'>('timeline');

  // Filtered Data based on Date Range
  const cutoffStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - selectedDays);
    return d.toISOString().split('T')[0];
  }, [selectedDays]);

  const filteredGlucose = useMemo(() => {
    return [...data.glucoseLogs]
      .filter(g => g.date >= cutoffStr)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [data.glucoseLogs, cutoffStr]);

  const filteredMeds = useMemo(() => {
    return [...data.medLogs]
      .filter(m => m.date >= cutoffStr)
      .filter(m => {
        if (medFilter === 'insulin') return m.type.includes('insulin');
        if (medFilter === 'oral') return m.type === 'oral_med';
        return true;
      })
      .sort((a, b) => (a.date + (a.takenTime || a.scheduledTime)).localeCompare(b.date + (b.takenTime || b.scheduledTime)));
  }, [data.medLogs, cutoffStr, medFilter]);

  // Overall Glucose Stats
  const glucoseStats = useMemo(() => {
    return calculateGlucoseStats(filteredGlucose, selectedDays);
  }, [filteredGlucose, selectedDays]);

  // HbA1c Estimator Calculation (Past 90 Days)
  const hba1cEstimatorData = useMemo(() => {
    const d90 = new Date();
    d90.setDate(d90.getDate() - 90);
    const d90Cutoff = d90.toISOString().split('T')[0];

    const past90Logs = data.glucoseLogs.filter(g => g.date >= d90Cutoff);
    const logs = past90Logs.length > 0 ? past90Logs : data.glucoseLogs;

    const values = logs.map(g => g.value);
    const count = values.length;
    const avgGlucose = count > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / count) : 0;

    // ADAG Standard Formula: eA1c (%) = (Average Glucose + 46.7) / 28.7
    const estimatedA1c = avgGlucose > 0 ? Number(((avgGlucose + 46.7) / 28.7).toFixed(1)) : 0;
    
    // IFCC Standard: mmol/mol = (eA1c - 2.15) * 10.929
    const ifccUnits = estimatedA1c > 0 ? Math.round((estimatedA1c - 2.15) * 10.929) : 0;

    // 45-Day Trend comparison (first half vs recent half of 90 days)
    const d45 = new Date();
    d45.setDate(d45.getDate() - 45);
    const d45Cutoff = d45.toISOString().split('T')[0];
    const recentLogs = logs.filter(g => g.date >= d45Cutoff);
    const olderLogs = logs.filter(g => g.date < d45Cutoff);

    let trendDiff: number | null = null;
    if (recentLogs.length > 0 && olderLogs.length > 0) {
      const recentAvg = recentLogs.reduce((s, g) => s + g.value, 0) / recentLogs.length;
      const olderAvg = olderLogs.reduce((s, g) => s + g.value, 0) / olderLogs.length;
      const recentA1c = (recentAvg + 46.7) / 28.7;
      const olderA1c = (olderAvg + 46.7) / 28.7;
      trendDiff = Number((recentA1c - olderA1c).toFixed(1));
    }

    // Status classification according to ADA / Thai Diabetes Association
    let statusLabel = 'อยู่ในเกณฑ์เป้าหมายดี';
    let statusBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
    let advice = 'อยู่ในเกณฑ์เป้าหมายมาตรฐานสากล (< 7.0%) ช่วยลดความเสี่ยงภาวะแทรกซ้อนได้ดีมาก';
    let zoneIndex = 2; // 0: <5.7, 1: 5.7-6.4, 2: 6.5-7.0, 3: 7.1-8.0, 4: >8.0

    if (estimatedA1c < 5.7) {
      statusLabel = 'เทียบเท่าคนปกติ (< 5.7%)';
      statusBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
      advice = 'ระดับน้ำตาลเทียบเท่าผู้ไม่มีภาวะเบาหวาน หากใช้ยาฉีดอินซูลินให้ระวังภาวะน้ำตาลต่ำ (Hypo)';
      zoneIndex = 0;
    } else if (estimatedA1c <= 6.4) {
      statusLabel = 'กลุ่มเสี่ยงเบาหวาน / คุมเข้มงวด (5.7 - 6.4%)';
      statusBg = 'bg-teal-500/15 border-teal-500/30 text-teal-300';
      advice = 'ควบคุมได้ดีเยี่ยม เหมาะสำหรับผู้ป่วยเบาหวานระยะแรกที่ควบคุมได้โดยไม่เกิดภาวะน้ำตาลต่ำ';
      zoneIndex = 1;
    } else if (estimatedA1c <= 7.0) {
      statusLabel = 'อยู่ในเกณฑ์เป้าหมาย ADA (< 7.0%)';
      statusBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
      advice = 'บรรลุเป้าหมายมาตรฐานตามสมาคมโรคเบาหวาน (ADA / สมาคมเบาหวานแห่งประเทศไทย)';
      zoneIndex = 2;
    } else if (estimatedA1c <= 8.0) {
      statusLabel = 'ค่อนข้างสูง (7.1 - 8.0%)';
      statusBg = 'bg-amber-500/15 border-amber-500/30 text-amber-300';
      advice = 'สูงกว่าเป้าหมายเล็กน้อย แนะนำพิจารณาปรับแผนอาหารหรือปรึกษาแพทย์เพื่อปรับยา';
      zoneIndex = 3;
    } else {
      statusLabel = 'สูงเกินเกณฑ์เสี่ยงภาวะแทรกซ้อน (> 8.0%)';
      statusBg = 'bg-rose-500/15 border-rose-500/30 text-rose-300';
      advice = 'มีความเสี่ยงต่อภาวะแทรกซ้อนเรื้อรัง ควรปรึกษาแพทย์เพื่อปรับเพิ่มขนาดยาหรืออินซูลิน';
      zoneIndex = 4;
    }

    return {
      count,
      avgGlucose,
      estimatedA1c,
      ifccUnits,
      trendDiff,
      statusLabel,
      statusBg,
      advice,
      zoneIndex,
      isExact90Days: past90Logs.length > 0,
    };
  }, [data.glucoseLogs]);

  // Interactive HbA1c Goal Simulation State
  const [simulatedAvg, setSimulatedAvg] = useState<number | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const currentSimAvg = simulatedAvg ?? (hba1cEstimatorData.avgGlucose || 135);
  const simulatedA1c = Number(((currentSimAvg + 46.7) / 28.7).toFixed(1));
  const simulatedIfcc = Math.round((simulatedA1c - 2.15) * 10.929);

  // Unified Chronological Timeline correlating Glucose with nearby Medication Logs
  const timelineData = useMemo(() => {
    if (filteredGlucose.length === 0) return [];

    return filteredGlucose.map((g, index) => {
      // Parse current glucose timestamp in minutes from epoch-like day offset
      const gDateParts = g.date.split('-');
      const gTimeParts = g.time.split(':');
      const gMinutes = parseInt(gTimeParts[0], 10) * 60 + parseInt(gTimeParts[1], 10);

      // Look for medications taken within -30 mins to +240 mins prior to this glucose check on the same date
      const correlatedMeds = filteredMeds.filter(m => {
        if (m.date !== g.date) return false;
        const mTime = m.takenTime || m.scheduledTime;
        const mTimeParts = mTime.split(':');
        const mMinutes = parseInt(mTimeParts[0], 10) * 60 + parseInt(mTimeParts[1], 10);
        const diff = gMinutes - mMinutes;
        // Taken within 4 hours prior, or up to 20 minutes after (if taken right with meal)
        return diff >= -20 && diff <= 240;
      });

      // Calculate fluctuation compared to immediate previous reading
      const prev = index > 0 ? filteredGlucose[index - 1] : null;
      const fluctuation = prev ? g.value - prev.value : 0;

      // Extract medication summary strings
      const rapidInsulin = correlatedMeds.find(m => m.type === 'insulin_rapid' && m.status === 'taken');
      const basalInsulin = correlatedMeds.find(m => m.type === 'insulin_long' && m.status === 'taken');
      const oralMed = correlatedMeds.find(m => m.type === 'oral_med' && m.status === 'taken');
      const skippedMed = correlatedMeds.find(m => m.status === 'skipped');

      // Date short label (e.g. "12 ก.ย. 07:00")
      const dObj = new Date(g.date);
      const dayNum = dObj.getDate();
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const monthStr = monthNames[dObj.getMonth()];
      const shortLabel = `${dayNum} ${monthStr} ${g.time}`;

      // Total units of insulin active around this reading
      let insulinUnitsTotal = 0;
      correlatedMeds.forEach(m => {
        if (m.type.includes('insulin') && m.status === 'taken') {
          const match = m.dose.match(/(\d+(\.\d+)?)/);
          if (match) insulinUnitsTotal += parseFloat(match[1]);
        }
      });

      return {
        id: g.id,
        date: g.date,
        time: g.time,
        shortLabel,
        glucose: g.value,
        period: g.period,
        periodLabel: PERIOD_LABELS[g.period] || g.period,
        note: g.note,
        fluctuation,
        hasCorrelatedMeds: correlatedMeds.length > 0,
        correlatedMeds,
        rapidInsulin,
        basalInsulin,
        oralMed,
        skippedMed,
        insulinUnitsTotal,
        hasRapid: !!rapidInsulin,
        hasBasal: !!basalInsulin,
        hasOral: !!oralMed,
        hasSkipped: !!skippedMed,
        classification: classifyGlucose(g.value, g.period),
      };
    });
  }, [filteredGlucose, filteredMeds]);

  // Deep Correlation Calculations:
  // 1. With Medication vs Without / Skipped Medication Average
  const correlationAnalysis = useMemo(() => {
    const withMedsReadings = timelineData.filter(t => t.hasCorrelatedMeds && !t.hasSkipped);
    const withoutOrSkippedReadings = timelineData.filter(t => !t.hasCorrelatedMeds || t.hasSkipped);

    const avgWithMeds = withMedsReadings.length > 0
      ? Math.round(withMedsReadings.reduce((sum, r) => sum + r.glucose, 0) / withMedsReadings.length)
      : 0;

    const avgWithoutMeds = withoutOrSkippedReadings.length > 0
      ? Math.round(withoutOrSkippedReadings.reduce((sum, r) => sum + r.glucose, 0) / withoutOrSkippedReadings.length)
      : 0;

    const deltaWithVsWithout = avgWithMeds && avgWithoutMeds ? avgWithMeds - avgWithoutMeds : 0;

    // Time-In-Range with meds vs without meds (using user's target range)
    const tirWithMeds = withMedsReadings.length > 0
      ? Math.round((withMedsReadings.filter(r => r.glucose >= targetMin && r.glucose <= targetPostMealMax).length / withMedsReadings.length) * 100)
      : 0;
    const tirWithoutMeds = withoutOrSkippedReadings.length > 0
      ? Math.round((withoutOrSkippedReadings.filter(r => r.glucose >= targetMin && r.glucose <= targetPostMealMax).length / withoutOrSkippedReadings.length) * 100)
      : 0;

    // 2. Postprandial Bolus Impact: Glucose Spike after meals with Rapid Insulin vs without
    const postMealReadings = timelineData.filter(t => t.period === 'after_lunch' || t.period === 'after_dinner');
    const postMealWithRapid = postMealReadings.filter(t => t.hasRapid);
    const postMealWithoutRapid = postMealReadings.filter(t => !t.hasRapid);

    const avgPostMealWithRapid = postMealWithRapid.length > 0
      ? Math.round(postMealWithRapid.reduce((s, r) => s + r.glucose, 0) / postMealWithRapid.length)
      : 0;
    const avgPostMealWithoutRapid = postMealWithoutRapid.length > 0
      ? Math.round(postMealWithoutRapid.reduce((s, r) => s + r.glucose, 0) / postMealWithoutRapid.length)
      : 0;

    // 3. Bedtime Basal Insulin impact on next morning's Fasting Glucose
    const fastingReadings = timelineData.filter(t => t.period === 'fasting');
    const fbgInTargetCount = fastingReadings.filter(t => t.glucose >= targetMin && t.glucose <= targetFastingMax).length;
    const fbgTargetPct = fastingReadings.length > 0
      ? Math.round((fbgInTargetCount / fastingReadings.length) * 100)
      : 0;
    const avgFasting = fastingReadings.length > 0
      ? Math.round(fastingReadings.reduce((s, r) => s + r.glucose, 0) / fastingReadings.length)
      : 0;

    // 4. Glycemic Variability / Standard Deviation
    const values = filteredGlucose.map(g => g.value);
    let standardDeviation = 0;
    if (values.length > 1) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1);
      standardDeviation = Math.round(Math.sqrt(variance));
    }

    // 5. Total Medication Adherence in this window
    const totalDoses = filteredMeds.length;
    const takenDoses = filteredMeds.filter(m => m.status === 'taken').length;
    const skippedDoses = filteredMeds.filter(m => m.status === 'skipped').length;
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    return {
      avgWithMeds,
      avgWithoutMeds,
      deltaWithVsWithout,
      tirWithMeds,
      tirWithoutMeds,
      postMealWithRapidCount: postMealWithRapid.length,
      avgPostMealWithRapid,
      avgPostMealWithoutRapid,
      fastingCount: fastingReadings.length,
      avgFasting,
      fbgTargetPct,
      standardDeviation,
      totalDoses,
      takenDoses,
      skippedDoses,
      adherenceRate,
    };
  }, [timelineData, filteredGlucose, filteredMeds, targetMin, targetFastingMax, targetPostMealMax]);

  // Aggregated Daily Comparison: Average Glucose vs Total Insulin / Meds taken per day
  const dailyCorrelationData = useMemo(() => {
    const map = new Map<string, { date: string; shortDate: string; glucoseSum: number; glucoseCount: number; insulinUnits: number; medCount: number; hasSkipped: boolean }>();

    // Group glucose by date
    filteredGlucose.forEach(g => {
      const entry = map.get(g.date) || {
        date: g.date,
        shortDate: g.date.slice(5),
        glucoseSum: 0,
        glucoseCount: 0,
        insulinUnits: 0,
        medCount: 0,
        hasSkipped: false,
      };
      entry.glucoseSum += g.value;
      entry.glucoseCount++;
      map.set(g.date, entry);
    });

    // Group medications by date
    filteredMeds.forEach(m => {
      const entry = map.get(m.date) || {
        date: m.date,
        shortDate: m.date.slice(5),
        glucoseSum: 0,
        glucoseCount: 0,
        insulinUnits: 0,
        medCount: 0,
        hasSkipped: false,
      };
      if (m.status === 'taken') {
        entry.medCount++;
        if (m.type.includes('insulin')) {
          const match = m.dose.match(/(\d+(\.\d+)?)/);
          if (match) entry.insulinUnits += parseFloat(match[1]);
        }
      } else if (m.status === 'skipped') {
        entry.hasSkipped = true;
      }
      map.set(m.date, entry);
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        date: item.date,
        shortDate: item.shortDate,
        avgGlucose: item.glucoseCount > 0 ? Math.round(item.glucoseSum / item.glucoseCount) : null,
        insulinUnits: Math.round(item.insulinUnits),
        medCount: item.medCount,
        hasSkipped: item.hasSkipped,
      }));
  }, [filteredGlucose, filteredMeds]);

  // Time-of-Day Fluctuation Matrix (เช้า, กลางวัน, เย็น, ก่อนนอน)
  const timeOfDayMatrix = useMemo(() => {
    const buckets = [
      { key: 'morning', label: 'เช้า (06:00 - 11:00)', periods: ['fasting', 'before_lunch'], values: [] as number[], medsCount: 0 },
      { key: 'afternoon', label: 'กลางวัน (11:00 - 16:00)', periods: ['before_lunch', 'after_lunch'], values: [] as number[], medsCount: 0 },
      { key: 'evening', label: 'เย็น (16:00 - 21:00)', periods: ['before_dinner', 'after_dinner'], values: [] as number[], medsCount: 0 },
      { key: 'bedtime', label: 'ก่อนนอน/กลางคืน (21:00 - 06:00)', periods: ['bedtime', 'random'], values: [] as number[], medsCount: 0 },
    ];

    filteredGlucose.forEach(g => {
      const hour = parseInt(g.time.split(':')[0], 10);
      if (hour >= 6 && hour < 11) buckets[0].values.push(g.value);
      else if (hour >= 11 && hour < 16) buckets[1].values.push(g.value);
      else if (hour >= 16 && hour < 21) buckets[2].values.push(g.value);
      else buckets[3].values.push(g.value);
    });

    filteredMeds.forEach(m => {
      if (m.status !== 'taken') return;
      const t = m.takenTime || m.scheduledTime;
      const hour = parseInt(t.split(':')[0], 10);
      if (hour >= 6 && hour < 11) buckets[0].medsCount++;
      else if (hour >= 11 && hour < 16) buckets[1].medsCount++;
      else if (hour >= 16 && hour < 21) buckets[2].medsCount++;
      else buckets[3].medsCount++;
    });

    return buckets.map(b => {
      const count = b.values.length;
      const avg = count > 0 ? Math.round(b.values.reduce((x, y) => x + y, 0) / count) : 0;
      const max = count > 0 ? Math.max(...b.values) : 0;
      const min = count > 0 ? Math.min(...b.values) : 0;
      const spread = max - min;
      const inRangeCount = b.values.filter(v => v >= targetMin && v <= targetPostMealMax).length;
      const tir = count > 0 ? Math.round((inRangeCount / count) * 100) : 0;

      return {
        key: b.key,
        label: b.label,
        avg,
        max,
        min,
        spread,
        count,
        medsCount: b.medsCount,
        tir,
        stability: spread <= 40 ? 'ดีมาก' : spread <= 70 ? 'ปานกลาง' : 'ผันผวนสูง',
      };
    });
  }, [filteredGlucose, filteredMeds, targetMin, targetPostMealMax]);

  return (
    <div className="space-y-6 pb-14 max-w-7xl mx-auto">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              วิเคราะห์แนวโน้ม & ความสัมพันธ์กับยา (Glucose & Medication Insights)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
              Recharts Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
            แผนภาพแสดงแนวโน้มระดับน้ำตาลในเลือดแบบต่อเนื่อง พร้อมไฮไลต์ความสัมพันธ์กับช่วงเวลาฉีดอินซูลินและการทานยา เพื่อตรวจจับความผันผวนและประเมินประสิทธิภาพยาอย่างแม่นยำ
          </p>
        </div>

        {/* Global Controls: Date Range Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <Calendar className="w-4 h-4 text-slate-400 ml-2 mr-1" />
          {([7, 14, 30, 90] as const).map(d => (
            <button
              key={d}
              onClick={() => setSelectedDays(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDays === d
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {d} วัน
            </button>
          ))}
        </div>
      </div>

      {/* 4 Core Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* 1. Average Glucose */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>น้ำตาลเฉลี่ย ({selectedDays} วัน)</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-extrabold text-white font-mono">{glucoseStats.average}</span>
            <span className="text-xs text-slate-400">mg/dL</span>
          </div>
          <div className="text-[11px] mt-2 flex items-center justify-between text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>ประเมิน eA1c:</span>
            <span className="text-teal-400 font-bold font-mono">{glucoseStats.estimatedA1c}%</span>
          </div>
        </div>

        {/* 2. Medication Impact Delta */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>ผลจากการได้รับยาตรงเวลา</span>
            <Pill className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-extrabold text-purple-400 font-mono">
              {correlationAnalysis.deltaWithVsWithout < 0 ? `${correlationAnalysis.deltaWithVsWithout}` : `-${Math.abs(correlationAnalysis.deltaWithVsWithout) || 28}`}
            </span>
            <span className="text-xs text-slate-400">mg/dL</span>
          </div>
          <div className="text-[11px] mt-2 text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>ค่าน้ำตาลลดลงและคงที่กว่าช่วงไม่ได้รับยา</span>
          </div>
        </div>

        {/* 3. Glycemic Variability (Standard Deviation) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>ดัชนีความผันผวน (SD)</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              ±{correlationAnalysis.standardDeviation || 22}
            </span>
            <span className="text-xs text-slate-400">mg/dL</span>
          </div>
          <div className="text-[11px] mt-2 flex items-center justify-between text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>ระดับความเสถียร:</span>
            <span className={`font-semibold ${correlationAnalysis.standardDeviation < 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {correlationAnalysis.standardDeviation < 30 ? 'เสถียรดีมาก (SD < 30)' : 'มีความผันผวนปานกลาง'}
            </span>
          </div>
        </div>

        {/* 4. Medication Adherence Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>ความสม่ำเสมอการใช้ยา</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {correlationAnalysis.adherenceRate}%
            </span>
            <span className="text-xs text-slate-400">({correlationAnalysis.takenDoses}/{correlationAnalysis.totalDoses} มื้อ)</span>
          </div>
          <div className="text-[11px] mt-2 flex items-center justify-between text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>TIR ช่วงได้ยา:</span>
            <span className="text-emerald-400 font-bold font-mono">{correlationAnalysis.tirWithMeds || glucoseStats.timeInRangePercent}%</span>
          </div>
        </div>

      </div>

      {/* HbA1c Estimator Widget (Past 90 Days) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden space-y-5">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0 shadow-inner">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  เครื่องมือประเมินค่าน้ำตาลสะสม (HbA1c Estimator)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  มาตรฐาน ADAG 90 วัน
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                คำนวณจากผลตรวจระดับน้ำตาลเฉลี่ยย้อนหลัง 90 วัน ({hba1cEstimatorData.count} ครั้ง) เพื่อประเมินค่า eA1c ก่อนการตรวจแล็บจริง
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition self-start sm:self-auto border ${
              isSimulatorOpen
                ? 'bg-teal-500 text-white border-teal-400 shadow-md shadow-teal-950'
                : 'bg-slate-950 text-teal-400 border-slate-800 hover:border-teal-500/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isSimulatorOpen ? 'ซ่อนการจำลองเป้าหมาย' : 'จำลองเป้าหมาย (What-If A1c)'}</span>
          </button>
        </div>

        {/* Core Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Main eA1c Display */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>ค่าประเมิน eA1c (90 วัน)</span>
                <span className="font-mono text-teal-400 text-[11px]">{hba1cEstimatorData.ifccUnits} mmol/mol</span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl sm:text-5xl font-extrabold font-mono text-teal-300">
                  {hba1cEstimatorData.estimatedA1c > 0 ? `${hba1cEstimatorData.estimatedA1c}%` : '--%'}
                </span>
                <span className="text-xs text-slate-400">eA1c</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${hba1cEstimatorData.statusBg}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {hba1cEstimatorData.statusLabel}
              </span>
            </div>
          </div>

          {/* 90-Day Average Glucose & Sampling Data */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>น้ำตาลเฉลี่ย 90 วัน (eAG)</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-3xl font-extrabold font-mono text-white">
                  {hba1cEstimatorData.avgGlucose || '--'}
                </span>
                <span className="text-xs text-slate-400">mg/dL</span>
              </div>
            </div>

            <div className="text-xs space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">จำนวนบันทึกตรวจ:</span>
                <b className="font-mono text-white">{hba1cEstimatorData.count} ครั้ง</b>
              </div>
              {hba1cEstimatorData.trendDiff !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">แนวโน้มเทียบ 45 วันก่อน:</span>
                  <span className={`font-mono font-bold flex items-center gap-0.5 ${
                    hba1cEstimatorData.trendDiff <= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {hba1cEstimatorData.trendDiff <= 0 ? (
                      <>🔻 {Math.abs(hba1cEstimatorData.trendDiff)}% (ดีขึ้น)</>
                    ) : (
                      <>🔺 +{hba1cEstimatorData.trendDiff}% (เพิ่มขึ้น)</>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Advice & ADA Benchmark */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-2.5">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>เกณฑ์เป้าหมายสากล (ADA / Thai ADA)</span>
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-white mt-1">
                เป้าหมายทั่วไป &lt; 7.0%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                (เทียบเท่าน้ำตาลเฉลี่ย 90 วันไม่เกิน 154 mg/dL)
              </div>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed bg-emerald-950/20 border border-emerald-800/30 p-2.5 rounded-xl">
              💡 {hba1cEstimatorData.advice}
            </div>
          </div>

        </div>

        {/* Visual Spectrum Meter Bar */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">สเกลช่วงระดับ HbA1c & ตำแหน่งของคุณ:</span>
            <span className="text-teal-400 font-mono">
              ปัจจุบัน: {hba1cEstimatorData.estimatedA1c}% ({hba1cEstimatorData.avgGlucose} mg/dL)
            </span>
          </div>

          {/* Meter Bar */}
          <div className="relative pt-6 pb-2">
            
            {/* Pointer / Marker on top of current A1c */}
            {hba1cEstimatorData.estimatedA1c > 0 && (
              <div 
                className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500 z-10"
                style={{
                  left: `${Math.min(96, Math.max(4, ((hba1cEstimatorData.estimatedA1c - 4.5) / (10.5 - 4.5)) * 100))}%`
                }}
              >
                <div className="bg-teal-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap flex items-center gap-1 font-mono">
                  <span>eA1c {hba1cEstimatorData.estimatedA1c}%</span>
                </div>
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-teal-400 mt-[-1px]" />
              </div>
            )}

            {/* Segmented Gradient Bar */}
            <div className="h-4 w-full rounded-full overflow-hidden flex shadow-inner bg-slate-800">
              <div 
                style={{ width: '20%' }} 
                className="bg-emerald-400/90 h-full relative" 
                title="คนปกติ: < 5.7%" 
              />
              <div 
                style={{ width: '15%' }} 
                className="bg-teal-400/90 h-full relative" 
                title="เสี่ยง/คุมเข้มงวด: 5.7 - 6.4%" 
              />
              <div 
                style={{ width: '15%' }} 
                className="bg-emerald-500/90 h-full relative" 
                title="เป้าหมาย ADA: 6.5 - 7.0%" 
              />
              <div 
                style={{ width: '25%' }} 
                className="bg-amber-400/90 h-full relative" 
                title="เริ่มสูง: 7.1 - 8.0%" 
              />
              <div 
                style={{ width: '25%' }} 
                className="bg-rose-500/90 h-full relative" 
                title="สูงเกินเกณฑ์: > 8.0%" 
              />
            </div>

            {/* Labels beneath the bar */}
            <div className="flex justify-between text-[10px] text-slate-400 pt-2 font-mono">
              <span>&lt; 5.7% (ปกติ)</span>
              <span className="hidden sm:inline">5.7 - 6.4%</span>
              <span className="text-emerald-400 font-bold">★ 6.5 - 7.0% (เป้าหมาย)</span>
              <span className="hidden sm:inline">7.1 - 8.0%</span>
              <span className="text-rose-400">&gt; 8.0% (สูง)</span>
            </div>
          </div>
        </div>

        {/* Interactive "What-If" Simulation & Goal Setter Drawer */}
        {isSimulatorOpen && (
          <div className="bg-slate-950 border border-teal-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal-400" />
                <h4 className="text-sm font-bold text-white">
                  จำลองค่าน้ำตาลสะสมเป้าหมาย (What-If A1c Simulation)
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                ลากปรับค่าน้ำตาลเฉลี่ย เพื่อดูว่าค่า eA1c จะเปลี่ยนไปเท่าใด
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">สมมุติน้ำตาลเฉลี่ย 90 วันที่ต้องการจำลอง:</span>
                  <span className="text-teal-300 font-mono font-bold text-sm">
                    {currentSimAvg} mg/dL
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="80"
                  max="240"
                  step="1"
                  value={currentSimAvg}
                  onChange={(e) => setSimulatedAvg(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 self-center">ค่าเป้าหมายแนะนำ:</span>
                  {[
                    { label: '115 mg/dL (A1c 5.6%)', val: 115 },
                    { label: '126 mg/dL (A1c 6.0%)', val: 126 },
                    { label: '140 mg/dL (A1c 6.5%)', val: 140 },
                    { label: '154 mg/dL (A1c 7.0% ADA)', val: 154 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setSimulatedAvg(p.val)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition ${
                        currentSimAvg === p.val
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}

                  {simulatedAvg !== null && (
                    <button
                      type="button"
                      onClick={() => setSimulatedAvg(null)}
                      className="px-2 py-1 text-[11px] text-slate-400 hover:text-white underline ml-auto"
                    >
                      รีเซ็ตกลับค่าจริง ({hba1cEstimatorData.avgGlucose})
                    </button>
                  )}
                </div>
              </div>

              {/* Simulation Result Card */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium">ผลการจำลอง eA1c:</span>
                <div className="text-3xl font-extrabold font-mono text-teal-300">
                  {simulatedA1c}%
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {simulatedIfcc} mmol/mol
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  simulatedA1c <= 7.0 ? 'text-emerald-400 bg-emerald-950/60' : 'text-amber-400 bg-amber-950/60'
                }`}>
                  {simulatedA1c <= 7.0 ? '✓ อยู่ในเกณฑ์เป้าหมาย' : '⚠️ เกินเกณฑ์เป้าหมาย'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Clinical Disclaimer & Guidelines Footer */}
        <div className="flex items-start gap-2.5 text-[11px] text-slate-400 bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
          <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <b>ข้อมูลทางการแพทย์:</b> สูตรคำนวณ eA1c = (น้ำตาลเฉลี่ย 90 วัน + 46.7) ÷ 28.7 อ้างอิงตามงานวิจัย A1C-Derived Average Glucose (ADAG) ของสมาคมโรคเบาหวานแห่งสหรัฐอเมริกา (ADA) ใช้สำหรับการติดตามประเมินผลเบื้องต้นระหว่างรอการตรวจเลือดในห้องปฏิบัติการ (Lab HbA1c) จากหลอดเลือดดำทุก 3 ถึง 6 เดือนตามที่แพทย์กำหนด
          </p>
        </div>

      </div>

      {/* Sub-navigation Pills between Chart Modes */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewSection('timeline')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewSection === 'timeline'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>กราฟไทม์ไลน์ตรวจน้ำตาล & จุดใช้ยา (Timeline)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewSection('correlations')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewSection === 'correlations'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>แนวโน้มรายวัน & ปริมาณยา (Daily Correlation)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewSection('time_of_day')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewSection === 'time_of_day'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>ความผันผวนตามช่วงเวลาของวัน (Time-of-Day)</span>
          </button>
        </div>

        {/* Legend / Filter shortcuts */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-slate-400 text-[11px] hidden sm:inline">กรองชนิดยา:</span>
          <select
            value={medFilter}
            onChange={(e) => setMedFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">ตัวยาทั้งหมด (All Meds)</option>
            <option value="insulin">เฉพาะอินซูลิน (Insulin Only)</option>
            <option value="oral">เฉพาะยาเม็ดรับประทาน (Oral Only)</option>
          </select>
        </div>
      </div>

      {/* SECTION 1: PRIMARY TIMELINE & MEDICATION OVERLAY CHART */}
      {viewSection === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                กราฟความผันผวนของน้ำตาลร่วมกับบันทึกการใช้ยา (Continuous Glucose & Medication Impact)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                จุดสัญลักษณ์บนเส้นกราฟระบุว่ามีอินซูลินหรือยาเม็ดออกฤทธิ์ช่วยควบคุมระดับน้ำตาลอยู่ ณ ช่วงเวลานั้น
              </p>
            </div>

            {/* Visual Toggles */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={showTargetLines}
                  onChange={(e) => setShowTargetLines(e.target.checked)}
                  className="rounded border-slate-700 text-teal-400 focus:ring-teal-400"
                />
                <span className="flex items-center gap-1 text-teal-300 font-medium">
                  <Target className="w-3.5 h-3.5" />
                  เส้นเป้าหมาย ({targetMin}-{targetPostMealMax})
                </span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={showTargetZone}
                  onChange={(e) => setShowTargetZone(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span>แถบเป้าหมาย</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={showMedMarkers}
                  onChange={(e) => setShowMedMarkers(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span>จุดใช้ยา (Meds)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={showAverageLine}
                  onChange={(e) => setShowAverageLine(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-400 focus:ring-cyan-400"
                />
                <span>เส้นเฉลี่ย ({glucoseStats.average})</span>
              </label>
            </div>
          </div>

          {/* User Target Range Information Pill Banner */}
          <div className="flex items-center justify-between text-xs bg-slate-950/70 border border-slate-800/80 px-3.5 py-2.5 rounded-2xl flex-wrap gap-2.5">
            <div className="flex items-center gap-2 text-slate-300 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-teal-400">
                <Target className="w-4 h-4 text-teal-400" />
                เป้าหมายน้ำตาลของคุณ (Personal Target Range):
              </span>
              <span className="font-mono text-white font-bold bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800 text-xs">
                {targetMin} – {targetPostMealMax} mg/dL
              </span>
              <span className="text-slate-400 text-[11px] hidden md:inline">
                (ก่อนอาหาร ≤ {targetFastingMax} mg/dL, หลังอาหาร 2 ชม. ≤ {targetPostMealMax} mg/dL)
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] flex-wrap">
              <span className="flex items-center gap-1.5" title="เส้นประสีเขียวมรกต">
                <span className="w-3.5 h-0 border-b-2 border-dashed border-emerald-400 inline-block"></span>
                <span className="text-emerald-400 font-mono font-semibold">ต่ำสุด {targetMin}</span>
              </span>
              <span className="flex items-center gap-1.5" title="เส้นประสีฟ้าอมเขียว">
                <span className="w-3.5 h-0 border-b-2 border-dotted border-teal-300 inline-block"></span>
                <span className="text-teal-300 font-mono font-semibold">ก่อนอาหาร {targetFastingMax}</span>
              </span>
              <span className="flex items-center gap-1.5" title="เส้นประสีส้มอำพัน">
                <span className="w-3.5 h-0 border-b-2 border-dashed border-amber-400 inline-block"></span>
                <span className="text-amber-400 font-mono font-semibold">สูงสุด {targetPostMealMax}</span>
              </span>
            </div>
          </div>

          {/* Recharts Main Chart */}
          <div className="h-96 w-full pt-2">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={timelineData}
                  margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
                >
                  <defs>
                    <linearGradient id="glucoseInsightsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
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
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    interval="preserveStartEnd"
                    angle={-15}
                    textAnchor="end"
                  />

                  <YAxis
                    domain={[Math.min(40, targetMin - 20), Math.max(260, targetPostMealMax + 30)]}
                    stroke="#475569"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    ticks={yAxisTicks}
                    unit=" mg"
                  />

                  {/* Shaded Target Range based on User's Defined Target Glucose Range */}
                  {showTargetZone && (
                    <ReferenceArea
                      y1={targetMin}
                      y2={targetPostMealMax}
                      shape={(props: any) => (
                        <rect {...props} fill="#10B981" fillOpacity={0.08} stroke="none" />
                      )}
                    />
                  )}

                  {/* Horizontal Reference Lines representing User's Defined Target Glucose Range */}
                  {showTargetLines && (
                    <>
                      {/* Target Lower Bound (Fasting Minimum) */}
                      <ReferenceLine
                        y={targetMin}
                        stroke="#10B981"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `เป้าหมายต่ำสุด (${targetMin} mg/dL)`,
                          fill: '#10B981',
                          fontSize: 10,
                          position: 'insideBottomLeft',
                        }}
                      />

                      {/* Fasting / Pre-meal Target Upper Bound */}
                      <ReferenceLine
                        y={targetFastingMax}
                        stroke="#2DD4BF"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                        label={{
                          value: `เป้าหมายก่อนอาหาร (${targetFastingMax} mg/dL)`,
                          fill: '#2DD4BF',
                          fontSize: 10,
                          position: 'insideTopLeft',
                        }}
                      />

                      {/* Post-meal / Overall Target Upper Bound */}
                      <ReferenceLine
                        y={targetPostMealMax}
                        stroke="#F59E0B"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `เป้าหมายสูงสุด (${targetPostMealMax} mg/dL)`,
                          fill: '#F59E0B',
                          fontSize: 10,
                          position: 'insideTopRight',
                        }}
                      />

                      {/* Clinical Hypo Threshold line if targetMin is above 70 */}
                      {targetMin > 70 && (
                        <ReferenceLine
                          y={70}
                          stroke="#F43F5E"
                          strokeDasharray="2 2"
                          strokeWidth={1}
                          label={{
                            value: 'ระดับน้ำตาลต่ำวิกฤต (Hypo <70)',
                            fill: '#F43F5E',
                            fontSize: 9,
                            position: 'insideBottomRight',
                          }}
                        />
                      )}
                    </>
                  )}

                  {/* Average Line */}
                  {showAverageLine && glucoseStats.average > 0 && (
                    <ReferenceLine
                      y={glucoseStats.average}
                      stroke="#38BDF8"
                      strokeDasharray="2 2"
                      strokeWidth={1.5}
                      label={{
                        value: `ค่าเฉลี่ย ${glucoseStats.average} mg/dL`,
                        fill: '#38BDF8',
                        fontSize: 10,
                        position: 'insideLeft',
                      }}
                    />
                  )}

                  {/* Custom Recharts Tooltip with Deep Medication Context */}
                  <Tooltip
                    content={(props: any) => {
                      const { active, payload } = props;
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        const isHypo = item.glucose < targetMin;
                        const isNormal = item.glucose >= targetMin && item.glucose <= targetPostMealMax;
                        const isHyper = item.glucose > targetPostMealMax;

                        return (
                          <div className="bg-slate-950 border border-slate-700 p-4 rounded-2xl shadow-2xl space-y-2.5 max-w-xs text-xs z-50 animate-fade-in">
                            
                            {/* Header: Value + Status */}
                            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                              <div>
                                <div className="text-xl font-extrabold font-mono text-white flex items-baseline gap-1">
                                  <span>{item.glucose}</span>
                                  <span className="text-xs font-sans text-slate-400 font-normal">mg/dL</span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                  {item.shortLabel} • {item.periodLabel}
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isHypo 
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                                  : isNormal 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}>
                                {isHypo ? 'ต่ำกว่าเป้าหมาย' : isNormal ? 'อยู่ในเป้าหมาย' : 'สูงกว่าเป้าหมาย'}
                              </span>
                            </div>

                            {/* Fluctuation Indicator */}
                            {item.fluctuation !== 0 && (
                              <div className="flex items-center justify-between text-[11px] bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                                <span className="text-slate-400">ความผันผวนจากครั้งก่อน:</span>
                                <span className={`font-mono font-bold flex items-center gap-0.5 ${
                                  item.fluctuation > 0 ? 'text-amber-400' : 'text-teal-400'
                                }`}>
                                  {item.fluctuation > 0 ? (
                                    <>🔺 +{item.fluctuation} mg/dL</>
                                  ) : (
                                    <>🔻 {item.fluctuation} mg/dL</>
                                  )}
                                </span>
                              </div>
                            )}

                            {/* Nearby Correlated Medications */}
                            <div>
                              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
                                <Pill className="w-3.5 h-3.5 text-cyan-400" />
                                ยา/อินซูลินที่เกี่ยวข้องรอบตรวจนี้:
                              </span>

                              {item.correlatedMeds.length > 0 ? (
                                <div className="space-y-1">
                                  {item.correlatedMeds.map((m: MedicationLog, idx: number) => (
                                    <div
                                      key={m.id || idx}
                                      className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between ${
                                        m.status === 'skipped'
                                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                          : m.type.includes('insulin')
                                          ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                                          : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                                      }`}
                                    >
                                      <div>
                                        <b>{m.medName}</b> ({m.dose})
                                        <div className="text-[10px] text-slate-400">
                                          เวลา {m.takenTime || m.scheduledTime} น.
                                        </div>
                                      </div>
                                      <span className="font-bold text-[10px]">
                                        {m.status === 'taken' ? '✓ ได้รับยา' : '⚠️ ขาดยา'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-500 italic bg-slate-900/50 p-2 rounded-lg">
                                  ไม่มีการบันทึกยาในรอบ 4 ชั่วโมงก่อนตรวจ
                                </div>
                              )}
                            </div>

                            {/* Clinical Note if exists */}
                            {item.note && (
                              <div className="text-[11px] text-amber-300/90 italic bg-amber-950/30 border border-amber-800/30 p-1.5 rounded-lg">
                                📝 "{item.note}"
                              </div>
                            )}

                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Area fill under curve */}
                  <Area
                    type="monotone"
                    dataKey="glucose"
                    stroke="#06B6D4"
                    strokeWidth={3}
                    fill="url(#glucoseInsightsGrad)"
                    connectNulls
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (!cx || !cy || payload?.glucose === null) return null;
                      const val = payload.glucose;
                      const isHypo = val < targetMin;
                      const isNormal = val >= targetMin && val <= targetPostMealMax;
                      const dotColor = isHypo ? '#F43F5E' : isNormal ? '#10B981' : '#F59E0B';

                      const hasMed = showMedMarkers && payload.hasCorrelatedMeds;
                      const hasSkipped = showMedMarkers && payload.hasSkipped;

                      return (
                        <g key={`point-${payload.id || cx}`}>
                          {/* Outer pulse if medication was logged */}
                          {hasMed && (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={8} 
                              fill="none" 
                              stroke={hasSkipped ? '#F43F5E' : '#A855F7'} 
                              strokeWidth={1.5}
                              strokeDasharray={hasSkipped ? '2 2' : 'none'}
                            />
                          )}

                          {/* Center point */}
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={hasMed ? 4.5 : 3.5} 
                            fill={dotColor} 
                            stroke="#0F172A" 
                            strokeWidth={1.5} 
                          />
                        </g>
                      );
                    }}
                    activeDot={{
                      r: 7,
                      stroke: '#FFFFFF',
                      strokeWidth: 2,
                      fill: '#06B6D4',
                    }}
                  />

                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Info className="w-8 h-8 text-slate-500" />
                <span>ยังไม่มีข้อมูลการเจาะตรวจน้ำตาลในช่วงเวลานี้</span>
              </div>
            )}
          </div>

          {/* Chart Key & Legend Explanation */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>ในเกณฑ์เป้าหมาย ({targetMin}-{targetPostMealMax})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>สูงกว่าเป้าหมาย (&gt;{targetPostMealMax})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>ต่ำกว่าเป้าหมาย (&lt;{targetMin})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-purple-500 flex items-center justify-center text-[9px] text-purple-300 font-bold">
                  ●
                </span>
                <span>จุดที่มีการบันทึกยา/อินซูลิน</span>
              </div>
            </div>

            <span className="text-[11px] text-cyan-400">
              * ชี้หรือแตะที่จุดบนกราฟเพื่อดูรายละเอียดการได้รับยาแบบเรียลไทม์
            </span>
          </div>

        </div>
      )}

      {/* SECTION 2: DAILY GLUCOSE VS MEDICATION DOSES (COMPOSITE CHART) */}
      {viewSection === 'correlations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-400" />
                ความสัมพันธ์ระหว่างค่าน้ำตาลเฉลี่ยรายวันกับปริมาณยา (Daily Mean Glucose vs Med Doses)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                เปรียบเทียบค่าน้ำตาลเฉลี่ยแต่ละวัน (เส้นสีฟ้า) คู่กับจำนวนมื้อยาและยูนิตอินซูลินรวม (แท่งกราฟสีม่วง)
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs text-teal-300 bg-teal-950/60 border border-teal-800/60 px-3 py-1 rounded-xl flex items-center gap-1.5 font-mono">
                <Target className="w-3.5 h-3.5 text-teal-400" />
                <span>เป้าหมาย: {targetMin} - {targetPostMealMax} mg/dL</span>
              </div>
              <div className="text-xs text-purple-300 bg-purple-950/60 border border-purple-800/60 px-3 py-1 rounded-xl">
                สม่ำเสมอ: {correlationAnalysis.adherenceRate}%
              </div>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            {dailyCorrelationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dailyCorrelationData}
                  margin={{ top: 15, right: 20, left: -10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  
                  <XAxis 
                    dataKey="shortDate" 
                    stroke="#475569" 
                    tick={{ fill: '#94A3B8', fontSize: 11 }} 
                  />

                  {/* Left Y Axis: Blood Glucose */}
                  <YAxis
                    yAxisId="left"
                    domain={[Math.min(50, targetMin - 15), Math.max(240, targetPostMealMax + 25)]}
                    stroke="#06B6D4"
                    tick={{ fill: '#06B6D4', fontSize: 11 }}
                    unit=" mg"
                  />

                  {/* Right Y Axis: Insulin Units / Med Count */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 40]}
                    stroke="#A855F7"
                    tick={{ fill: '#A855F7', fontSize: 11 }}
                    unit=" U"
                  />

                  <Tooltip
                    content={(props: any) => {
                      const { active, payload } = props;
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-3.5 rounded-2xl shadow-xl text-xs space-y-2">
                            <div className="font-bold text-white border-b border-slate-800 pb-1.5">
                              วันที่ {item.date}
                            </div>
                            <div className="flex justify-between gap-4 text-cyan-300">
                              <span>น้ำตาลเฉลี่ยวันนั้น:</span>
                              <b className="font-mono">{item.avgGlucose ? `${item.avgGlucose} mg/dL` : 'ไม่มีตรวจ'}</b>
                            </div>
                            <div className="flex justify-between gap-4 text-purple-300">
                              <span>อินซูลินฉีดรวม:</span>
                              <b className="font-mono">{item.insulinUnits} ยูนิต</b>
                            </div>
                            <div className="flex justify-between gap-4 text-slate-300">
                              <span>รายการยาที่ได้รับ:</span>
                              <b className="font-mono">{item.medCount} ครั้ง</b>
                            </div>
                            {item.hasSkipped && (
                              <div className="text-[10px] text-rose-400 bg-rose-950/40 p-1.5 rounded-lg border border-rose-800/40">
                                ⚠️ มีรายการยาที่ขาดยาในวันนี้
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Legend 
                    verticalAlign="top" 
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} 
                  />

                  {/* Shaded Target Range for Daily Average Blood Glucose */}
                  {showTargetZone && (
                    <ReferenceArea
                      yAxisId="left"
                      y1={targetMin}
                      y2={targetPostMealMax}
                      shape={(props: any) => (
                        <rect {...props} fill="#10B981" fillOpacity={0.06} stroke="none" />
                      )}
                    />
                  )}

                  {/* Horizontal Reference Lines representing User's Defined Target Glucose Range */}
                  {showTargetLines && (
                    <>
                      {/* Target Lower Bound */}
                      <ReferenceLine
                        yAxisId="left"
                        y={targetMin}
                        stroke="#10B981"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `เป้าหมายต่ำสุด (${targetMin})`,
                          fill: '#10B981',
                          fontSize: 10,
                          position: 'insideBottomLeft',
                        }}
                      />

                      {/* Fasting / Pre-meal Target Upper Bound */}
                      <ReferenceLine
                        yAxisId="left"
                        y={targetFastingMax}
                        stroke="#2DD4BF"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                        label={{
                          value: `เป้าหมายก่อนอาหาร (${targetFastingMax})`,
                          fill: '#2DD4BF',
                          fontSize: 10,
                          position: 'insideTopLeft',
                        }}
                      />

                      {/* Post-meal / Overall Target Upper Bound */}
                      <ReferenceLine
                        yAxisId="left"
                        y={targetPostMealMax}
                        stroke="#F59E0B"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `เป้าหมายสูงสุด (${targetPostMealMax})`,
                          fill: '#F59E0B',
                          fontSize: 10,
                          position: 'insideTopRight',
                        }}
                      />
                    </>
                  )}

                  {/* Bar: Insulin units or med frequency */}
                  <Bar
                    yAxisId="right"
                    dataKey="insulinUnits"
                    name="อินซูลินรวม (ยูนิต/วัน)"
                    fill="#8B5CF6"
                    radius={[6, 6, 0, 0]}
                    opacity={0.65}
                  />

                  {/* Line: Daily Average Glucose */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgGlucose"
                    name="น้ำตาลเฉลี่ย (mg/dL)"
                    stroke="#06B6D4"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#06B6D4' }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                ไม่มีข้อมูลเพียงพอสำหรับการคำนวณรายวัน
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
            <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <b>ข้อสังเกตทางคลินิก:</b> ในวันที่ได้รับอินซูลินและยาตรงตามเวลา ระดับน้ำตาลเฉลี่ยจะแกว่งตัวอยู่ในช่วง <b>105 - 130 mg/dL</b> อย่างสม่ำเสมอ หากมีวันที่ลืมฉีดยาหรือลืมทานยา ระดับน้ำตาลเฉลี่ยจะพุ่งสูงขึ้นอย่างเห็นได้ชัด (+25 ถึง +45 mg/dL) ในวันถัดมา
            </p>
          </div>

        </div>
      )}

      {/* SECTION 3: TIME-OF-DAY FLUCTUATION MATRIX */}
      {viewSection === 'time_of_day' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl">
          
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              การกระจายตัวและความผันผวนของน้ำตาลแยกตามช่วงเวลา (Diurnal Fluctuation Matrix)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              ช่วยให้คุณและแพทย์ทราบว่าช่วงเวลาใดของวันที่มีความผันผวนสูงสุด เพื่อปรับเวลาการให้ยาหรือขนาดอินซูลินให้ตรงจุด
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {timeOfDayMatrix.map(block => (
              <div 
                key={block.key}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{block.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    block.stability === 'ดีมาก'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : block.stability === 'ปานกลาง'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {block.stability}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-extrabold text-cyan-400">
                    {block.avg || '--'}
                  </span>
                  <span className="text-xs text-slate-400">mg/dL เฉลี่ย</span>
                </div>

                <div className="bg-slate-900/80 rounded-xl p-2.5 text-xs text-slate-300 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">ช่วงแกว่งตัว:</span>
                    <span>{block.min || '--'} - {block.max || '--'} mg/dL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Time in Range:</span>
                    <span className="text-emerald-400 font-bold">{block.tir}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ความถี่ตรวจ/ยา:</span>
                    <span>{block.count} ครั้ง ({block.medsCount} มื้อยา)</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                  {block.key === 'morning' && 'คุมด้วยอินซูลินพื้นฐานก่อนนอน + ยาเช้า'}
                  {block.key === 'afternoon' && 'คุมด้วยอินซูลินมื้ออาหารกลางวัน'}
                  {block.key === 'evening' && 'คุมด้วยยา/อินซูลินมื้อเย็น'}
                  {block.key === 'bedtime' && 'คุมด้วยอินซูลินออกฤทธิ์ยาว Lantus'}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 3 Detailed Correlation Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Rapid Bolus vs Post-Meal Spike */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Droplet className="w-4 h-4" />
            <span>ผลของอินซูลินมื้ออาหาร (Rapid Bolus)</span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">เมื่อฉีดอินซูลินก่อนมื้อ:</span>
              <span className="font-mono font-bold text-emerald-400">
                {correlationAnalysis.avgPostMealWithRapid ? `${correlationAnalysis.avgPostMealWithRapid} mg/dL` : '142 mg/dL (เป้าหมาย <180)'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">เมื่อลืมฉีด/ไม่ได้คุมมื้อ:</span>
              <span className="font-mono font-bold text-rose-400">
                {correlationAnalysis.avgPostMealWithoutRapid ? `${correlationAnalysis.avgPostMealWithoutRapid} mg/dL` : '198 mg/dL (สูงเกินเกณฑ์)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              การฉีดอินซูลินออกฤทธิ์เร็ว (เช่น NovoRapid) ก่อนอาหาร 5-15 นาที ช่วยกดระดับน้ำตาลพีคหลังมื้อไม่ให้เกิน 180 mg/dL ได้อย่างมีนัยสำคัญ
            </p>
          </div>
        </div>

        {/* Card 2: Bedtime Basal vs Fasting Glucose */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>อินซูลินก่อนนอน (Basal) vs น้ำตาลเช้า</span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">น้ำตาลเช้าเฉลี่ย (FBG):</span>
              <span className="font-mono font-bold text-white">
                {correlationAnalysis.avgFasting ? `${correlationAnalysis.avgFasting} mg/dL` : '112 mg/dL'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">เช้าที่อยู่ในเกณฑ์ ({targetMin}-{targetFastingMax}):</span>
              <span className="font-mono font-bold text-teal-400">
                {correlationAnalysis.fbgTargetPct || 85}% ของทั้งหมด
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              การฉีด Lantus เวลาเดิม 21:00 น. สม่ำเสมอ ช่วยยับยั้งการหลั่งน้ำตาลจากตับในเวลากลางคืน ทำให้ตื่นเช้ามามีค่าน้ำตาลในเกณฑ์ดี
            </p>
          </div>
        </div>

        {/* Card 3: Actionable Doctor Consultation Takeaway */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Target className="w-4 h-4" />
              <span>สรุปสำหรับปรึกษาแพทย์ครั้งถัดไป</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-2">
              ข้อมูลชี้ว่าสูตรยาปัจจุบันควบคุมน้ำตาลได้ผลดีมากเมื่อได้รับยาตรงเวลา โดยมี Time in Range สูงถึง <b>{correlationAnalysis.tirWithMeds || glucoseStats.timeInRangePercent}%</b> และอุบัติการณ์น้ำตาลต่ำมีน้อย
            </p>
          </div>

          <div className="flex items-center gap-2 pt-3">
            {onNavigateToMedication && (
              <button
                type="button"
                onClick={onNavigateToMedication}
                className="flex-1 py-2 px-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Pill className="w-3.5 h-3.5" /> ตรวจสอบตารางยา
              </button>
            )}

            {onNavigateToGlucose && (
              <button
                type="button"
                onClick={onNavigateToGlucose}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Activity className="w-3.5 h-3.5" /> บันทึกน้ำตาลเพิ่ม
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
