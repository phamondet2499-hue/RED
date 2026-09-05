import { useState, type FormEvent } from 'react';
import { 
  Pill, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  AlertTriangle, 
  RotateCw, 
  Sparkles, 
  Droplet,
  Info,
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import { MedicationSchedule, MedicationLog, InjectionSite, MedicationType } from '../types';
import { INJECTION_SITES, SiteInfo } from '../utils/diabetesCalc';
import { soundFx } from '../utils/sound';

interface MedicationInsulinViewProps {
  schedules: MedicationSchedule[];
  logs: MedicationLog[];
  onAddSchedule: (schedule: Omit<MedicationSchedule, 'id'>) => void;
  onDeleteSchedule: (id: string) => void;
  onLogMedication: (log: Omit<MedicationLog, 'id'>) => void;
  onToggleScheduleActive: (id: string) => void;
}

export function MedicationInsulinView({
  schedules,
  logs,
  onAddSchedule,
  onDeleteSchedule,
  onLogMedication,
  onToggleScheduleActive,
}: MedicationInsulinViewProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<MedicationType>('oral_med');
  const [dose, setDose] = useState('1 เม็ด');
  const [unit, setUnit] = useState('เม็ด');
  const [time1, setTime1] = useState('08:00');
  const [time2, setTime2] = useState('');
  const [time3, setTime3] = useState('');
  const [mealRelation, setMealRelation] = useState<'before_meal' | 'after_meal' | 'with_meal' | 'bedtime' | 'anytime'>('after_meal');
  const [stock, setStock] = useState('30');
  const [instructions, setInstructions] = useState('');

  // Selected site modal state for logging an insulin shot
  const [activeInsulinSchedule, setActiveInsulinSchedule] = useState<{ schedule: MedicationSchedule; time: string } | null>(null);
  const [selectedSite, setSelectedSite] = useState<InjectionSite>('abdomen_top_right');

  // Find last used injection site from logs
  const insulinLogs = logs.filter(l => l.injectionSite);
  const lastInjectedSite = insulinLogs.length > 0 ? insulinLogs[0].injectionSite : undefined;

  const handleAddScheduleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const times = [time1, time2, time3].filter(Boolean);
    if (times.length === 0) times.push('08:00');

    const color = type.includes('insulin') ? '#8B5CF6' : '#3B82F6';

    onAddSchedule({
      name: name.trim(),
      type,
      dose,
      unit,
      times,
      mealRelation,
      color,
      currentStock: Number(stock) || 30,
      lowStockThreshold: 7,
      instructions: instructions.trim() || undefined,
      isActive: true,
    });

    soundFx.playSuccessTone();
    setName('');
    setInstructions('');
    setIsAdding(false);
  };

  const handleQuickTake = (schedule: MedicationSchedule, time: string) => {
    if (schedule.type.includes('insulin')) {
      // Open Site Picker Modal for insulin
      setActiveInsulinSchedule({ schedule, time });
    } else {
      // Oral med - record directly
      onLogMedication({
        scheduleId: schedule.id,
        medName: schedule.name,
        type: schedule.type,
        dose: schedule.dose,
        date: selectedDate,
        scheduledTime: time,
        takenTime: new Date().toTimeString().slice(0, 5),
        status: 'taken',
      });
      soundFx.playSuccessTone();
    }
  };

  const handleConfirmInsulinInjection = () => {
    if (!activeInsulinSchedule) return;

    onLogMedication({
      scheduleId: activeInsulinSchedule.schedule.id,
      medName: activeInsulinSchedule.schedule.name,
      type: activeInsulinSchedule.schedule.type,
      dose: activeInsulinSchedule.schedule.dose,
      date: selectedDate,
      scheduledTime: activeInsulinSchedule.time,
      takenTime: new Date().toTimeString().slice(0, 5),
      status: 'taken',
      injectionSite: selectedSite,
    });

    soundFx.playSuccessTone();
    setActiveInsulinSchedule(null);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Pill className="w-6 h-6 text-purple-400" />
            การจัดการยา & การฉีดอินซูลิน
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            บันทึกการใช้ยา หมุนเวียนตำแหน่งฉีดอินซูลิน และติดตามจำนวนยาคงเหลือ
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950/40 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>+ เพิ่มรายการยา/อินซูลิน</span>
        </button>
      </div>

      {/* Add Prescription Form */}
      {isAdding && (
        <form onSubmit={handleAddScheduleSubmit} className="bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              เพิ่มรายการยาหรืออินซูลินใหม่
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
            >
              ปิด
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ชื่อยา / ชนิดอินซูลิน *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น Metformin (500mg), Lantus, NovoRapid, Glimepiride"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ประเภท *
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const t = e.target.value as MedicationType;
                  setType(t);
                  if (t.includes('insulin')) {
                    setUnit('ยูนิต');
                    setDose('10 ยูนิต');
                  } else {
                    setUnit('เม็ด');
                    setDose('1 เม็ด');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="oral_med">ยารับประทาน (Oral Tablet/Capsule)</option>
                <option value="insulin_rapid">อินซูลินออกฤทธิ์เร็ว (Rapid/Short-acting)</option>
                <option value="insulin_long">อินซูลินออกฤทธิ์ยาว (Long/Basal)</option>
                <option value="insulin_mixed">อินซูลินผสม (Premixed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ขนาดยาต่อครั้ง
              </label>
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="เช่น 1 เม็ด หรือ 14 ยูนิต"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ความสัมพันธ์กับมื้ออาหาร
              </label>
              <select
                value={mealRelation}
                onChange={(e) => setMealRelation(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="before_meal">ก่อนอาหาร (15-30 นาที)</option>
                <option value="after_meal">หลังอาหารทันที</option>
                <option value="with_meal">พร้อมอาหาร</option>
                <option value="bedtime">ก่อนนอน (Bedtime)</option>
                <option value="anytime">เวลาใดก็ได้</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                จำนวนยาคงเหลือในคลัง
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="เช่น 30"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">เวลาที่ 1 (หลัก)</label>
              <input type="time" value={time1} onChange={(e) => setTime1(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">เวลาที่ 2 (ถ้ามี)</label>
              <input type="time" value={time2} onChange={(e) => setTime2(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">เวลาที่ 3 (ถ้ามี)</label>
              <input type="time" value={time3} onChange={(e) => setTime3(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              คำแนะนำเพิ่มเติมจากแพทย์
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="เช่น รับประทานหลังอาหารทันทีเพื่อลดอาการระคายเคืองกระเพาะ"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl shadow-lg"
            >
              บันทึกรายการยา
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Today's Checklist + Insulin Injection Site Rotation Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 cols: Today's Checklist & Schedule List */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Today's Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400" />
                  รายการยาที่ต้องใช้ประจำวัน
                </h3>
                <p className="text-xs text-slate-400">แตะที่รายการเพื่อบันทึกว่ารับประทานหรือฉีดแล้ว</p>
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs rounded-xl px-3 py-1.5 text-white"
              />
            </div>

            <div className="space-y-3">
              {schedules.filter(s => s.isActive).map((schedule) => {
                const isInsulin = schedule.type.includes('insulin');

                return schedule.times.map((t) => {
                  const log = logs.find(
                    l => l.scheduleId === schedule.id && l.date === selectedDate && l.scheduledTime === t && l.status === 'taken'
                  );
                  const isDone = Boolean(log);

                  return (
                    <div
                      key={`${schedule.id}_${t}`}
                      onClick={() => handleQuickTake(schedule, t)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isDone
                          ? 'bg-slate-950/60 border-slate-800/80'
                          : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-purple-500/50 shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all ${
                          isDone
                            ? 'bg-emerald-500 text-slate-950'
                            : 'border-2 border-slate-600 text-slate-400'
                        }`}>
                          {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <Clock className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                              {schedule.name}
                            </span>
                            {isInsulin ? (
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold rounded-full flex items-center gap-1">
                                <Droplet className="w-3 h-3" /> ฉีดอินซูลิน
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-semibold rounded-full flex items-center gap-1">
                                <Pill className="w-3 h-3" /> ยาทาน
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                            <span className="font-mono text-emerald-400 font-bold">{t} น.</span>
                            <span>• {schedule.dose}</span>
                            <span className="text-slate-500">
                              ({schedule.mealRelation === 'before_meal' ? 'ก่อนอาหาร' : schedule.mealRelation === 'after_meal' ? 'หลังอาหาร' : 'ก่อนนอน'})
                            </span>
                          </div>

                          {log?.injectionSite && (
                            <div className="mt-1 text-[11px] text-purple-300 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> ฉีดที่: {INJECTION_SITES.find(s => s.id === log.injectionSite)?.label}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-bold ${
                          isDone 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                        }`}>
                          {isDone ? '✓ บันทึกแล้ว' : 'แตะเพื่อบันทึก'}
                        </span>
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          </div>

          {/* Active Prescriptions Table / Inventory */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              รายการยา & ยอดคงเหลือในคลัง
            </h3>

            <div className="space-y-3">
              {schedules.map((s) => {
                const isLowStock = s.currentStock <= s.lowStockThreshold;

                return (
                  <div key={s.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{s.name}</span>
                        {isLowStock && (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold rounded-full flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> ยาใกล้หมด
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.dose} • เวลา: {s.times.join(', ')} น.
                      </p>
                      {s.instructions && (
                        <p className="text-[11px] text-slate-500 mt-1 italic">
                          💡 {s.instructions}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">คงเหลือ</div>
                        <div className={`font-mono font-bold text-base ${isLowStock ? 'text-rose-400' : 'text-white'}`}>
                          {s.currentStock} {s.unit}
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteSchedule(s.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="ลบรายการ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 5 cols: Interactive Insulin Injection Site Rotation Diagram */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4 sticky top-20">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-purple-400" />
                  แผนภาพหมุนเวียนตำแหน่งฉีดอินซูลิน
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  เปลี่ยนตำแหน่งทุกครั้งเพื่อป้องกันก้อนไขมันแข็งใต้ผิวหนัง (Lipohypertrophy)
                </p>
              </div>
            </div>

            {/* Human Body Map SVG */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 relative flex flex-col items-center justify-center min-h-[360px]">
              
              {/* Silhouette Vector */}
              <svg viewBox="0 0 200 320" className="w-full max-w-[220px] h-auto opacity-75">
                {/* Head */}
                <circle cx="100" cy="30" r="18" fill="#334155" />
                {/* Neck & Shoulders */}
                <path d="M 88 48 Q 100 52 112 48 L 145 68 L 135 125 L 125 125 L 125 185 L 140 295 L 112 295 L 102 195 L 98 195 L 88 295 L 60 295 L 75 185 L 75 125 L 65 125 L 55 68 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
                {/* Arms */}
                <path d="M 55 68 L 35 140 L 48 142 L 65 85 Z" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                <path d="M 145 68 L 165 140 L 152 142 L 135 85 Z" fill="#1E293B" stroke="#475569" strokeWidth="1" />
              </svg>

              {/* Interactive Hotspot Targets */}
              {INJECTION_SITES.map((site) => {
                const isLastUsed = lastInjectedSite === site.id;
                const isSelected = selectedSite === site.id;

                return (
                  <button
                    key={site.id}
                    onClick={() => setSelectedSite(site.id)}
                    style={{ left: `${site.x}%`, top: `${site.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isSelected
                        ? 'bg-purple-500 text-white ring-4 ring-purple-500/40 scale-125 z-20 shadow-lg'
                        : isLastUsed
                        ? 'bg-rose-500 text-white ring-2 ring-rose-500/50 z-10'
                        : 'bg-slate-700/90 text-slate-300 hover:bg-purple-600 hover:text-white border border-slate-500'
                    }`}
                    title={`${site.label}: ${site.description}`}
                  >
                    {isLastUsed ? '●' : '○'}
                  </button>
                );
              })}

              <div className="absolute bottom-2 inset-x-2 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center text-xs text-slate-300">
                <span className="font-semibold text-purple-300">ตำแหน่งที่เลือก: </span>
                <b>{INJECTION_SITES.find(s => s.id === selectedSite)?.label}</b>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {INJECTION_SITES.find(s => s.id === selectedSite)?.description}
                </p>
              </div>
            </div>

            {/* Injection Best Practices Checklist */}
            <div className="bg-purple-950/30 border border-purple-800/40 rounded-2xl p-4 text-xs space-y-2">
              <h4 className="font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> เทคนิคการฉีดอินซูลินที่ถูกต้อง:
              </h4>
              <ul className="space-y-1 text-slate-300">
                <li>• ดึงผิวหนังขึ้นเล็กน้อย และปักเข็ม 90 องศา (หรือ 45 องศาในคนผอม)</li>
                <li>• กดแป้นฉีดจนสุดและ<b>ค้างไว้ 10 วินาที</b>ก่อนดึงเข็มออก</li>
                <li>• ไม่คลึงหรือนวดบริเวณที่ฉีดหลังฉีดเสร็จ</li>
                <li>• เปลี่ยนหัวเข็มใหม่ทุกครั้ง ไม่ใช้เข็มซ้ำ</li>
              </ul>
            </div>

          </div>
        </div>

      </div>

      {/* Insulin Site Selection Modal when checking off an insulin dose */}
      {activeInsulinSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-purple-500/80 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2">
                <Droplet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">บันทึกการฉีดอินซูลิน</h3>
              <p className="text-sm text-purple-300 mt-0.5 font-medium">
                {activeInsulinSchedule.schedule.name} ({activeInsulinSchedule.schedule.dose})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                เลือกตำแหน่งที่ฉีดในรอบนี้ (หมุนเวียนตำแหน่ง):
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {INJECTION_SITES.map((site) => (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => setSelectedSite(site.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      selectedSite === site.id
                        ? 'bg-purple-600 border-purple-400 text-white font-bold shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>{site.label}</div>
                    <div className="text-[10px] opacity-75">{site.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveInsulinSchedule(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmInsulinInjection}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold shadow-lg"
              >
                ยืนยันการฉีด
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
