import { useState, type FormEvent } from 'react';
import { 
  Utensils, 
  Plus, 
  Trash2, 
  Search, 
  Calculator, 
  Sparkles, 
  Check, 
  ChevronRight, 
  Info,
  Apple
} from 'lucide-react';
import { FoodRecord } from '../types';
import { THAI_FOOD_DATABASE, ThaiFoodItem } from '../utils/diabetesCalc';
import { soundFx } from '../utils/sound';

interface FoodCarbViewProps {
  logs: FoodRecord[];
  onAddFood: (food: Omit<FoodRecord, 'id'>) => void;
  onDeleteFood: (id: string) => void;
  dailyTargetGrams: number;
}

export function FoodCarbView({
  logs,
  onAddFood,
  onDeleteFood,
  dailyTargetGrams = 135,
}: FoodCarbViewProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Custom Form
  const [meal, setMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [title, setTitle] = useState('');
  const [carbsGrams, setCarbsGrams] = useState('');
  const [calories, setCalories] = useState('');
  const [note, setNote] = useState('');

  // Interactive Quick Calculator state
  const [riceScoops, setRiceScoops] = useState(1);
  const [fruitPortions, setFruitPortions] = useState(1);
  const [snackPortions, setSnackPortions] = useState(0);

  const calculatedCarbs = (riceScoops * 15) + (fruitPortions * 15) + (snackPortions * 15);
  const calculatedExchanges = calculatedCarbs / 15;

  const todayLogs = logs.filter(l => l.date === selectedDate);
  const totalCarbsToday = todayLogs.reduce((sum, l) => sum + (l.carbsGrams || 0), 0);
  const totalExchangesToday = (totalCarbsToday / 15).toFixed(1);
  const carbPercent = Math.min(100, Math.round((totalCarbsToday / dailyTargetGrams) * 100));

  const filteredThaiFoods = THAI_FOOD_DATABASE.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.portion.includes(searchQuery);
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleQuickAddThaiFood = (item: ThaiFoodItem) => {
    onAddFood({
      date: selectedDate,
      time: new Date().toTimeString().slice(0, 5),
      meal,
      title: `${item.name} (${item.portion})`,
      carbsGrams: item.carbsGrams,
      carbExchanges: item.carbExchanges,
      calories: item.calories,
      tags: [item.glycemicIndex === 'low' ? 'GI ต่ำ' : item.glycemicIndex === 'high' ? 'GI สูง' : 'GI ปานกลาง'],
    });
    soundFx.playSuccessTone();
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const carbs = Number(carbsGrams) || 0;
    onAddFood({
      date: selectedDate,
      time: new Date().toTimeString().slice(0, 5),
      meal,
      title: title.trim(),
      carbsGrams: carbs,
      carbExchanges: Number((carbs / 15).toFixed(1)),
      calories: Number(calories) || undefined,
      note: note.trim() || undefined,
    });

    soundFx.playSuccessTone();
    setTitle('');
    setCarbsGrams('');
    setCalories('');
    setNote('');
  };

  const handleApplyQuickCalculator = () => {
    onAddFood({
      date: selectedDate,
      time: new Date().toTimeString().slice(0, 5),
      meal,
      title: `มื้ออาหารคำนวณคาร์บ (ข้าว ${riceScoops} ทัพพี, ผลไม้ ${fruitPortions} ส่วน)`,
      carbsGrams: calculatedCarbs,
      carbExchanges: calculatedExchanges,
      calories: (riceScoops * 80) + (fruitPortions * 60) + (snackPortions * 100),
    });
    soundFx.playSuccessTone();
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-amber-400" />
            อาหาร & การนับคาร์โบไฮเดรต (Carb Counting)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            1 ส่วนคาร์บ (Carb Exchange) = 15 กรัมคาร์โบไฮเดรต ช่วยคุมระดับน้ำตาลหลังอาหารได้อย่างแม่นยำ
          </p>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-xs sm:text-sm rounded-xl px-3.5 py-2 text-white self-start sm:self-auto"
        />
      </div>

      {/* Daily Carb Progress vs Target */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">โควต้าคาร์โบไฮเดรตวันนี้</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold font-mono text-white">{totalCarbsToday}</span>
              <span className="text-sm text-slate-400 font-sans">/ {dailyTargetGrams} กรัม</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold ml-2">
                {totalExchangesToday} คาร์บ
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-400">
            <div>เป้าหมายแนะนำสำหรับเบาหวาน: <b>3-4 คาร์บ/มื้อ</b> (45-60g)</div>
            <div className="text-amber-400 mt-0.5">เหลือโควต้าวันนี้: <b>{Math.max(0, dailyTargetGrams - totalCarbsToday)} กรัม</b></div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              carbPercent > 100 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'
            }`}
            style={{ width: `${Math.min(100, carbPercent)}%` }}
          />
        </div>
      </div>

      {/* Grid: Quick Carb Calculator + Custom Meal Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Carb Exchange Interactive Calculator */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-5">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">เครื่องคำนวณคาร์บด่วน (Carb Exchange)</h3>
          </div>

          <p className="text-xs text-slate-400">
            ปรับจำนวนทัพพี/ส่วนเพื่อคำนวณคาร์บรวมอย่างรวดเร็ว (1 ส่วน = 15 กรัม)
          </p>

          <div className="space-y-4">
            
            {/* Rice / Noodles */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">🍚 ข้าว / แป้ง / เส้นก๋วยเตี๋ยว</div>
                <div className="text-xs text-slate-400">1 ทัพพี (60g) = 15g คาร์บ</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRiceScoops(Math.max(0, riceScoops - 0.5))}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  -
                </button>
                <span className="w-12 text-center font-mono font-bold text-white">{riceScoops} ทัพพี</span>
                <button
                  type="button"
                  onClick={() => setRiceScoops(riceScoops + 0.5)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Fruits */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">🍎 ผลไม้ (ฝรั่ง, แอปเปิ้ล, ส้มโอ)</div>
                <div className="text-xs text-slate-400">1 ส่วนผลไม้ = 15g คาร์บ</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFruitPortions(Math.max(0, fruitPortions - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  -
                </button>
                <span className="w-12 text-center font-mono font-bold text-white">{fruitPortions} ส่วน</span>
                <button
                  type="button"
                  onClick={() => setFruitPortions(fruitPortions + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Snacks / Drinks */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">🧋 ขนม / เครื่องดื่มรสหวาน</div>
                <div className="text-xs text-slate-400">1 ส่วน = 15g คาร์บ</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSnackPortions(Math.max(0, snackPortions - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  -
                </button>
                <span className="w-12 text-center font-mono font-bold text-white">{snackPortions} ส่วน</span>
                <button
                  type="button"
                  onClick={() => setSnackPortions(snackPortions + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* Calculator Result Box */}
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-300 font-semibold">รวมคาร์โบไฮเดรตในมื้อนี้:</div>
              <div className="text-2xl font-bold font-mono text-white mt-0.5">
                {calculatedCarbs} <span className="text-sm font-sans font-normal text-slate-400">กรัม ({calculatedExchanges} คาร์บ)</span>
              </div>
            </div>

            <button
              onClick={handleApplyQuickCalculator}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              + บันทึกลงมื้อนี้
            </button>
          </div>
        </div>

        {/* Custom Food Log Form */}
        <form onSubmit={handleCustomSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            บันทึกเมนูอาหารแบบกำหนดเอง
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">มื้ออาหาร</label>
              <select
                value={meal}
                onChange={(e) => setMeal(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="breakfast">มื้อเช้า</option>
                <option value="lunch">มื้อกลางวัน</option>
                <option value="dinner">มื้อเย็น</option>
                <option value="snack">อาหารว่าง/ของว่าง</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">คาร์โบไฮเดรต (กรัม) *</label>
              <input
                type="number"
                required
                value={carbsGrams}
                onChange={(e) => setCarbsGrams(e.target.value)}
                placeholder="เช่น 30"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ชื่อเมนูอาหาร *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ข้าวกล้อง 1.5 ทัพพี + ต้มจืดเต้าหู้หมูสับ + ฝรั่ง 4 ชิ้น"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">แคลอรี่โดยประมาณ (kcal)</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="เช่น 350"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">บันทึกเพิ่มเติม</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น ไม่ใส่น้ำตาล, สั่งหวาน 25%"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg transition-all"
          >
            บันทึกรายการอาหาร
          </button>
        </form>

      </div>

      {/* Thai Food Database Quick Picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Apple className="w-5 h-5 text-emerald-400" />
              ฐานข้อมูลอาหารไทย & คาร์บต่อส่วน (Thai Food Carb Guide)
            </h3>
            <p className="text-xs text-slate-400">กดปุ่ม + เพื่อเพิ่มเข้ารายการบันทึกทันที</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่ออาหาร..."
                className="bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 w-48 sm:w-60 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredThaiFoods.map((item) => (
            <div
              key={item.id}
              className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-3.5 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-bold text-white text-sm">{item.name}</div>
                <div className="text-xs text-slate-400">{item.portion}</div>
                <div className="text-xs text-amber-400 font-mono mt-1">
                  <b>{item.carbsGrams}g</b> คาร์บ ({item.carbExchanges} คาร์บ) • {item.calories} kcal
                </div>
              </div>

              <button
                onClick={() => handleQuickAddThaiFood(item)}
                className="p-2 bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white rounded-xl transition-colors"
                title="เพิ่มรายการนี้"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Food Logs List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-7 space-y-4">
        <h3 className="text-lg font-bold text-white">บันทึกอาหารประจำวันที่ {selectedDate}</h3>

        <div className="divide-y divide-slate-800">
          {todayLogs.length > 0 ? (
            todayLogs.map((l) => (
              <div key={l.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-md uppercase">
                      {l.meal === 'breakfast' ? 'เช้า' : l.meal === 'lunch' ? 'กลางวัน' : l.meal === 'dinner' ? 'เย็น' : 'ของว่าง'}
                    </span>
                    <span className="font-bold text-white text-sm">{l.title}</span>
                    <span className="text-xs text-slate-500">{l.time} น.</span>
                  </div>
                  {l.note && <p className="text-xs text-slate-400 mt-0.5">📝 {l.note}</p>}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-400">{l.carbsGrams}g</span>
                    <span className="text-xs text-slate-400 block">{l.carbExchanges} คาร์บ</span>
                  </div>
                  <button
                    onClick={() => onDeleteFood(l.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-slate-500 text-sm">ยังไม่มีบันทึกอาหารในวันที่เลือก</p>
          )}
        </div>
      </div>

    </div>
  );
}
