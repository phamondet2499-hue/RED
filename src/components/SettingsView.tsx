import { useState, type FormEvent, type ChangeEvent } from 'react';
import { 
  Settings, 
  User, 
  Target, 
  Phone, 
  Bell, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  Volume2,
  Trash2,
  Plus,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Share2
} from 'lucide-react';
import { UserProfile, ReminderAlarm, AppData } from '../types';
import { soundFx } from '../utils/sound';
import { PWAInstallButton } from './PWAInstallButton';
import { exportHealthDataToCSV, exportOfflineHTMLReport } from '../utils/exportFiles';

interface SettingsViewProps {
  profile: UserProfile;
  alarms: ReminderAlarm[];
  onSaveProfile: (profile: UserProfile) => void;
  onSaveAlarms: (alarms: ReminderAlarm[]) => void;
  onResetData: () => void;
  fullData: AppData;
  onImportData: (data: AppData) => void;
  onOpenInstallModal?: () => void;
  onOpenShareModal?: () => void;
}

export function SettingsView({
  profile,
  alarms,
  onSaveProfile,
  onSaveAlarms,
  onResetData,
  fullData,
  onImportData,
  onOpenInstallModal,
  onOpenShareModal,
}: SettingsViewProps) {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [alarmList, setAlarmList] = useState<ReminderAlarm[]>([...alarms]);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // New Alarm Modal Form
  const [newAlarmTime, setNewAlarmTime] = useState('12:00');
  const [newAlarmTitle, setNewAlarmTitle] = useState('');
  const [newAlarmType, setNewAlarmType] = useState<'medication' | 'insulin' | 'glucose' | 'water'>('medication');

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    soundFx.playSuccessTone();
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleToggleAlarm = (id: string) => {
    const updated = alarmList.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setAlarmList(updated);
    onSaveAlarms(updated);
  };

  const handleDeleteAlarm = (id: string) => {
    const updated = alarmList.filter(a => a.id !== id);
    setAlarmList(updated);
    onSaveAlarms(updated);
  };

  const handleAddAlarm = () => {
    if (!newAlarmTitle.trim()) return;

    const newAlarm: ReminderAlarm = {
      id: `alm_${Date.now()}`,
      title: newAlarmTitle.trim(),
      time: newAlarmTime,
      type: newAlarmType,
      enabled: true,
      sound: true,
      days: [0, 1, 2, 3, 4, 5, 6],
    };

    const updated = [...alarmList, newAlarm];
    setAlarmList(updated);
    onSaveAlarms(updated);
    soundFx.playSuccessTone();
    setNewAlarmTitle('');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diabetes_care_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.profile && parsed.glucoseLogs) {
          onImportData(parsed);
          alert('นำเข้าข้อมูลสำเร็จแล้ว!');
        } else {
          alert('ไฟล์ข้อมูลไม่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" />
            การตั้งค่า & ข้อมูลส่วนตัว
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            ปรับแต่งเป้าหมายสุขภาพ ข้อมูลการรักษา และจัดการระบบการแจ้งเตือน
          </p>
        </div>

        {isSavedNotice && (
          <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4" /> บันทึกการเปลี่ยนแปลงเรียบร้อย
          </div>
        )}
      </div>

      {/* Patient Profile Form */}
      <form onSubmit={handleProfileSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <User className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">ข้อมูลผู้ป่วยและการวินิจฉัย</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ชื่อ-นามสกุล *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">อายุ (ปี)</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ประเภทเบาหวาน</label>
            <select
              value={formData.diabetesType}
              onChange={(e) => setFormData({ ...formData, diabetesType: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="type1">เบาหวานชนิดที่ 1 (Type 1)</option>
              <option value="type2">เบาหวานชนิดที่ 2 (Type 2)</option>
              <option value="gdm">เบาหวานขณะตั้งครรภ์ (GDM)</option>
              <option value="prediabetes">กลุ่มเสี่ยงก่อนเบาหวาน (Prediabetes)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ปีที่เริ่มได้รับการวินิจฉัย</label>
            <input
              type="number"
              value={formData.yearDiagnosed}
              onChange={(e) => setFormData({ ...formData, yearDiagnosed: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">แพทย์ประจำตัว</label>
            <input
              type="text"
              value={formData.doctorName}
              onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">โรงพยาบาล</label>
            <input
              type="text"
              value={formData.hospitalName}
              onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Clinical Targets */}
        <div className="flex items-center gap-2 border-t border-slate-800 pt-5">
          <Target className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg font-bold text-white">เป้าหมายทางคลินิก (Clinical Targets)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Fasting ต่ำสุด (mg/dL)</label>
            <input
              type="number"
              value={formData.targetFastingMin}
              onChange={(e) => setFormData({ ...formData, targetFastingMin: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Fasting สูงสุด (mg/dL)</label>
            <input
              type="number"
              value={formData.targetFastingMax}
              onChange={(e) => setFormData({ ...formData, targetFastingMax: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">เป้าหมาย HbA1c (%)</label>
            <input
              type="number"
              step="0.1"
              value={formData.targetHbA1c}
              onChange={(e) => setFormData({ ...formData, targetHbA1c: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-teal-400 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">เป้าหมายดื่มน้ำ (ml/วัน)</label>
            <input
              type="number"
              value={formData.waterDailyTargetMl}
              onChange={(e) => setFormData({ ...formData, waterDailyTargetMl: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-cyan-400 font-mono font-bold"
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="flex items-center gap-2 border-t border-slate-800 pt-5">
          <Phone className="w-5 h-5 text-rose-400" />
          <h3 className="text-lg font-bold text-white">เบอร์ติดต่อฉุกเฉิน (Emergency Contact)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ชื่อผู้ติดต่อฉุกเฉิน</label>
            <input
              type="text"
              value={formData.emergencyContactName}
              onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">เบอร์โทรศัพท์ฉุกเฉิน</label>
            <input
              type="text"
              value={formData.emergencyContactPhone}
              onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
          >
            บันทึกการตั้งค่า
          </button>
        </div>

      </form>

      {/* Alarms & Reminders Manager */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">ระบบแจ้งเตือนยา & กิจกรรม (Alarms)</h3>
          </div>
          <button
            onClick={() => soundFx.playMedicationChime()}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5" /> ทดสอบเสียงเตือน
          </button>
        </div>

        <div className="space-y-3">
          {alarmList.map((alarm) => (
            <div key={alarm.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{alarm.title}</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-xs font-bold rounded-md">
                    {alarm.time} น.
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  ประเภท: {alarm.type === 'insulin' ? 'ฉีดอินซูลิน' : alarm.type === 'medication' ? 'ทานยา' : alarm.type === 'glucose' ? 'เจาะตรวจน้ำตาล' : 'ดื่มน้ำ'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleAlarm(alarm.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    alarm.enabled 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {alarm.enabled ? 'เปิดใช้งาน' : 'ปิด'}
                </button>
                <button
                  onClick={() => handleDeleteAlarm(alarm.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Alarm Box */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="time"
            value={newAlarmTime}
            onChange={(e) => setNewAlarmTime(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
          />
          <input
            type="text"
            value={newAlarmTitle}
            onChange={(e) => setNewAlarmTitle(e.target.value)}
            placeholder="ข้อความแจ้งเตือน เช่น ทานยามื้อเย็น"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white w-full"
          />
          <select
            value={newAlarmType}
            onChange={(e) => setNewAlarmType(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="medication">ทานยา</option>
            <option value="insulin">ฉีดอินซูลิน</option>
            <option value="glucose">เจาะน้ำตาล</option>
            <option value="water">ดื่มน้ำ</option>
          </select>
          <button
            onClick={handleAddAlarm}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md whitespace-nowrap"
          >
            <Plus className="w-4 h-4 inline mr-1" /> เพิ่มการเตือน
          </button>
        </div>
      </div>

      {/* PWA App Download & Installation Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ดาวน์โหลดและติดตั้งเป็นแอป (PWA App Installation)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ติดตั้งแอปลงบนหน้าจอมือถือ (Android, iOS) หรือคอมพิวเตอร์ เพื่อใช้งานแบบเต็มหน้าจอและเร็วขึ้น
              </p>
            </div>
          </div>

          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 self-start sm:self-auto"
            >
              <Download className="w-4 h-4" /> ดูวิธีติดตั้งบนอุปกรณ์ของคุณ
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1.5">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> มือถือ Android
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              เปิดใน Chrome &gt; แตะจุดสามจุด (⋮) ด้านบน &gt; เลือก <b>"ติดตั้งแอป"</b> หรือ <b>"เพิ่มลงในหน้าจอหลัก"</b>
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1.5">
            <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> iPhone / iPad (iOS)
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              เปิดใน Safari &gt; แตะปุ่ม <b>แชร์ (Share ไอคอนลูกศรชี้ขึ้น)</b> &gt; เลือก <b>"เพิ่มไปยังหน้าจอโฮม"</b>
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1.5">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> ทำงานได้แม้ออฟไลน์
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              บันทึกค่าน้ำตาล เปิดตารางยา และดูคำแนะนำฉุกเฉินได้ต่อเนื่อง แม้อยู่ในพื้นที่ไม่มีสัญญาณอินเทอร์เน็ต
            </p>
          </div>
        </div>
      </div>

      {/* Data Backup & Export Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white">ดาวน์โหลดไฟล์ข้อมูล & สำรองระบบ (Export & Backup)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ส่งออกข้อมูลค่าน้ำตาลเพื่อเปิดในโปรแกรม Excel หรือส่งรายงานให้คนในครอบครัวและแพทย์
            </p>
          </div>

          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Share2 className="w-4 h-4" /> หน้าต่างแชร์และส่งออกไฟล์
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={() => exportHealthDataToCSV(fullData, 90)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> ดาวน์โหลดตาราง Excel (.csv)
          </button>

          <button
            onClick={() => exportOfflineHTMLReport(fullData, 30)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition active:scale-95"
          >
            <FileText className="w-4 h-4 text-cyan-400" /> ดาวน์โหลดสรุปรายงานเดี่ยว (.html)
          </button>

          <button
            onClick={handleExportJSON}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition active:scale-95"
          >
            <Download className="w-4 h-4 text-purple-400" /> สำรองข้อมูลทั้งระบบ (.json)
          </button>

          <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 cursor-pointer transition active:scale-95">
            <Upload className="w-4 h-4 text-amber-400" /> นำเข้าข้อมูลสำรอง (.json)
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่างหรือไม่?')) {
                onResetData();
              }
            }}
            className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2 border border-rose-800/60 ml-auto transition"
          >
            <RotateCcw className="w-4 h-4" /> รีเซ็ตเป็นข้อมูลตัวอย่าง
          </button>
        </div>
      </div>

    </div>
  );
}
