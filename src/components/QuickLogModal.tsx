import { useState, type FormEvent } from 'react';
import { 
  X, 
  Activity, 
  Pill, 
  Utensils, 
  Heart, 
  Calendar,
  Check
} from 'lucide-react';
import { 
  GlucoseRecord, 
  MedicationSchedule, 
  MedicationLog, 
  FoodRecord, 
  VitalsRecord, 
  DoctorAppointment,
  GlucosePeriod
} from '../types';
import { soundFx } from '../utils/sound';

interface QuickLogModalProps {
  type: 'glucose' | 'medication' | 'vitals' | 'food' | 'appointment' | null;
  onClose: () => void;
  medSchedules: MedicationSchedule[];
  onAddGlucose: (record: Omit<GlucoseRecord, 'id'>) => void;
  onAddMedLog: (log: Omit<MedicationLog, 'id'>) => void;
  onAddFood: (food: Omit<FoodRecord, 'id'>) => void;
  onAddVitals: (vitals: Omit<VitalsRecord, 'id'>) => void;
  onAddAppointment: (appt: Omit<DoctorAppointment, 'id'>) => void;
}

export function QuickLogModal({
  type,
  onClose,
  medSchedules,
  onAddGlucose,
  onAddMedLog,
  onAddFood,
  onAddVitals,
  onAddAppointment,
}: QuickLogModalProps) {
  if (!type) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  // Glucose Form
  const [glVal, setGlVal] = useState('');
  const [glPeriod, setGlPeriod] = useState<GlucosePeriod>('fasting');
  const [glNote, setGlNote] = useState('');

  // Med Form
  const [selectedScheduleId, setSelectedScheduleId] = useState(medSchedules[0]?.id || '');

  // Vitals Form
  const [sys, setSys] = useState('120');
  const [dia, setDia] = useState('80');
  const [pulse, setPulse] = useState('75');

  // Food Form
  const [foodTitle, setFoodTitle] = useState('');
  const [foodCarbs, setFoodCarbs] = useState('30');
  const [foodMeal, setFoodMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  const handleGlucoseSubmit = (e: FormEvent) => {
    e.preventDefault();
    const val = Number(glVal);
    if (!val) return;
    onAddGlucose({
      date: todayStr,
      time: nowTime,
      period: glPeriod,
      value: val,
      note: glNote.trim() || undefined,
    });
    soundFx.playSuccessTone();
    onClose();
  };

  const handleMedSubmit = (e: FormEvent) => {
    e.preventDefault();
    const sch = medSchedules.find(s => s.id === selectedScheduleId);
    if (!sch) return;
    onAddMedLog({
      scheduleId: sch.id,
      medName: sch.name,
      type: sch.type,
      dose: sch.dose,
      date: todayStr,
      scheduledTime: sch.times[0] || nowTime,
      takenTime: nowTime,
      status: 'taken',
    });
    soundFx.playSuccessTone();
    onClose();
  };

  const handleVitalsSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!sys || !dia) return;
    onAddVitals({
      date: todayStr,
      time: nowTime,
      sys: Number(sys),
      dia: Number(dia),
      pulse: Number(pulse) || 75,
    });
    soundFx.playSuccessTone();
    onClose();
  };

  const handleFoodSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!foodTitle.trim()) return;
    const carbs = Number(foodCarbs) || 0;
    onAddFood({
      date: todayStr,
      time: nowTime,
      meal: foodMeal,
      title: foodTitle.trim(),
      carbsGrams: carbs,
      carbExchanges: Number((carbs / 15).toFixed(1)),
    });
    soundFx.playSuccessTone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            {type === 'glucose' && <Activity className="w-6 h-6 text-emerald-400" />}
            {type === 'medication' && <Pill className="w-6 h-6 text-purple-400" />}
            {type === 'vitals' && <Heart className="w-6 h-6 text-blue-400" />}
            {type === 'food' && <Utensils className="w-6 h-6 text-amber-400" />}
            <h3 className="text-lg font-bold text-white">
              {type === 'glucose' && 'บันทึกค่าน้ำตาลด่วน'}
              {type === 'medication' && 'บันทึกการใช้ยาด่วน'}
              {type === 'vitals' && 'บันทึกความดันโลหิตด่วน'}
              {type === 'food' && 'บันทึกมื้ออาหารด่วน'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Glucose Form */}
        {type === 'glucose' && (
          <form onSubmit={handleGlucoseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ค่าน้ำตาล (mg/dL) *</label>
              <input
                type="number"
                required
                autoFocus
                value={glVal}
                onChange={(e) => setGlVal(e.target.value)}
                placeholder="เช่น 115"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-bold font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ช่วงเวลาที่ตรวจ</label>
              <select
                value={glPeriod}
                onChange={(e) => setGlPeriod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="fasting">ก่อนอาหารเช้า (Fasting)</option>
                <option value="after_lunch">หลังอาหารกลางวัน (2 ชม.)</option>
                <option value="after_dinner">หลังอาหารเย็น (2 ชม.)</option>
                <option value="bedtime">ก่อนนอน</option>
                <option value="random">สุ่มตรวจ</option>
                <option value="during_hypo">น้ำตาลตก</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">บันทึกเพิ่มเติม (ถ้ามี)</label>
              <input
                type="text"
                value={glNote}
                onChange={(e) => setGlNote(e.target.value)}
                placeholder="เช่น ทานผลไม้ก่อนตรวจ"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg"
            >
              บันทึกค่าน้ำตาล
            </button>
          </form>
        )}

        {/* Medication Form */}
        {type === 'medication' && (
          <form onSubmit={handleMedSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">เลือกรายการยา / อินซูลิน</label>
              <select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                {medSchedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.dose})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl shadow-lg"
            >
              บันทึกว่าทาน/ฉีดแล้ว
            </button>
          </form>
        )}

        {/* Vitals Form */}
        {type === 'vitals' && (
          <form onSubmit={handleVitalsSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ตัวบน (SYS) *</label>
                <input
                  type="number"
                  required
                  value={sys}
                  onChange={(e) => setSys(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ตัวล่าง (DIA) *</label>
                <input
                  type="number"
                  required
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ชีพจร (bpm)</label>
              <input
                type="number"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg"
            >
              บันทึกความดัน
            </button>
          </form>
        )}

        {/* Food Form */}
        {type === 'food' && (
          <form onSubmit={handleFoodSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">มื้ออาหาร</label>
              <select
                value={foodMeal}
                onChange={(e) => setFoodMeal(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="breakfast">มื้อเช้า</option>
                <option value="lunch">มื้อกลางวัน</option>
                <option value="dinner">มื้อเย็น</option>
                <option value="snack">อาหารว่าง</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ชื่ออาหาร *</label>
              <input
                type="text"
                required
                value={foodTitle}
                onChange={(e) => setFoodTitle(e.target.value)}
                placeholder="เช่น ข้าวกล้อง 1.5 ทัพพี + อกไก่ย่าง"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">คาร์โบไฮเดรต (กรัม)</label>
              <input
                type="number"
                value={foodCarbs}
                onChange={(e) => setFoodCarbs(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold font-mono text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl shadow-lg"
            >
              บันทึกอาหาร
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
