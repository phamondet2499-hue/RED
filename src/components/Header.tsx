import { AlertTriangle, Bell, Calendar, User, Volume2, ShieldAlert, Share2 } from 'lucide-react';
import { UserProfile, DoctorAppointment } from '../types';
import { soundFx } from '../utils/sound';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  profile: UserProfile;
  nextAppointment?: DoctorAppointment;
  onOpenHypoModal: () => void;
  onOpenAppointments: () => void;
  onOpenSettings: () => void;
  onOpenInstallModal: () => void;
  onOpenShareModal: () => void;
  activeAlarmsCount: number;
}

export function Header({
  profile,
  nextAppointment,
  onOpenHypoModal,
  onOpenAppointments,
  onOpenSettings,
  onOpenInstallModal,
  onOpenShareModal,
  activeAlarmsCount,
}: HeaderProps) {
  const testChime = () => {
    soundFx.playMedicationChime();
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center shadow-md shadow-teal-950/50">
            <span className="text-xl">🩺</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-bold font-sans bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                เบาหวาน แคร์พลัส
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold rounded-full uppercase tracking-wider">
                Diabetes Care+
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {profile.name} • {profile.diabetesType === 'type1' ? 'เบาหวานชนิดที่ 1' : profile.diabetesType === 'type2' ? 'เบาหวานชนิดที่ 2' : 'เบาหวานขณะตั้งครรภ์'}
            </p>
          </div>
        </div>

        {/* Action Controls & Emergency Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Doctor Appointment Reminder */}
          {nextAppointment && (
            <button
              onClick={onOpenAppointments}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 transition-colors group"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>นัดหมอครั้งถัดไป: <b className="text-white">{nextAppointment.date}</b></span>
            </button>
          )}

          {/* Test Sound button */}
          <button
            onClick={testChime}
            title="ทดสอบเสียงเตือน"
            className="p-2 bg-slate-800/70 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-teal-300 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton onOpenModal={onOpenInstallModal} variant="header" />

          {/* Share & Export Button */}
          <button
            onClick={onOpenShareModal}
            title="ดาวน์โหลดไฟล์ & แชร์ให้คนอื่น"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">ดาวน์โหลดไฟล์ / แชร์</span>
            <span className="sm:hidden">แชร์</span>
          </button>

          {/* Hypo Emergency 15-15 Rule Button */}
          <button
            onClick={onOpenHypoModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-rose-950/60 ring-2 ring-rose-500/30 animate-pulse transition-all transform active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden sm:inline">ฉุกเฉินน้ำตาลต่ำ</span>
            <span className="sm:hidden">น้ำตาลต่ำ</span>
            <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded font-mono">15-15</span>
          </button>

          {/* User Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
            title="โปรไฟล์และการตั้งค่า"
          >
            <User className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
}
