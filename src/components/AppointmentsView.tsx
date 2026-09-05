import { useState, type FormEvent } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Check, 
  ChevronRight 
} from 'lucide-react';
import { DoctorAppointment } from '../types';
import { soundFx } from '../utils/sound';

interface AppointmentsViewProps {
  appointments: DoctorAppointment[];
  onAddAppointment: (appt: Omit<DoctorAppointment, 'id'>) => void;
  onDeleteAppointment: (id: string) => void;
  onUpdateStatus: (id: string, status: 'upcoming' | 'completed' | 'cancelled', feedback?: string) => void;
}

export function AppointmentsView({
  appointments,
  onAddAppointment,
  onDeleteAppointment,
  onUpdateStatus,
}: AppointmentsViewProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [isAdding, setIsAdding] = useState(false);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  // Form State
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [doctorName, setDoctorName] = useState('');
  const [hospital, setHospital] = useState('โรงพยาบาลจุฬาลงกรณ์');
  const [department, setDepartment] = useState('คลินิกเบาหวานและต่อมไร้ท่อ');
  const [reason, setReason] = useState('ติดตามผลเลือดและค่าน้ำตาลสะสม HbA1c ประจำ 3 เดือน');
  const [prepNotes, setPrepNotes] = useState('งดน้ำและอาหารหลัง 22:00 น. ก่อนวันตรวจ, นำยาเดิมและสมุดบันทึกมาด้วย');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!date || !doctorName.trim()) return;

    const notesList = prepNotes
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);

    onAddAppointment({
      date,
      time,
      doctorName: doctorName.trim(),
      hospital: hospital.trim(),
      department: department.trim(),
      reason: reason.trim(),
      preparationNotes: notesList.length > 0 ? notesList : ['งดน้ำและอาหารก่อนตรวจ 8-10 ชม.'],
      status: 'upcoming',
    });

    soundFx.playSuccessTone();
    setDate('');
    setDoctorName('');
    setIsAdding(false);
  };

  const upcomingList = appointments
    .filter(a => a.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date));

  const completedList = appointments
    .filter(a => a.status !== 'upcoming')
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleSaveFeedback = (id: string) => {
    onUpdateStatus(id, 'completed', feedbackText);
    setEditingFeedbackId(null);
    setFeedbackText('');
    soundFx.playSuccessTone();
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-400" />
            ระบบนัดหมายพบแพทย์ (Doctor Appointments)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            บันทึกวันนัด ตรวจสอบสิ่งที่ต้องเตรียมตัวก่อนพบแพทย์ และบันทึกคำแนะนำหลังพบหมอ
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-950/40 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>+ สร้างการนัดหมายใหม่</span>
        </button>
      </div>

      {/* Add Appointment Modal / Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border-2 border-teal-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-teal-400" />
              ลงบันทึกนัดหมายแพทย์
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
            >
              ปิด
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">วันที่นัดหมาย *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">เวลานัดหมาย *</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">ชื่อแพทย์ผู้ตรวจ *</label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="เช่น นพ. วรพงษ์ เกียรติวิทยา"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">โรงพยาบาล / คลินิก</label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">แผนก / อาคาร</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น คลินิกเบาหวาน ตึก ภปร ชั้น 5"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">จุดประสงค์การนัด</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              สิ่งที่ต้องเตรียมตัวก่อนตรวจ (คั่นด้วยเครื่องหมายจุลภาค ,)
            </label>
            <input
              type="text"
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              placeholder="เช่น งดน้ำงดอาหารหลัง 4 ทุ่ม, นำยาและอินซูลินเดิมมาด้วย, มีตรวจตาควรพาญาติมาด้วย"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold rounded-xl shadow-lg"
            >
              บันทึกการนัด
            </button>
          </div>
        </form>
      )}

      {/* Upcoming Appointments Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-400" />
          รายการนัดหมายที่กำลังจะมาถึง ({upcomingList.length})
        </h3>

        {upcomingList.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingList.map((appt) => {
              const apptDate = new Date(appt.date);
              const daysLeft = Math.ceil((apptDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

              return (
                <div key={appt.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-6 space-y-4 shadow-md flex flex-col justify-between">
                  <div className="space-y-3">
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold rounded-full font-mono">
                          {appt.date}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">เวลา {appt.time} น.</span>
                      </div>

                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                        {daysLeft <= 0 ? 'วันนี้' : `อีก ${daysLeft} วัน`}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-white">{appt.doctorName}</h4>
                      <p className="text-xs text-teal-300 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" /> {appt.hospital} • {appt.department}
                      </p>
                    </div>

                    <div className="text-xs text-slate-300">
                      <span className="text-slate-500">เหตุผล: </span>{appt.reason}
                    </div>

                    {appt.preparationNotes && appt.preparationNotes.length > 0 && (
                      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> สิ่งที่ต้องเตรียมตัวก่อนตรวจ:
                        </div>
                        <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc">
                          {appt.preparationNotes.map((note, i) => (
                            <li key={i}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setEditingFeedbackId(appt.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> พบแพทย์เรียบร้อยแล้ว
                    </button>

                    <button
                      onClick={() => onDeleteAppointment(appt.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                      title="ยกเลิกนัด"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Complete & Feedback Inline Form */}
                  {editingFeedbackId === appt.id && (
                    <div className="mt-3 p-4 bg-slate-950 border border-emerald-500/50 rounded-2xl space-y-3 animate-fade-in">
                      <h5 className="text-xs font-bold text-emerald-400">บันทึกผลการตรวจและคำแนะนำของคุณหมอ:</h5>
                      <textarea
                        rows={3}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="เช่น หมอปรับลดยา Glimepiride เหลือครึ่งเม็ด, ผล HbA1c อยู่ที่ 6.8% ให้คุมอาหารต่อเนื่อง..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingFeedbackId(null)}
                          className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={() => handleSaveFeedback(appt.id)}
                          className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                        >
                          บันทึกประวัติ
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-500 text-sm">
            ไม่มีนัดหมายแพทย์ที่กำลังจะมาถึง กดปุ่ม <b>"+ สร้างการนัดหมายใหม่"</b> เพื่อเพิ่มบันทึก
          </div>
        )}
      </div>

      {/* Completed Past Appointments */}
      {completedList.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ประวัติการพบแพทย์ที่ผ่านมา
          </h3>

          <div className="divide-y divide-slate-800">
            {completedList.map((c) => (
              <div key={c.id} className="py-3.5 space-y-1.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white text-sm">{c.doctorName}</span>
                    <span className="text-xs text-slate-400 ml-2">({c.hospital})</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{c.date}</span>
                </div>
                <p className="text-xs text-slate-400">จุดประสงค์: {c.reason}</p>
                {c.doctorFeedback && (
                  <div className="bg-slate-950/60 p-2.5 rounded-xl text-xs text-emerald-300 border border-emerald-950">
                    <b>คำแนะนำ/ผลตรวจ:</b> {c.doctorFeedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
