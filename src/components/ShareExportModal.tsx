import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  Sparkles, 
  FolderArchive, 
  Smartphone, 
  Globe,
  HelpCircle,
  Database
} from 'lucide-react';
import { AppData } from '../types';
import { 
  exportHealthDataToCSV, 
  exportAppBackupJSON, 
  exportOfflineHTMLReport 
} from '../utils/exportFiles';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  onNavigateToDoctorReport?: () => void;
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  isOpen,
  onClose,
  data,
  onNavigateToDoctorReport,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'shareApp'>('files');
  const [copied, setCopied] = useState(false);
  const [csvDays, setCsvDays] = useState<14 | 30 | 90>(30);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const showFeedback = (msg: string) => {
    setDownloadSuccessMessage(msg);
    setTimeout(() => {
      setDownloadSuccessMessage(null);
    }, 4000);
  };

  // 1. Export CSV
  const handleExportCSV = () => {
    exportHealthDataToCSV(data, csvDays);
    showFeedback(`ดาวน์โหลดไฟล์ Excel/CSV (ย้อนหลัง ${csvDays} วัน) สำเร็จแล้ว!`);
  };

  // 2. Export HTML Standalone Report
  const handleExportHTML = () => {
    exportOfflineHTMLReport(data, csvDays);
    showFeedback('ดาวน์โหลดไฟล์สรุปสุขภาพเดี่ยว (.html) สำเร็จแล้ว! สามารถเปิดดูได้ทุกเครื่องแม้ออฟไลน์');
  };

  // 3. Export JSON
  const handleExportJSON = () => {
    exportAppBackupJSON(data);
    showFeedback('ดาวน์โหลดไฟล์สำรองข้อมูล (.json) สำเร็จแล้ว!');
  };

  // 4. Copy App Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  // 5. Native Mobile Share
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'เบาหวาน แคร์พลัส (Diabetes Care+)',
          text: `แอปพลิเคชันดูแลสุขภาพผู้ป่วยเบาหวาน บันทึกค่าน้ำตาล ตารางยา และรายงานแพทย์: ${data.profile.name}`,
          url: appUrl,
        });
      } catch (err) {
        // User dismissed or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-950/60 via-emerald-950/40 to-slate-900 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400/20">
              📤
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">ดาวน์โหลดไฟล์ & แชร์ให้คนอื่น</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Export & Share
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ดาวน์โหลดรายงานสุขภาพ ข้อมูลบันทึก หรือแชร์ตัวแอปพลิเคชันให้ครอบครัวและแพทย์
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

        {/* Tab Switcher */}
        <div className="px-5 sm:px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-2 px-3 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                activeTab === 'files'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดเป็นไฟล์ (PDF, Excel, HTML)</span>
            </button>

            <button
              onClick={() => setActiveTab('shareApp')}
              className={`py-2 px-3 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                activeTab === 'shareApp'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>แชร์ตัวแอป / โค้ดโปรเจกต์</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {downloadSuccessMessage && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl flex items-center gap-2.5 text-emerald-300 text-xs animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-300">
          
          {/* TAB 1: Download Health Files */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              
              {/* Day range filter */}
              <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
                <span className="text-xs font-medium text-slate-300">เลือกช่วงข้อมูลที่ต้องการส่งออก:</span>
                <div className="flex items-center gap-1">
                  {([14, 30, 90] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setCsvDays(d)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        csvDays === d
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d} วัน
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 1: Excel / CSV */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">ไฟล์ตาราง Excel / CSV (.csv)</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">Excel-Ready</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      ตารางค่าน้ำตาล ความดัน ยา และหมายเหตุ รองรับภาษาไทยสมบูรณ์แบบ เปิดใน Excel, Google Sheets ได้ทันที
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
                >
                  <Download className="w-4 h-4" /> ดาวน์โหลด .csv
                </button>
              </div>

              {/* Option 2: Standalone HTML Report */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">ไฟล์รายงานสรุปผลเดี่ยว (.html)</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">ส่งต่อทาง LINE ได้</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      ไฟล์หน้าเว็บสรุปผลพกพา เปิดดูได้บนมือถือหรือคอมพิวเตอร์ทุกเครื่องแม้ออฟไลน์ พร้อมสถิติ TIR และตารางยา
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportHTML}
                  className="w-full sm:w-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
                >
                  <Download className="w-4 h-4" /> ดาวน์โหลด .html
                </button>
              </div>

              {/* Option 3: Doctor Report PDF / Print */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">พิมพ์รายงานแพทย์ หรือบันทึกเป็น PDF</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      เอกสารมาตรฐานแบบฟอร์มการแพทย์สำหรับยื่นให้แพทย์ตรวจวินิจฉัย ณ โรงพยาบาล
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    if (onNavigateToDoctorReport) {
                      onNavigateToDoctorReport();
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
                >
                  <Printer className="w-4 h-4" /> ไปหน้ารายงานแพทย์
                </button>
              </div>

              {/* Option 4: Full App JSON Backup */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">ไฟล์สำรองข้อมูลทั้งระบบ (.json)</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      บันทึกข้อมูลทั้งหมด (ประวัติน้ำตาล ยา อาหาร การนัดหมาย) เพื่อนำเข้า (Import) ในเครื่องอื่น
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportJSON}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
                >
                  <Download className="w-4 h-4 text-purple-400" /> ดาวน์โหลด .json
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: Share App & Project Code */}
          {activeTab === 'shareApp' && (
            <div className="space-y-4">
              
              {/* Share App Link Callout */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">แชร์ลิงก์แอปพลิเคชัน (Share App Link)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ส่งลิงก์ให้ผู้อื่นเปิดใช้งานแอปได้ทันทีบนมือถือหรือคอมพิวเตอร์
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-2">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="bg-transparent border-none text-xs text-slate-200 font-mono flex-1 outline-none truncate px-1"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition whitespace-nowrap"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
                  </button>
                </div>

                <button
                  onClick={handleNativeShare}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> แชร์ผ่าน LINE, SMS หรือแอปอื่น ๆ ในมือถือ
                </button>
              </div>

              {/* Instructions on Downloading Code / ZIP via AI Studio */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">ต้องการดาวน์โหลดตัวแอปทั้งโปรเจกต์เป็นไฟล์ ZIP?</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      นำโค้ดทั้งหมดไปรันบนคอมพิวเตอร์ส่วนตัว หรือส่งต่อให้นักพัฒนา
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    วิธีดาวน์โหลดไฟล์ ZIP จาก Google AI Studio:
                  </div>
                  <ol className="space-y-1.5 list-decimal list-inside text-slate-300 ml-1">
                    <li>มองไปที่แถบเครื่องมือด้านบนขวาสุดของหน้าต่าง <b>Google AI Studio</b></li>
                    <li>คลิกที่ไอคอน <b>ฟันเฟือง (Settings)</b> หรือเมนูตัวเลือกสามจุด</li>
                    <li>เลือกคำสั่ง <b>"Export to ZIP"</b> เพื่อดาวน์โหลดโฟลเดอร์โปรเจกต์ทั้งหมดเป็นไฟล์ .zip ทันที</li>
                    <li>หรือคลิกปุ่ม <b>"Share"</b> สีน้ำเงินด้านบน เพื่อสร้างลิงก์สำหรับส่งให้คนอื่นเข้าดูและทดลองใช้</li>
                  </ol>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            เบาหวาน แคร์พลัส • ระบบแชร์ & ส่งออกข้อมูล
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
          >
            ปิดหน้านี้
          </button>
        </div>

      </div>
    </div>
  );
};
