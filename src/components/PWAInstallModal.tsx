import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  X, 
  Share2, 
  PlusSquare, 
  MoreVertical, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, install } = usePWAInstall();
  
  // Default tab based on current device
  const defaultDevice = isIOS ? 'ios' : isAndroid ? 'android' : isDesktop ? 'desktop' : 'android';
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>(defaultDevice);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    const success = await install();
    setIsInstalling(false);
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-slate-900 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400/20">
              🩺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">วิธีดาวน์โหลด & ติดตั้งเป็นแอป</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ติดตั้งลงบนหน้าจอมือถือหรือคอมพิวเตอร์ ใช้งานได้สะดวกรวดเร็วไม่ต้องผ่าน Store
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          
          {/* Quick Direct Install Callout (If browser supports native prompt) */}
          {isInstallable && !isInstalled && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5 font-bold" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-300 text-sm">เบราว์เซอร์ของคุณพร้อมติดตั้งทันที</h4>
                  <p className="text-xs text-slate-300 mt-0.5">กดปุ่มเพื่อเพิ่มแอปลงหน้าจอหลักได้ใน 1 วินาที</p>
                </div>
              </div>

              <button
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition whitespace-nowrap active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isInstalling ? 'กำลังติดตั้ง...' : 'กดติดตั้งแอปทันที'}
              </button>
            </div>
          )}

          {installSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center gap-2.5 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ติดตั้งเรียบร้อยแล้ว! ไอคอนแอป "เบาหวานแคร์" จะปรากฏบนหน้าจอหลักของคุณ</span>
            </div>
          )}

          {isInstalled && (
            <div className="p-3 bg-teal-950/60 border border-teal-500/40 rounded-2xl flex items-center gap-2.5 text-teal-300 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>ขณะนี้แอปพลิเคชันกำลังทำงานในโหมดแอปเดี่ยว (Standalone PWA) เรียบร้อยแล้ว</span>
            </div>
          )}

          {/* Platform Switcher Tabs */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">เลือกอุปกรณ์ที่คุณใช้งาน:</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('android')}
                className={`py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'android'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android</span>
              </button>

              <button
                onClick={() => setActiveTab('ios')}
                className={`py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'ios'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>iPhone / iPad</span>
              </button>

              <button
                onClick={() => setActiveTab('desktop')}
                className={`py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'desktop'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>คอมพิวเตอร์</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Android Instructions */}
          {activeTab === 'android' && (
            <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
                สำหรับมือถือ Android (Google Chrome หรือ Samsung Internet)
              </h4>
              
              <ol className="space-y-3 text-xs sm:text-sm text-slate-300 ml-1">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono shrink-0 mt-0.5">1</span>
                  <div>
                    เปิดลิงก์แอปพลิเคชันด้วยเบราว์เซอร์ <b>Google Chrome</b> หรือ <b>Samsung Internet</b>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono shrink-0 mt-0.5">2</span>
                  <div>
                    แตะที่ <b>ปุ่มจุดสามจุด (⋮)</b> ตรงมุมขวาบนของหน้าจอเบราว์เซอร์
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono shrink-0 mt-0.5">3</span>
                  <div>
                    เลือกเมนู <b>"ติดตั้งแอป" (Install app)</b> หรือ <b>"เพิ่มลงในหน้าจอหลัก" (Add to Home screen)</b>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono shrink-0 mt-0.5">4</span>
                  <div>
                    กดยืนยัน <b>"ติดตั้ง"</b> ไอคอน <b>🩺 เบาหวานแคร์</b> จะไปอยู่ที่หน้าจอมือถือของคุณ เปิดใช้งานได้เหมือนแอปทั่วไปแบบเต็มจอ!
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Tab 2: iOS / Safari Instructions */}
          {activeTab === 'ios' && (
            <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
                สำหรับ iPhone หรือ iPad (Safari)
              </h4>

              <ol className="space-y-3 text-xs sm:text-sm text-slate-300 ml-1">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono shrink-0 mt-0.5">1</span>
                  <div>
                    เปิดลิงก์แอปด้วยเบราว์เซอร์ <b>Safari</b> บนเครื่อง iPhone หรือ iPad
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono shrink-0 mt-0.5">2</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>แตะที่ปุ่ม <b>"แชร์" (Share)</b></span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-blue-400 font-mono text-xs">
                      <Share2 className="w-3.5 h-3.5" /> ไอคอนกล่องสี่เหลี่ยมลูกศรชี้ขึ้น
                    </span>
                    <span>ที่แถบเครื่องมือด้านล่าง</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono shrink-0 mt-0.5">3</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>เลื่อนเมนูลงมาแล้วแตะที่</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 font-bold text-xs">
                      <PlusSquare className="w-3.5 h-3.5" /> "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono shrink-0 mt-0.5">4</span>
                  <div>
                    แตะ <b>"เพิ่ม" (Add)</b> ที่มุมขวาบน ไอคอนแอปจะไปปรากฏบนหน้าจอโฮมของ iPhone ทันที ใช้งานได้ลื่นไหลเต็มจอ
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Tab 3: Desktop Instructions */}
          {activeTab === 'desktop' && (
            <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">3</span>
                สำหรับเครื่องคอมพิวเตอร์ PC / Mac (Google Chrome หรือ Microsoft Edge)
              </h4>

              <ol className="space-y-3 text-xs sm:text-sm text-slate-300 ml-1">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono shrink-0 mt-0.5">1</span>
                  <div>
                    เปิดหน้าเว็บด้วย <b>Google Chrome</b> หรือ <b>Microsoft Edge</b>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono shrink-0 mt-0.5">2</span>
                  <div>
                    สังเกตที่แถบที่อยู่ด้านบน (Address Bar ขวาสุด) จะมี <b>ไอคอนรูปคอมพิวเตอร์พร้อมลูกศรชี้ลง</b> หรือข้อความ <b>"ติดตั้งแอป" (Install)</b>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono shrink-0 mt-0.5">3</span>
                  <div>
                    คลิกไอคอนแล้วกดยืนยัน <b>"ติดตั้ง"</b> ตัวแอปจะแยกเป็นหน้าต่างโปรแกรมอิสระบนเดสก์ท็อป พร้อมใช้งานได้สะดวกสบาย
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Advantages of PWA */}
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 space-y-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ข้อดีเมื่อติดตั้งเป็นแอป (PWA Benefits)
            </h5>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>เปิดใช้งานได้รวดเร็วเพียงแตะครั้งเดียว</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>แสดงผลเต็มหน้าจอ ไม่มีแถบเบราว์เซอร์กวนใจ</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>เปิดดูข้อมูลค่าน้ำตาลและตารางยาได้แม้ไม่มีเน็ต</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ข้อมูลบันทึกเก็บในเครื่องของคุณอย่างปลอดภัย</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            เบาหวาน แคร์พลัส • PWA Version 1.0
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
          >
            เข้าใจแล้ว / ปิดหน้านี้
          </button>
        </div>

      </div>
    </div>
  );
};
