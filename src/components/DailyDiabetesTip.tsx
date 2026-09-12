import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  BookOpen, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { DIABETES_TIPS, DIABETES_TIPS_CATEGORIES, getDailyDiabetesTip, DiabetesTip } from '../data/diabetesTips';
import { AppData } from '../types';
import { exportOfflineDiabetesCompanionHTML } from '../utils/exportFiles';

interface DailyDiabetesTipProps {
  data: AppData;
  onOpenShareModal?: () => void;
}

export function DailyDiabetesTip({ data, onOpenShareModal }: DailyDiabetesTipProps) {
  const [currentTip, setCurrentTip] = useState<DiabetesTip>(() => getDailyDiabetesTip());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Filtered tips based on category
  const filteredTips = selectedCategory === 'all' 
    ? DIABETES_TIPS 
    : DIABETES_TIPS.filter(t => t.category === selectedCategory);

  const currentIndex = filteredTips.findIndex(t => t.id === currentTip.id);

  // Switch category
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    if (isSpeaking) stopSpeech();
    const list = catId === 'all' ? DIABETES_TIPS : DIABETES_TIPS.filter(t => t.category === catId);
    if (list.length > 0) {
      setCurrentTip(list[0]);
    }
  };

  // Next Tip
  const handleNext = () => {
    if (isSpeaking) stopSpeech();
    const nextIdx = (currentIndex + 1) % filteredTips.length;
    setCurrentTip(filteredTips[nextIdx]);
  };

  // Previous Tip
  const handlePrev = () => {
    if (isSpeaking) stopSpeech();
    const prevIdx = (currentIndex - 1 + filteredTips.length) % filteredTips.length;
    setCurrentTip(filteredTips[prevIdx]);
  };

  // Random Tip
  const handleRandom = () => {
    if (isSpeaking) stopSpeech();
    let randIdx = Math.floor(Math.random() * filteredTips.length);
    if (filteredTips.length > 1 && filteredTips[randIdx].id === currentTip.id) {
      randIdx = (randIdx + 1) % filteredTips.length;
    }
    setCurrentTip(filteredTips[randIdx]);
  };

  // Copy Tip text
  const handleCopy = async () => {
    const textToCopy = `💡 เคล็ดลับดูแลเบาหวาน: ${currentTip.title}\nหมวด: ${currentTip.categoryLabel}\n\n${currentTip.summary}\n\n👉 คำแนะนำปฏิบัติจริง: ${currentTip.practicalAdvice}\n⭐ ข้อควรจำ: ${currentTip.keyTakeaway}\n(อ้างอิง: ${currentTip.evidenceSource})`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Text to Speech in Thai
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('อุปกรณ์ของคุณไม่รองรับระบบอ่านออกเสียง');
      return;
    }

    if (isSpeaking) {
      stopSpeech();
    } else {
      window.speechSynthesis.cancel();
      const textToSpeak = `${currentTip.title}. ${currentTip.summary}. คำแนะนำที่ทำได้จริง. ${currentTip.practicalAdvice}. ข้อควรจำ: ${currentTip.keyTakeaway}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'th-TH';
      utterance.rate = 0.95; // Slightly slower for elderly listeners

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Download Offline HTML file
  const handleDownloadOfflineHTML = () => {
    exportOfflineDiabetesCompanionHTML(data);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-teal-800/40 hover:border-teal-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl transition-all relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section with badge & controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-teal-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-sm">
            <Lightbulb className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                เคล็ดลับเบาหวานประจำวัน
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> อิงหลักการแพทย์
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              ข้อแนะนำดูแลตนเองที่ทำได้จริง ประหยัด ปลอดภัย และเห็นผล
            </p>
          </div>
        </div>

        {/* Action Buttons: Audio, Copy, Prev/Next */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {/* Audio Read-Aloud for Elderly */}
          <button
            onClick={handleToggleSpeech}
            title={isSpeaking ? 'หยุดอ่านเสียง' : 'ฟังเสียงอ่านคำแนะนำ (สำหรับผู้สูงอายุ)'}
            className={`p-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
              isSpeaking 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse' 
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-teal-300'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
            <span className="hidden sm:inline text-xs">{isSpeaking ? 'หยุดฟัง' : 'ฟังเสียงอ่าน'}</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            title="คัดลอกข้อความส่งต่อใน LINE ให้คนในครอบครัว"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Random */}
          <button
            onClick={handleRandom}
            title="สุ่มอ่านข้อถัดไป"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-300 text-xs font-medium transition active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Prev / Next */}
          <div className="flex items-center border border-slate-700 rounded-xl overflow-hidden bg-slate-800">
            <button
              onClick={handlePrev}
              title="ข้อก่อนหน้า"
              className="p-1.5 px-2 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 px-1.5">
              {currentIndex + 1}/{filteredTips.length}
            </span>
            <button
              onClick={handleNext}
              title="ข้อถัดไป"
              className="p-1.5 px-2 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5 border-b border-slate-800/60 text-xs">
        {DIABETES_TIPS_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 text-xs ${
              selectedCategory === cat.id
                ? 'bg-teal-600 text-white font-semibold shadow-sm shadow-teal-900/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Main Tip Body */}
      <div className="pt-3.5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/25">
                {currentTip.categoryLabel}
              </span>
              {currentTip.isBudgetFriendly && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/25">
                  💰 ประหยัดค่าใช้จ่าย
                </span>
              )}
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
              {currentTip.title}
            </h4>
          </div>
        </div>

        {/* Summary text */}
        <p className="text-sm text-slate-300 leading-relaxed">
          {currentTip.summary}
        </p>

        {/* Practical Action Box */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 sm:p-3.5 space-y-1.5">
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> คำแนะนำปฏิบัติจริงในชีวิตประจำวัน:
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {currentTip.practicalAdvice}
          </p>
          <div className="text-[11px] text-amber-300/90 font-medium pt-1 border-t border-slate-700/40">
            ⭐ <b>ข้อควรจำ:</b> {currentTip.keyTakeaway}
          </div>
        </div>

        {/* Footer info: Source and Download Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1 text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="truncate">แหล่งอ้างอิง: {currentTip.evidenceSource}</span>
          </div>

          {/* Quick Offline HTML Download Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadOfflineHTML}
              title="ดาวน์โหลดสมุดคู่มือและระบบบันทึกเบาหวาน (.html) พกพาเปิดบนมือถือได้ทุกรุ่นโดยไม่ต้องใช้อินเทอร์เน็ต"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>ดาวน์โหลดสำเร็จ!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-teal-200" />
                  <span>โหลดไฟล์คู่มือ HTML (เปิดออฟไลน์ฟรีทุกหมวด)</span>
                </>
              )}
            </button>

            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                title="ส่งต่อหรือแชร์ให้คนอื่น"
                className="p-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition text-xs flex items-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">แชร์</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
