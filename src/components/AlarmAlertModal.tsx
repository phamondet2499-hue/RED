import { Bell, Check, Clock, X, Pill, Droplet } from 'lucide-react';
import { ReminderAlarm } from '../types';

interface AlarmAlertModalProps {
  alarm: ReminderAlarm | null;
  onDismiss: () => void;
  onTakeAction: (alarm: ReminderAlarm) => void;
}

export function AlarmAlertModal({ alarm, onDismiss, onTakeAction }: AlarmAlertModalProps) {
  if (!alarm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl shadow-amber-950/60 text-center p-6 space-y-5">
        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-500/10 animate-bounce">
          {alarm.type === 'insulin' ? (
            <Droplet className="w-8 h-8 text-purple-400" />
          ) : alarm.type === 'medication' ? (
            <Pill className="w-8 h-8 text-blue-400" />
          ) : (
            <Bell className="w-8 h-8 text-amber-400" />
          )}
        </div>

        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5" /> ถึงเวลาแจ้งเตือน ({alarm.time} น.)
          </span>
          <h3 className="text-xl font-bold text-white mt-1">{alarm.title}</h3>
          <p className="text-slate-400 text-sm mt-1">กรุณารับประทานยาหรือฉีดอินซูลินตามคำแนะนำของแพทย์เพื่อควบคุมระดับน้ำตาลอย่างต่อเนื่อง</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onDismiss}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm transition-colors border border-slate-700"
          >
            เลื่อนการแจ้งเตือน (10 นาที)
          </button>
          <button
            onClick={() => onTakeAction(alarm)}
            className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" /> บันทึกเรียบร้อย
          </button>
        </div>
      </div>
    </div>
  );
}
