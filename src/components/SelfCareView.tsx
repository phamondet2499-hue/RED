import { useState, type FormEvent } from 'react';
import { 
  HeartHandshake, 
  Droplet, 
  Footprints, 
  Activity, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { FootCheckRecord, ExerciseRecord, WaterRecord, VitalsRecord } from '../types';
import { soundFx } from '../utils/sound';
import confetti from 'canvas-confetti';

interface SelfCareViewProps {
  waterLogs: WaterRecord[];
  exerciseLogs: ExerciseRecord[];
  footLogs: FootCheckRecord[];
  vitalsLogs: VitalsRecord[];
  dailyWaterTarget: number;
  onAddWater: (amount: number) => void;
  onAddExercise: (ex: Omit<ExerciseRecord, 'id'>) => void;
  onDeleteExercise: (id: string) => void;
  onSaveFootCheck: (check: Omit<FootCheckRecord, 'id'>) => void;
  onAddVitals: (vitals: Omit<VitalsRecord, 'id'>) => void;
}

export function SelfCareView({
  waterLogs,
  exerciseLogs,
  footLogs,
  vitalsLogs,
  dailyWaterTarget = 2000,
  onAddWater,
  onAddExercise,
  onDeleteExercise,
  onSaveFootCheck,
  onAddVitals,
}: SelfCareViewProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Water State
  const todayWater = waterLogs.find(w => w.date === selectedDate);
  const currentWaterMl = todayWater ? todayWater.amountMl : 0;
  const waterPct = Math.min(100, Math.round((currentWaterMl / dailyWaterTarget) * 100));

  // Exercise Form State
  const [exType, setExType] = useState('เดินเร็ว');
  const [duration, setDuration] = useState('30');
  const [steps, setSteps] = useState('4000');
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'vigorous'>('moderate');
  const [exNote, setExNote] = useState('');

  // Foot Check State for today
  const todayFootCheck = footLogs.find(f => f.date === selectedDate);
  const [hasRedness, setHasRedness] = useState(todayFootCheck?.hasRedness || false);
  const [hasBlister, setHasBlister] = useState(todayFootCheck?.hasBlister || false);
  const [hasNumbness, setHasNumbness] = useState(todayFootCheck?.hasNumbness || false);
  const [hasSwelling, setHasSwelling] = useState(todayFootCheck?.hasSwelling || false);
  const [hasDryCracks, setHasDryCracks] = useState(todayFootCheck?.hasDryCracks || false);
  const [footNote, setFootNote] = useState(todayFootCheck?.note || '');
  const [footSaved, setFootSaved] = useState(Boolean(todayFootCheck));

  // Vitals Form State
  const [sys, setSys] = useState('120');
  const [dia, setDia] = useState('80');
  const [pulse, setPulse] = useState('75');
  const [weight, setWeight] = useState('68');

  const handleWaterAdd = (amount: number) => {
    onAddWater(amount);
    soundFx.playSuccessTone();
    if (currentWaterMl + amount >= dailyWaterTarget) {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
    }
  };

  const handleExerciseSubmit = (e: FormEvent) => {
    e.preventDefault();
    const dur = Number(duration) || 20;
    const estCalories = intensity === 'vigorous' ? dur * 8 : intensity === 'moderate' ? dur * 5 : dur * 3;

    onAddExercise({
      date: selectedDate,
      time: new Date().toTimeString().slice(0, 5),
      type: exType,
      durationMinutes: dur,
      steps: Number(steps) || undefined,
      caloriesBurned: Math.round(estCalories),
      intensity,
      note: exNote.trim() || undefined,
    });

    soundFx.playSuccessTone();
    setExNote('');
  };

  const handleSaveFootInspection = () => {
    onSaveFootCheck({
      date: selectedDate,
      hasRedness,
      hasBlister,
      hasNumbness,
      hasSwelling,
      hasDryCracks,
      note: footNote.trim() || 'ตรวจสุขภาพเท้าประจำวันเรียบร้อย',
    });

    setFootSaved(true);
    soundFx.playSuccessTone();
  };

  const handleVitalsSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!sys || !dia) return;

    onAddVitals({
      date: selectedDate,
      time: new Date().toTimeString().slice(0, 5),
      sys: Number(sys),
      dia: Number(dia),
      pulse: Number(pulse) || 75,
      weight: Number(weight) || undefined,
    });

    soundFx.playSuccessTone();
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-emerald-400" />
            การดูแลตัวเอง & ตรวจสุขภาพเท้า (Self-Care & Foot Check)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            การดื่มน้ำ ออกกำลังกายอย่างเหมาะสม และการตรวจเท้าทุกวันเป็นหัวใจสำคัญในการป้องกันภาวะแทรกซ้อน
          </p>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            const found = footLogs.find(f => f.date === e.target.value);
            if (found) {
              setHasRedness(found.hasRedness);
              setHasBlister(found.hasBlister);
              setHasNumbness(found.hasNumbness);
              setHasSwelling(found.hasSwelling);
              setHasDryCracks(found.hasDryCracks);
              setFootNote(found.note || '');
              setFootSaved(true);
            } else {
              setFootSaved(false);
            }
          }}
          className="bg-slate-900 border border-slate-700 text-xs sm:text-sm rounded-xl px-3.5 py-2 text-white self-start sm:self-auto"
        />
      </div>

      {/* Row 1: Water Tracking & Foot Care Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Water Hydration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">บันทึกการดื่มน้ำ (Hydration)</h3>
            </div>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 font-bold px-2.5 py-1 rounded-full font-mono">
              เป้าหมาย {dailyWaterTarget} ml
            </span>
          </div>

          <div className="flex items-center justify-around py-4">
            
            {/* Visual Hydration Percentage Ring */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" stroke="#1E293B" strokeWidth="10" fill="none" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#06B6D4"
                  strokeWidth="10"
                  strokeDasharray="314.15"
                  strokeDashoffset={314.15 - (314.15 * waterPct) / 100}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold font-mono text-white">{currentWaterMl}</span>
                <span className="text-[11px] text-slate-400">/ {dailyWaterTarget} ml</span>
                <span className="text-xs font-bold text-cyan-400 mt-0.5">{waterPct}%</span>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => handleWaterAdd(200)}
                className="w-full px-4 py-2 bg-slate-950 hover:bg-cyan-950/50 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
              >
                <span>🥛 แก้วเล็ก (+200 ml)</span>
              </button>
              <button
                onClick={() => handleWaterAdd(350)}
                className="w-full px-4 py-2 bg-slate-950 hover:bg-cyan-950/50 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
              >
                <span>🍶 แก้วกลาง (+350 ml)</span>
              </button>
              <button
                onClick={() => handleWaterAdd(500)}
                className="w-full px-4 py-2 bg-slate-950 hover:bg-cyan-950/50 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
              >
                <span>🧴 ขวดน้ำ (+500 ml)</span>
              </button>
            </div>

          </div>

          <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            💡 <b>คำแนะนำ:</b> การดื่มน้ำเปล่าอย่างเพียงพอช่วยให้ไตขับน้ำตาลส่วนเกินออกทางปัสสาวะ และป้องกันภาวะเลือดข้นหนืด
          </p>
        </div>

        {/* Diabetic Foot Care Daily Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <h3 className="text-lg font-bold text-white">ตรวจสุขภาพเท้าประจำวัน (Foot Check)</h3>
            </div>
            {footSaved && (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                ✓ บันทึกวันนี้แล้ว
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            ตรวจดูฝ่าเท้า ซอกนิ้ว และเล็บเท้า เพื่อป้องกันแผลเรื้อรังที่อาจเกิดจากเส้นประสาทส่วนปลายเสื่อม
          </p>

          <div className="space-y-2.5">
            
            <label className="flex items-center justify-between bg-slate-950/70 p-3 rounded-2xl border border-slate-800 cursor-pointer">
              <span className="text-xs text-slate-300">1. พบรอยแดง ผื่น หรือรอยเสียดสี</span>
              <input
                type="checkbox"
                checked={hasRedness}
                onChange={(e) => setHasRedness(e.target.checked)}
                className="w-5 h-5 accent-rose-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-950/70 p-3 rounded-2xl border border-slate-800 cursor-pointer">
              <span className="text-xs text-slate-300">2. มีตุ่มน้ำพอง ตาปลา หรือแผลเปิด</span>
              <input
                type="checkbox"
                checked={hasBlister}
                onChange={(e) => setHasBlister(e.target.checked)}
                className="w-5 h-5 accent-rose-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-950/70 p-3 rounded-2xl border border-slate-800 cursor-pointer">
              <span className="text-xs text-slate-300">3. มีอาการชา ปวดแสบร้อน หรือไร้ความรู้สึก</span>
              <input
                type="checkbox"
                checked={hasNumbness}
                onChange={(e) => setHasNumbness(e.target.checked)}
                className="w-5 h-5 accent-rose-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-950/70 p-3 rounded-2xl border border-slate-800 cursor-pointer">
              <span className="text-xs text-slate-300">4. มีอาการบวม หรืออุณหภูมิเท้าอุ่นผิดปกติ</span>
              <input
                type="checkbox"
                checked={hasSwelling}
                onChange={(e) => setHasSwelling(e.target.checked)}
                className="w-5 h-5 accent-rose-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-950/70 p-3 rounded-2xl border border-slate-800 cursor-pointer">
              <span className="text-xs text-slate-300">5. ผิวส้นเท้าแตกแห้ง หรือเล็บขบ</span>
              <input
                type="checkbox"
                checked={hasDryCracks}
                onChange={(e) => setHasDryCracks(e.target.checked)}
                className="w-5 h-5 accent-rose-500 rounded"
              />
            </label>

          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={footNote}
              onChange={(e) => setFootNote(e.target.value)}
              placeholder="บันทึกสภาพเท้า เช่น ทาโลชั่นแล้ว ผิวปกติ"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
            <button
              onClick={handleSaveFootInspection}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              บันทึกตรวจเท้า
            </button>
          </div>
        </div>

      </div>

      {/* Row 2: Exercise Tracker & Blood Pressure Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Exercise Tracker Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Footprints className="w-5 h-5 text-amber-400" />
            บันทึกการออกกำลังกาย & จำนวนก้าว
          </h3>

          <form onSubmit={handleExerciseSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">ประเภทกิจกรรม</label>
                <select
                  value={exType}
                  onChange={(e) => setExType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option>เดินเร็ว</option>
                  <option>วิ่งเหยาะๆ</option>
                  <option>ปั่นจักรยาน</option>
                  <option>ว่ายน้ำ</option>
                  <option>กายบริหาร / โยคะ</option>
                  <option>ทำงานบ้าน / ทำสวน</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ระยะเวลา (นาที) *</label>
                <input
                  type="number"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">จำนวนก้าว (ถ้ามี)</label>
                <input
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="เช่น 5000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ระดับความเหนื่อย</label>
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="light">เบา (พูดคุยได้สบาย)</option>
                  <option value="moderate">ปานกลาง (พอพูดเป็นประโยคได้)</option>
                  <option value="vigorous">หนัก (หอบเหนื่อย)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              + บันทึกการออกกำลังกาย
            </button>
          </form>

          {/* Today's Exercise List */}
          <div className="space-y-2 pt-2">
            {exerciseLogs.filter(e => e.date === selectedDate).map((e) => (
              <div key={e.id} className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{e.type}</span>
                  <span className="text-slate-400 ml-2">({e.durationMinutes} นาที • ~{e.caloriesBurned} kcal)</span>
                  {e.steps && <div className="text-amber-400 font-mono mt-0.5">{e.steps.toLocaleString()} ก้าว</div>}
                </div>
                <button
                  onClick={() => onDeleteExercise(e.id)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Vitals (BP & Weight) Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            บันทึกความดันโลหิต & น้ำหนัก
          </h3>

          <form onSubmit={handleVitalsSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">ความดันตัวบน (SYS) *</label>
                <input
                  type="number"
                  required
                  value={sys}
                  onChange={(e) => setSys(e.target.value)}
                  placeholder="เช่น 120"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ความดันตัวล่าง (DIA) *</label>
                <input
                  type="number"
                  required
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                  placeholder="เช่น 80"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">ชีพจร (bpm)</label>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  placeholder="เช่น 75"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">น้ำหนักตัว (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="เช่น 68.5"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              + บันทึกความดันและน้ำหนัก
            </button>
          </form>

          <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            🩺 <b>เกณฑ์ความดันโลหิตสำหรับผู้ป่วยเบาหวาน:</b> ควรควบคุมให้ต่ำกว่า <b>130/80 mmHg</b> เพื่อปกป้องไตและหลอดเลือดหัวใจ
          </p>
        </div>

      </div>

    </div>
  );
}
