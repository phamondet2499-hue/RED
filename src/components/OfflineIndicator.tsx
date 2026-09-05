import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-600/90 backdrop-blur-md border border-amber-400/40 px-3.5 py-2 text-xs font-medium text-white shadow-2xl animate-bounce">
      <WifiOff className="w-4 h-4 text-white shrink-0" />
      <span>โหมดออฟไลน์ — ข้อมูลถูกบันทึกลงในเครื่อง และพร้อมใช้งานแม้ไม่มีอินเทอร์เน็ต</span>
    </div>
  );
};
