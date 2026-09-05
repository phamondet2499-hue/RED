import { useState, type FormEvent } from 'react';
import { 
  Activity, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Filter, 
  AlertCircle, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { GlucoseRecord, GlucosePeriod } from '../types';
import { calculateGlucoseStats, classifyGlucose, PERIOD_LABELS } from '../utils/diabetesCalc';
import { soundFx } from '../utils/sound';

interface GlucoseViewProps {
  records: GlucoseRecord[];
  onAddRecord: (record: Omit<GlucoseRecord, 'id'>) => void;
  onDeleteRecord: (id: string) => void;
}

export function GlucoseView({ records, onAddRecord, onDeleteRecord }: GlucoseViewProps) {
  const [selectedRange, setSelectedRange] = useState<7 | 14 | 30 | 90>(14);
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [value, setValue] = useState('');
  const [period, setPeriod] = useState<GlucosePeriod>('fasting');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [note, setNote] = useState('');

  const stats = calculateGlucoseStats(records, selectedRange);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const num = Number(value);
    if (!num || isNaN(num) || num <= 0) return;

    onAddRecord({
      date,
      time,
      period,
      value: num,
      note: note.trim() || undefined,
    });

    soundFx.playSuccessTone();
    setValue('');
    setNote('');
    setIsAdding(false);
  };

  const filteredRecords = records
    .filter(r => filterPeriod === 'all' || r.period === filterPeriod)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            บันทึก & วิเคราะห์ระดับน้ำตาล (Blood Glucose)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            ติดตามค่าน้ำตาลในเลือดเพื่อประเมินความสม่ำเสมอและประสิทธิภาพของการใช้ยา/อินซูลิน
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>+ บันทึกค่าน้ำตาล</span>
        </button>
      </div>

      {/* Add New Record Modal/Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              เพิ่มบันทึกค่าน้ำตาลใหม่
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
            >
              ปิด
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ระดับน้ำตาล (mg/dL) *
              </label>
              <input
                type="number"
                required
                min="20"
                max="600"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="เช่น 115"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xl font-bold font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ช่วงเวลาที่ตรวจ *
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as GlucosePeriod)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="fasting">ก่อนอาหารเช้า (Fasting)</option>
                <option value="before_lunch">ก่อนอาหารกลางวัน</option>
                <option value="after_lunch">หลังอาหารกลางวัน (2 ชม.)</option>
                <option value="before_dinner">ก่อนอาหารเย็น</option>
                <option value="after_dinner">หลังอาหารเย็น (2 ชม.)</option>
                <option value="bedtime">ก่อนนอน (Bedtime)</option>
                <option value="random">สุ่มตรวจระหว่างวัน</option>
                <option value="during_hypo">ขณะมีอาการน้ำตาลตก</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                วันที่
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                เวลา
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              หมายเหตุ / อาการ (ถ้ามี)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ทานขนมหวานช่วงบ่าย, เดินออกกำลังกายก่อนตรวจ 20 นาที"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
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
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg"
            >
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      )}

      {/* Clinical Summary Banner (TIR + eA1c + Stats) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* Average */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">ค่าเฉลี่ย ({selectedRange} วัน)</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-white">{stats.average}</span>
            <span className="text-xs text-slate-400">mg/dL</span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">เป้าหมาย &lt; 130 (ก่อนอาหาร)</span>
        </div>

        {/* Estimated HbA1c */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">ประเมิน HbA1c (eA1c)</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-teal-400">{stats.estimatedA1c}</span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          <span className="text-[11px] text-teal-400 mt-1 block">เป้าหมายทั่วไป &lt; 7.0%</span>
        </div>

        {/* Time In Range */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Time in Range (TIR)</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-emerald-400">{stats.timeInRangePercent}</span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">เกณฑ์สากล &gt; 70%</span>
        </div>

        {/* Hypo Events (<70) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">ภาวะน้ำตาลต่ำ (&lt;70)</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-2xl lg:text-3xl font-bold font-mono ${stats.hypoEventsCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {stats.hypoEventsCount}
            </span>
            <span className="text-xs text-slate-400">ครั้ง</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">ควรน้อยกว่า 4% ของการตรวจ</span>
        </div>

        {/* Highest / Lowest */}
        <div className="col-span-2 lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">สูงสุด / ต่ำสุด</span>
          <div className="mt-2 flex items-center justify-between text-sm font-mono font-bold">
            <span className="text-amber-400">สูงสุด: {stats.highest || '--'}</span>
            <span className="text-rose-400">ต่ำสุด: {stats.lowest || '--'}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">ทั้งหมด {stats.totalLogs} บันทึก</span>
        </div>

      </div>

      {/* Visual Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">กราฟแสดงแนวโน้มระดับน้ำตาล</h3>
            <p className="text-xs text-slate-400">พื้นที่สีเขียวคือช่วงเป้าหมายที่ปลอดภัย (70 - 180 mg/dL)</p>
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            {([7, 14, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedRange(d)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedRange === d
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d} วัน
              </button>
            ))}
          </div>
        </div>

        {/* Interactive SVG Chart */}
        <div className="h-64 w-full bg-slate-950/60 rounded-2xl p-4 border border-slate-800 relative flex flex-col justify-between">
          
          {/* Target Zone Box */}
          <div className="absolute inset-x-0 top-[28%] bottom-[28%] bg-emerald-500/5 border-y border-dashed border-emerald-500/20 pointer-events-none flex items-center justify-end pr-4">
            <span className="text-[10px] text-emerald-500/60 font-mono">ช่วงเป้าหมาย 70-180 mg/dL</span>
          </div>

          {/* Data Points Display */}
          <div className="h-full flex items-end justify-between gap-2 z-10 pt-4 pb-2 px-2 overflow-x-auto">
            {records.slice(-20).map((r, i) => {
              const heightPct = Math.min(100, Math.max(10, (r.value / 260) * 100));
              const isHypo = r.value < 70;
              const isNormal = r.value >= 70 && r.value <= 180;
              const isHyper = r.value > 180;

              return (
                <div key={r.id || i} className="flex-1 min-w-[24px] flex flex-col items-center gap-1.5 group relative">
                  <div 
                    className="w-3 sm:w-4 rounded-t-full transition-all duration-300 group-hover:w-5 group-hover:brightness-125"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: isHypo ? '#F43F5E' : isNormal ? '#10B981' : '#F59E0B'
                    }}
                  />
                  <span className="text-[10px] font-mono font-medium text-slate-400 group-hover:text-white">
                    {r.value}
                  </span>

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                    <div className="bg-slate-800 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-700 whitespace-nowrap">
                      <div className="font-bold text-emerald-300">{r.value} mg/dL</div>
                      <div className="text-[11px] text-slate-300">{PERIOD_LABELS[r.period]}</div>
                      <div className="text-[10px] text-slate-400">{r.date} เวลา {r.time} น.</div>
                      {r.note && <div className="text-[10px] text-amber-300 mt-1">📝 {r.note}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* History Log Table with Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">ประวัติการตรวจวัดค่าน้ำตาล</h3>
            <p className="text-xs text-slate-400">รายการบันทึกเรียงจากล่าสุด</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">ทุกช่วงเวลา</option>
              <option value="fasting">ก่อนอาหารเช้า (Fasting)</option>
              <option value="after_lunch">หลังอาหารกลางวัน</option>
              <option value="after_dinner">หลังอาหารเย็น</option>
              <option value="bedtime">ก่อนนอน</option>
              <option value="during_hypo">น้ำตาลตก</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                <th className="py-3 px-3">วันที่ / เวลา</th>
                <th className="py-3 px-3">ช่วงเวลา</th>
                <th className="py-3 px-3">ค่าน้ำตาล (mg/dL)</th>
                <th className="py-3 px-3">การประเมิน</th>
                <th className="py-3 px-3">หมายเหตุ</th>
                <th className="py-3 px-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => {
                  const classification = classifyGlucose(r.value, r.period);

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-medium text-white">{r.date}</div>
                        <div className="text-xs text-slate-400 font-mono">{r.time} น.</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                        {PERIOD_LABELS[r.period] || r.period}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-lg font-bold font-mono text-white">
                          {r.value}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classification.badgeBg}`}>
                          {classification.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-300 max-w-xs truncate">
                        {r.note || '-'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onDeleteRecord(r.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="ลบบันทึก"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    ไม่พบบันทึกตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
