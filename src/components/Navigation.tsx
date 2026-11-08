import type { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  Activity, 
  Pill, 
  TrendingUp,
  Utensils, 
  Calendar, 
  HeartHandshake, 
  FileText, 
  Settings 
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'glucose'
  | 'medication'
  | 'insights'
  | 'food'
  | 'appointments'
  | 'selfcare'
  | 'doctor'
  | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingMedsCount: number;
}

export function Navigation({ currentTab, onTabChange, pendingMedsCount }: NavigationProps) {
  const tabs: { id: NavTab; label: string; icon: LucideIcon; badge?: number }[] = [
    { id: 'dashboard', label: 'ภาพรวมสุขภาพ', icon: LayoutDashboard },
    { id: 'glucose', label: 'ระดับน้ำตาล', icon: Activity },
    { id: 'medication', label: 'ยา & อินซูลิน', icon: Pill, badge: pendingMedsCount > 0 ? pendingMedsCount : undefined },
    { id: 'insights', label: 'วิเคราะห์แนวโน้ม & ยา (Insights)', icon: TrendingUp },
    { id: 'food', label: 'อาหาร & คาร์บ', icon: Utensils },
    { id: 'appointments', label: 'นัดพบแพทย์', icon: Calendar },
    { id: 'selfcare', label: 'ดูแลตัวเอง & เท้า', icon: HeartHandshake },
    { id: 'doctor', label: 'รายงานแพทย์ / PDF', icon: FileText },
    { id: 'settings', label: 'ตั้งค่า & ข้อมูล', icon: Settings },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-4">
      <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all relative ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
