import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Phone, CheckCircle2, ChevronRight, X, Play, RotateCcw } from 'lucide-react';
import { soundFx } from '../utils/sound';

interface HypoModalProps {
  isOpen: boolean;
  onClose: () => void;
  emergencyContactName: string;
  emergencyContactPhone: string;
  onLogGlucose: (val: number) => void;
}

export function HypoEmergencyModal({
  isOpen,
  onClose,
  emergencyContactName,
  emergencyContactPhone,
  onLogGlucose
}: HypoModalProps) {
  const [timerSeconds, setTimerSeconds] = useState(15 * 60); // 15 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [recheckVal, setRecheckVal] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            soundFx.playEmergencyAlarm();
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startFifteenMinuteTimer = () => {
    setTimerSeconds(15 * 60);
    setIsTimerRunning(true);
    setStep(2);
    soundFx.playSuccessTone();
  };

  const handleFinishRecheck = () => {
    const val = Number(recheckVal);
    if (val && !isNaN(val)) {
      onLogGlucose(val);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl shadow-rose-950/50">
        
        {/* Urgent Header */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm animate-pulse">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-sans">คู่มือฉุกเฉิน: น้ำตาลในเลือดต่ำ (Hypo)</h3>
              <p className="text-rose-100 text-xs mt-0.5">ปฏิบัติตามกฎ 15-15 ทันทีเมื่อค่าน้ำตาล &lt; 70 mg/dL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Step Indicator */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2.5 rounded-xl border text-center text-xs font-semibold ${step === 1 ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              1. ทานคาร์บ 15g
            </div>
            <div className={`p-2.5 rounded-xl border text-center text-xs font-semibold ${step === 2 ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              2. พักรอ 15 นาที
            </div>
            <div className={`p-2.5 rounded-xl border text-center text-xs font-semibold ${step === 3 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              3. เจาะตรวจซ้ำ
            </div>
          </div>

          {/* STEP 1: Quick Sugar choices */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4">
                <h4 className="text-rose-300 font-semibold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                  เลือกทานสิ่งใดสิ่งหนึ่งทันที (คาร์โบไฮเดรตเชิงเดี่ยว 15 กรัม):
                </h4>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    🧃 <span><b>น้ำผลไม้แท้</b> หรือ <b>น้ำหวาน</b> 1 กล่อง/แก้ว (ประมาณ 150-180 มล.)</span>
                  </li>
                  <li className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    🍬 <span><b>ลูกอมหวาน</b> 3-4 เม็ด (เคี้ยวหรืออมให้ละลาย)</span>
                  </li>
                  <li className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    🍯 <span><b>น้ำตาลทราย</b> หรือ <b>น้ำผึ้ง</b> 1 ช้อนโต๊ะ ผสมน้ำครึ่งแก้ว</span>
                  </li>
                  <li className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    🥤 <span><b>น้ำอัดลมสูตรปกติ</b> (ไม่ใช่ Diet/Zero) ครึ่งกระป๋อง (150 มล.)</span>
                  </li>
                </ul>
                <p className="text-xs text-amber-300/80 mt-3 italic">
                  * หลีกเลี่ยงช็อกโกแลตหรือไอศกรีม เนื่องจากมีไขมันสูงทำให้การดูดซึมน้ำตาลช้า
                </p>
              </div>

              <button
                onClick={startFifteenMinuteTimer}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-98"
              >
                <span>ทานเรียบร้อยแล้ว — เริ่มจับเวลา 15 นาที</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2: 15-Minute Countdown */}
          {step === 2 && (
            <div className="space-y-5 text-center">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
                <p className="text-sm text-slate-400 mb-2">เวลานับถอยหลังพักรอให้น้ำตาลซึมเข้าสู่กระแสเลือด</p>
                <div className="text-5xl font-mono font-bold text-amber-400 tracking-wider py-2">
                  {formatTime(timerSeconds)}
                </div>
                <div className="flex justify-center gap-3 mt-4">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-2 font-medium"
                  >
                    <Play className="w-4 h-4" /> {isTimerRunning ? 'หยุดชั่วคราว' : 'เริ่มจับเวลาต่อ'}
                  </button>
                  <button
                    onClick={() => { setTimerSeconds(15 * 60); setIsTimerRunning(true); }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm flex items-center gap-2 font-medium"
                  >
                    <RotateCcw className="w-4 h-4" /> เริ่มใหม่
                  </button>
                </div>
              </div>

              <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl text-left text-xs text-amber-200 space-y-1">
                <p className="font-semibold">ข้อควรปฏิบัติระหว่างรอ:</p>
                <p>• นั่งพักในที่ปลอดภัย อย่าเพิ่งเดินหรือขับขี่ยานพาหนะ</p>
                <p>• หากรู้สึกหน้ามืด หมดสติ หรือแย่ลง ให้ติดต่อผู้ช่วยเหลือทันที</p>
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <span>ครบ 15 นาทีแล้ว — ไปขั้นตอนเจาะตรวจซ้ำ</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 3: Re-check & Action */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4">
                <h4 className="text-white font-semibold text-sm mb-3">เจาะตรวจค่าน้ำตาลซ้ำ (Re-check):</h4>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={recheckVal}
                    onChange={(e) => setRecheckVal(e.target.value)}
                    placeholder="เช่น 85"
                    className="flex-1 bg-slate-950 border border-slate-600 rounded-xl px-4 py-2.5 text-xl font-bold text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-slate-400 font-medium">mg/dL</span>
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl text-xs space-y-2 border border-slate-700">
                <p className="text-emerald-400 font-semibold">• หากได้ &gt;= 70 mg/dL:</p>
                <p className="text-slate-300 pl-3">ปลอดภัยแล้ว หากมื้ออาหารหลักยังอีกนานกว่า 1 ชม. ให้ทานอาหารว่างเบาๆ เช่น นมจืดหรือขนมปัง 1 แผ่น</p>
                
                <p className="text-rose-400 font-semibold">• หากยัง &lt; 70 mg/dL:</p>
                <p className="text-slate-300 pl-3">ให้ทานคาร์โบไฮเดรตเร็ว 15g อีกครั้ง แล้วจับเวลา 15 นาทีตรวจซ้ำ หากยังไม่ดีขึ้นให้ติดต่อแพทย์ทันที</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm border border-slate-700"
                >
                  ทำซ้ำรอบที่ 2
                </button>
                <button
                  onClick={handleFinishRecheck}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-900/30"
                >
                  บันทึกผลและปิดหน้าต่าง
                </button>
              </div>
            </div>
          )}

          {/* Emergency Contact Bar */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-400">ผู้ติดต่อฉุกเฉิน: </span>
              <span className="text-white font-semibold">{emergencyContactName}</span>
            </div>
            <a
              href={`tel:${emergencyContactPhone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>โทร {emergencyContactPhone}</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
