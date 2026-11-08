import { useState, useMemo } from 'react';
import { 
  Calculator, 
  Scale, 
  Target, 
  Droplet, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  RefreshCw, 
  Sliders, 
  Sparkles,
  Info,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { UserProfile, MedicationSchedule, GlucoseRecord, VitalsRecord } from '../types';
import { 
  calculateTDDFromSchedules, 
  estimateTDDFromWeight, 
  calculateInsulinToCarbRatio, 
  calculateMealBolus,
  THAI_FOOD_DATABASE
} from '../utils/diabetesCalc';
import { soundFx } from '../utils/sound';

interface InsulinCarbRatioCalculatorProps {
  profile: UserProfile;
  schedules: MedicationSchedule[];
  glucoseLogs?: GlucoseRecord[];
  vitalsLogs?: VitalsRecord[];
  onUpdateProfile?: (updatedProfile: UserProfile) => void;
}

export function InsulinCarbRatioCalculator({
  profile,
  schedules,
  glucoseLogs = [],
  vitalsLogs = [],
  onUpdateProfile,
}: InsulinCarbRatioCalculatorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Latest weight from vitals or profile
  const latestVitalsWeight = vitalsLogs.find(v => v.weight && v.weight > 0)?.weight;
  const initialWeight = profile.weightKg || latestVitalsWeight || 68;

  // Active insulin summary
  const insulinSummary = useMemo(() => calculateTDDFromSchedules(schedules), [schedules]);

  // Profile-based inputs
  const [weightKg, setWeightKg] = useState<number>(initialWeight);
  const [carbDailyTarget, setCarbDailyTarget] = useState<number>(profile.carbDailyTargetGrams || 135);
  const [rule, setRule] = useState<'500' | '450' | 'carb_target'>(profile.preferredIcrRule || '500');
  const [tddMode, setTddMode] = useState<'auto_schedules' | 'weight_based' | 'custom'>(
    insulinSummary.hasActiveInsulin ? 'auto_schedules' : 'weight_based'
  );
  const [customTdd, setCustomTdd] = useState<number>(
    profile.totalDailyInsulinUnits || (insulinSummary.hasActiveInsulin ? insulinSummary.totalDailyUnits : estimateTDDFromWeight(initialWeight, profile.diabetesType))
  );

  // Target glucose for correction calculation (default ~ 110 mg/dL)
  const targetGlucose = profile.targetFastingMax ? Math.min(120, Math.max(90, Math.round((profile.targetFastingMin + profile.targetFastingMax) / 2))) : 110;

  // Active TDD for calculation
  const effectiveTdd = useMemo(() => {
    if (tddMode === 'custom') return customTdd;
    if (tddMode === 'auto_schedules' && insulinSummary.hasActiveInsulin) {
      return insulinSummary.totalDailyUnits;
    }
    return estimateTDDFromWeight(weightKg, profile.diabetesType);
  }, [tddMode, customTdd, insulinSummary, weightKg, profile.diabetesType]);

  // Main ICR and ISF calculation result
  const icrResult = useMemo(() => {
    return calculateInsulinToCarbRatio({
      weightKg,
      diabetesType: profile.diabetesType,
      carbDailyTargetGrams: carbDailyTarget,
      customTdd: tddMode === 'custom' ? customTdd : (tddMode === 'weight_based' ? estimateTDDFromWeight(weightKg, profile.diabetesType) : undefined),
      activeSchedulesTdd: tddMode === 'auto_schedules' ? insulinSummary.totalDailyUnits : 0,
      rule,
      targetGlucose,
    });
  }, [weightKg, profile.diabetesType, carbDailyTarget, tddMode, customTdd, insulinSummary.totalDailyUnits, rule, targetGlucose]);

  // Meal Bolus Simulator State
  const latestGlucose = glucoseLogs.length > 0 ? glucoseLogs[0].value : 120;
  const [mealCarbs, setMealCarbs] = useState<number>(30); // e.g. 2 servings of rice (30g)
  const [preMealGlucose, setPreMealGlucose] = useState<number>(latestGlucose);
  const [includeCorrection, setIncludeCorrection] = useState<boolean>(true);

  // Meal bolus calculation
  const mealBolus = useMemo(() => {
    return calculateMealBolus({
      carbsGrams: mealCarbs,
      currentGlucose: includeCorrection ? preMealGlucose : undefined,
      targetGlucose,
      icr: icrResult.icr,
      isf: icrResult.isf,
    });
  }, [mealCarbs, includeCorrection, preMealGlucose, targetGlucose, icrResult.icr, icrResult.isf]);

  // Handle saving calculated ICR to User Profile
  const handleSaveToProfile = () => {
    if (!onUpdateProfile) return;

    const updated: UserProfile = {
      ...profile,
      weightKg,
      carbDailyTargetGrams: carbDailyTarget,
      totalDailyInsulinUnits: effectiveTdd,
      customIcr: icrResult.icr,
      customIsf: icrResult.isf,
      preferredIcrRule: rule,
    };

    onUpdateProfile(updated);
    soundFx.playSuccessTone();
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-purple-800/40 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
      
      {/* Top Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-800/30 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 shadow-inner">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white">
                คำนวณอัตราส่วนอินซูลินต่อคาร์โบไฮเดรต (Insulin-to-Carb Ratio : ICR)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                อิงการตั้งค่าโปรไฟล์
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              คำนวณขนาดอินซูลินที่เหมาะสมต่อปริมาณคาร์โบไฮเดรตในแต่ละมื้ออาหารตามมาตรฐาน ADA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
              showSettings 
                ? 'bg-purple-600 text-white border-purple-400' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {showSettings ? 'ซ่อนการตั้งค่า' : 'ปรับค่าโปรไฟล์'}
          </button>
          
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
            title={isOpen ? 'ย่อหน้าต่าง' : 'ขยายหน้าต่าง'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <>
          {/* Main Calculated Results Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* 1. ICR Result (Hero) */}
            <div className="bg-purple-900/30 border border-purple-500/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-purple-300 font-semibold mb-1">
                <span>อัตราส่วน ICR (I:C Ratio)</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-1.5">
                <span>1 : {icrResult.icr}</span>
                <span className="text-xs font-sans text-purple-300 font-normal">กรัมคาร์บ / 1U</span>
              </div>
              <p className="text-[11px] text-purple-200/80 mt-2 leading-relaxed">
                อินซูลินออกฤทธิ์เร็ว <b>1 ยูนิต</b> ครอบคลุมคาร์บได้ <b>{icrResult.icr} กรัม</b> (~{Math.round((icrResult.icr / 15) * 10) / 10} ทัพพีข้าว)
              </p>
            </div>

            {/* 2. ISF Result */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>ความไวอินซูลิน (ISF)</span>
                <Target className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-3xl font-extrabold text-teal-400 font-mono tracking-tight flex items-baseline gap-1.5">
                <span>{icrResult.isf}</span>
                <span className="text-xs font-sans text-slate-400 font-normal">mg/dL / 1U</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                อินซูลิน <b>1 ยูนิต</b> ช่วยลดน้ำตาลในเลือดลงได้ประมาณ <b>{icrResult.isf} mg/dL</b>
              </p>
            </div>

            {/* 3. TDD Used */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>อินซูลินรวมต่อวัน (TDD)</span>
                <Droplet className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-amber-400 font-mono tracking-tight flex items-baseline gap-1.5">
                <span>{effectiveTdd}</span>
                <span className="text-xs font-sans text-slate-400 font-normal">ยูนิต/วัน</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                <span>สัดส่วน 50:50 →</span>
                <span className="text-amber-300/90 font-medium">Basal {icrResult.basalUnits}U / Bolus {icrResult.bolusUnits}U</span>
              </div>
            </div>

            {/* 4. Daily Profile Link */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                  <span>ฐานข้อมูลโปรไฟล์</span>
                  <Scale className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xs text-slate-300 space-y-0.5 mt-1.5">
                  <div>น้ำหนัก: <b className="text-white">{weightKg} กก.</b> ({profile.diabetesType.toUpperCase()})</div>
                  <div>เป้าหมายคาร์บ: <b className="text-white">{carbDailyTarget} กรัม/วัน</b></div>
                  <div className="text-[11px] text-slate-400">สูตร: {rule === '500' ? 'กฎ 500 (Rapid)' : rule === '450' ? 'กฎ 450 (Regular)' : 'เป้าหมายคาร์บ'}</div>
                </div>
              </div>

              {onUpdateProfile && (
                <button
                  type="button"
                  onClick={handleSaveToProfile}
                  className="mt-3 w-full py-1.5 px-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 shadow"
                >
                  <Save className="w-3.5 h-3.5" /> บันทึกอัตราส่วนลงโปรไฟล์
                </button>
              )}
            </div>

          </div>

          {isSavedNotice && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> บันทึกอัตราส่วน ICR (1:{icrResult.icr}) และ ISF ({icrResult.isf} mg/dL) ลงในโปรไฟล์ประจำวันเรียบร้อยแล้ว
            </div>
          )}

          {/* Profile Adjuster Drawer */}
          {showSettings && (
            <div className="bg-slate-950/70 border border-purple-800/50 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  ปรับแต่งตัวแปรโปรไฟล์สำหรับการคำนวณ ICR
                </h4>
                <span className="text-[11px] text-slate-400">
                  ปรับได้ทันที ระบบจะคำนวณ ICR ให้อัตโนมัติ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    น้ำหนักตัว (กก.)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="200"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value) || 68)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {latestVitalsWeight ? `ล่าสุดจากการชั่ง: ${latestVitalsWeight} กก.` : 'ค่าเริ่มต้นจากโปรไฟล์'}
                  </span>
                </div>

                {/* Daily Carb Target */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    เป้าหมายคาร์บต่อวัน (กรัม)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="400"
                    value={carbDailyTarget}
                    onChange={(e) => setCarbDailyTarget(Number(e.target.value) || 135)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    เฉลี่ยมื้อละ ~{Math.round(carbDailyTarget / 3)} กรัมคาร์บ
                  </span>
                </div>

                {/* TDD Source */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ที่มาของ Total Daily Dose (TDD)
                  </label>
                  <select
                    value={tddMode}
                    onChange={(e) => setTddMode(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    {insulinSummary.hasActiveInsulin && (
                      <option value="auto_schedules">
                        คำนวณจากยาจริง ({insulinSummary.totalDailyUnits}U/วัน)
                      </option>
                    )}
                    <option value="weight_based">
                      คำนวณตามน้ำหนักตัว ({estimateTDDFromWeight(weightKg, profile.diabetesType)}U/วัน)
                    </option>
                    <option value="custom">กำหนดเองตามแพทย์สั่ง</option>
                  </select>

                  {tddMode === 'custom' && (
                    <input
                      type="number"
                      min="5"
                      max="200"
                      value={customTdd}
                      onChange={(e) => setCustomTdd(Number(e.target.value) || 20)}
                      placeholder="ระบุ TDD ยูนิต"
                      className="mt-1.5 w-full bg-slate-900 border border-purple-500 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                    />
                  )}
                </div>

                {/* Rule */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    สูตรการคำนวณ ICR
                  </label>
                  <select
                    value={rule}
                    onChange={(e) => setRule(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="500">กฎ 500 (สำหรับ NovoRapid / Humalog)</option>
                    <option value="450">กฎ 450 (สำหรับ Regular Actrapid)</option>
                    <option value="carb_target">ตามเป้าหมายคาร์บในโปรไฟล์</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    กฎ 500 เป็นมาตรฐานระดับสากล
                  </span>
                </div>

              </div>
            </div>
          )}

          {/* Interactive Meal Bolus Dose Simulator */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-purple-400" />
                  เครื่องจำลองคำนวณขนาดอินซูลินมื้ออาหาร (Interactive Meal Bolus)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  ทดสอบกรอกคาร์บในมื้ออาหารเพื่อคำนวณขนาดอินซูลินที่ต้องฉีดจริง (Food Bolus + Correction Bolus)
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400">เมนูด่วน:</span>
                <button
                  type="button"
                  onClick={() => setMealCarbs(15)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${mealCarbs === 15 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  ข้าว 1 ทัพพี (15g)
                </button>
                <button
                  type="button"
                  onClick={() => setMealCarbs(30)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${mealCarbs === 30 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  ข้าว 2 ทัพพี (30g)
                </button>
                <button
                  type="button"
                  onClick={() => setMealCarbs(45)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${mealCarbs === 45 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  มื้อปกติ (45g)
                </button>
                <button
                  type="button"
                  onClick={() => setMealCarbs(60)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${mealCarbs === 60 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  มื้อหนัก (60g)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              
              {/* Left 6 cols: Inputs */}
              <div className="lg:col-span-6 space-y-4">
                
                {/* 1. Meal Carbs Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      ปริมาณคาร์โบไฮเดรตในมื้อนี้:
                    </label>
                    <span className="text-xs font-bold text-purple-300 font-mono">
                      {mealCarbs} กรัม (~{(mealCarbs / 15).toFixed(1)} คาร์บ)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="120"
                      step="5"
                      value={mealCarbs}
                      onChange={(e) => setMealCarbs(Number(e.target.value))}
                      className="flex-1 accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={mealCarbs}
                      onChange={(e) => setMealCarbs(Number(e.target.value) || 0)}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-center text-sm font-bold text-white font-mono"
                    />
                  </div>
                </div>

                {/* 2. Pre-meal Blood Glucose */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={includeCorrection}
                        onChange={(e) => setIncludeCorrection(e.target.checked)}
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span>รวมการปรับแก้น้ำตาลก่อนอาหาร (Correction Bolus)</span>
                    </label>
                    {includeCorrection && (
                      <span className="text-xs font-bold text-teal-300 font-mono">
                        เป้าหมาย: {targetGlucose} mg/dL
                      </span>
                    )}
                  </div>

                  {includeCorrection && (
                    <div className="flex items-center gap-3 mt-1.5">
                      <input
                        type="number"
                        min="40"
                        max="500"
                        value={preMealGlucose}
                        onChange={(e) => setPreMealGlucose(Number(e.target.value) || 100)}
                        placeholder="ค่าน้ำตาลก่อนอาหาร"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold"
                      />
                      <span className="text-xs text-slate-400">mg/dL</span>
                      {glucoseLogs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setPreMealGlucose(glucoseLogs[0].value)}
                          className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded-xl border border-slate-700 transition"
                          title="ดึงค่าน้ำตาลล่าสุดจากการเจาะ"
                        >
                          ดึงค่าล่าสุด ({glucoseLogs[0].value})
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Right 6 cols: Calculated Dose Output Card */}
              <div className="lg:col-span-6">
                <div className={`rounded-2xl p-5 border transition-all ${
                  mealBolus.isHypoWarning
                    ? 'bg-rose-950/40 border-rose-500/60'
                    : mealBolus.isHighDoseWarning
                    ? 'bg-amber-950/30 border-amber-500/50'
                    : 'bg-purple-950/40 border-purple-500/50'
                }`}>
                  
                  {mealBolus.isHypoWarning ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                        <ShieldAlert className="w-5 h-5" />
                        เตือน: ค่าน้ำตาลต่ำกว่า 70 mg/dL (Hypoglycemia)
                      </div>
                      <p className="text-xs text-rose-200 leading-relaxed">
                        <b>ห้ามฉีดอินซูลินปรับแก้เด็ดขาด!</b> ให้ปฏิบัติตามกฎ 15-15 ทันที: ทานน้ำหวาน 1 แก้ว หรือลูกอม 3 เม็ด นั่งพัก 15 นาทีแล้วตรวจซ้ำ
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300">
                          ขนาดอินซูลินที่แนะนำสำหรับมื้อนี้
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
                          ICR 1:{icrResult.icr} • ISF {icrResult.isf}
                        </span>
                      </div>

                      {/* Big Dose Numbers */}
                      <div className="flex items-baseline gap-3">
                        <div className="text-4xl font-extrabold text-white font-mono tracking-tight">
                          {mealBolus.roundedUnitsHalf} <span className="text-lg font-sans font-medium text-purple-300">ยูนิต</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          (คำนวณละเอียด: {mealBolus.totalRecommendedUnits}U หรือปัดเต็ม {mealBolus.roundedUnitsWhole}U)
                        </div>
                      </div>

                      {/* Breakdown formula */}
                      <div className="bg-slate-950/70 rounded-xl p-2.5 text-xs text-slate-300 space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span>คุมคาร์บ ({mealCarbs}g ÷ {icrResult.icr}):</span>
                          <span className="font-bold text-white">{mealBolus.carbDose} ยูนิต</span>
                        </div>
                        {includeCorrection && (
                          <div className="flex justify-between text-teal-300">
                            <span>
                              {preMealGlucose > targetGlucose 
                                ? `แก้ส่วนเกิน (${preMealGlucose} - ${targetGlucose} ÷ ${icrResult.isf}):` 
                                : 'ค่าน้ำตาลในเกณฑ์ (ไม่ต้องปรับแก้):'}
                            </span>
                            <span className="font-bold">+{mealBolus.correctionDose} ยูนิต</span>
                          </div>
                        )}
                      </div>

                      {mealBolus.isHighDoseWarning && (
                        <div className="flex items-center gap-1.5 text-amber-300 text-xs bg-amber-500/15 p-2 rounded-lg border border-amber-500/30">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>ขนาดอินซูลินค่อนข้างสูง ({mealBolus.roundedUnitsHalf}U) โปรดตรวจสอบปริมาณคาร์บและปรึกษาแพทย์</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2.5 mt-3 flex items-center justify-between">
                    <span>* สำหรับใช้อ้างอิงและประเมินเบื้องต้น</span>
                    <span className="text-purple-300 font-semibold">ฉีดก่อนเริ่มมื้ออาหาร 5-15 นาที</span>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* Clinical Educational Guidance & Tips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
              <b className="text-purple-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> ICR (Insulin-to-Carb) คืออะไร?
              </b>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                คืออัตราส่วนที่บอกว่า <b>อินซูลิน 1 ยูนิต</b> จะช่วยเผาผลาญและคุมคาร์โบไฮเดรตได้กี่กรัม หากค่านี้น้อย (เช่น 1:6) แสดงว่ามีภาวะดื้ออินซูลินสูง
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
              <b className="text-teal-300 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> ISF (Correction Factor) คืออะไร?
              </b>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                คือค่าที่บอกว่า <b>อินซูลิน 1 ยูนิต</b> จะลดระดับน้ำตาลลงได้กี่ mg/dL ใช้สำหรับฉีดปรับแก้เมื่อค่าน้ำตาลก่อนอาหารสูงเกินเป้าหมาย
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
              <b className="text-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> ข้อควรระวังความปลอดภัย
              </b>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                ห้ามฉีดอินซูลินมื้ออาหารซ้ำภายใน 2-3 ชั่วโมง (Insulin Stacking) เพราะฤทธิ์ยาเก่าอาจยังค้างอยู่และทำให้เกิดภาวะน้ำตาลต่ำรุนแรง
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
