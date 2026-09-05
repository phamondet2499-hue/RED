import React from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenModal: () => void;
  variant?: 'header' | 'full' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  onOpenModal,
  variant = 'header' 
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        onOpenModal();
      }
    } else {
      onOpenModal();
    }
  };

  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl">
          <Check className="w-4 h-4" />
          <span>ติดตั้งเป็นแอปเรียบร้อยแล้ว</span>
        </div>
      );
    }
    return null;
  }

  if (variant === 'header') {
    return (
      <button
        onClick={handleClick}
        title="วิธีดาวน์โหลดและติดตั้งเป็นแอป"
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/40 border border-emerald-400/30 transition-all transform active:scale-95 whitespace-nowrap"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">ติดตั้งเป็นแอป</span>
        <span className="sm:hidden">แอป</span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl transition"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span>ดาวน์โหลดแอป</span>
      </button>
    );
  }

  // variant === 'full'
  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 border border-emerald-400/30 transition-all transform active:scale-95"
    >
      <Smartphone className="w-4 h-4" />
      <span>วิธีดาวน์โหลด & ติดตั้งเป็นแอปบนมือถือ</span>
    </button>
  );
};
