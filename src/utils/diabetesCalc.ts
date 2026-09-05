import { GlucoseRecord, InjectionSite, GlucosePeriod } from '../types';

export interface GlucoseStats {
  average: number;
  estimatedA1c: number;
  highest: number;
  lowest: number;
  totalLogs: number;
  timeInRangePercent: number; // 70-180 mg/dL
  timeBelowRangePercent: number; // < 70 mg/dL
  timeAboveRangePercent: number; // > 180 mg/dL
  hypoEventsCount: number;
  hyperEventsCount: number;
}

export function calculateGlucoseStats(records: GlucoseRecord[], days = 30): GlucoseStats {
  if (!records || records.length === 0) {
    return {
      average: 0,
      estimatedA1c: 0,
      highest: 0,
      lowest: 0,
      totalLogs: 0,
      timeInRangePercent: 0,
      timeBelowRangePercent: 0,
      timeAboveRangePercent: 0,
      hypoEventsCount: 0,
      hyperEventsCount: 0,
    };
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const filtered = records.filter(r => r.date >= cutoffStr);
  const data = filtered.length > 0 ? filtered : records;

  const values = data.map(r => r.value);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const average = Math.round(sum / values.length);

  // ADAG Formula: eA1c (%) = (Average Glucose mg/dL + 46.7) / 28.7
  const estimatedA1c = Number(((average + 46.7) / 28.7).toFixed(1));

  const highest = Math.max(...values);
  const lowest = Math.min(...values);

  const inRange = values.filter(v => v >= 70 && v <= 180).length;
  const belowRange = values.filter(v => v < 70).length;
  const aboveRange = values.filter(v => v > 180).length;

  const total = values.length;

  return {
    average,
    estimatedA1c,
    highest,
    lowest,
    totalLogs: total,
    timeInRangePercent: Math.round((inRange / total) * 100),
    timeBelowRangePercent: Math.round((belowRange / total) * 100),
    timeAboveRangePercent: Math.round((aboveRange / total) * 100),
    hypoEventsCount: belowRange,
    hyperEventsCount: aboveRange,
  };
}

export function classifyGlucose(value: number, period: GlucosePeriod): {
  status: 'low' | 'normal' | 'high' | 'very_high';
  label: string;
  color: string;
  badgeBg: string;
  advice: string;
} {
  if (value < 70) {
    return {
      status: 'low',
      label: 'น้ำตาลต่ำ (Hypo)',
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
      advice: 'ควรปฏิบัติตามกฎ 15-15: ทานคาร์โบไฮเดรตเร็ว 15 กรัม เช่น น้ำผลไม้ 1 กล่อง แล้วตรวจซ้ำ 15 นาที',
    };
  }

  const isFasting = period === 'fasting' || period === 'before_lunch' || period === 'before_dinner';
  const isPostMeal = period === 'after_lunch' || period === 'after_dinner';

  if (isFasting) {
    if (value <= 130) {
      return {
        status: 'normal',
        label: 'อยู่ในเกณฑ์ดี (ก่อนอาหาร)',
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
        advice: 'ค่าน้ำตาลก่อนอาหารอยู่ในเกณฑ์เป้าหมาย (70-130 mg/dL) ทำได้ดีมากครับ',
      };
    } else if (value <= 180) {
      return {
        status: 'high',
        label: 'ค่อนข้างสูง',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
        advice: 'ค่อนข้างสูงกว่าเกณฑ์ก่อนอาหารเล็กน้อย แนะนำระวังปริมาณแป้งในมื้อถัดไป',
      };
    } else {
      return {
        status: 'very_high',
        label: 'สูงเกินเกณฑ์',
        color: 'text-rose-400',
        badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
        advice: 'น้ำตาลสูงกว่าเกณฑ์ ควรดื่มน้ำเปล่าให้เพียงพอ และตรวจสอบการใช้ยาหรืออินซูลิน',
      };
    }
  } else if (isPostMeal) {
    if (value <= 180) {
      return {
        status: 'normal',
        label: 'อยู่ในเกณฑ์ดี (หลังอาหาร)',
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
        advice: 'ค่าน้ำตาลหลังอาหาร 2 ชม. อยู่ในเกณฑ์เป้าหมาย (<180 mg/dL)',
      };
    } else if (value <= 240) {
      return {
        status: 'high',
        label: 'สูงหลังอาหาร',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
        advice: 'น้ำตาลหลังอาหารสูง อาจเกิดจากอาหารมื้อล่าสุดมีคาร์บหรือน้ำตาลสูง',
      };
    } else {
      return {
        status: 'very_high',
        label: 'สูงมากหลังอาหาร',
        color: 'text-rose-400',
        badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
        advice: 'น้ำตาลสูงมาก แนะนำเดินย่อยเบาๆ 15-20 นาที และปรึกษาแพทย์หากสูงต่อเนื่อง',
      };
    }
  }

  // General fallback
  if (value <= 140) {
    return {
      status: 'normal',
      label: 'ระดับปกติ',
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
      advice: 'ระดับน้ำตาลอยู่ในเกณฑ์ที่ปลอดภัย',
    };
  } else if (value <= 200) {
    return {
      status: 'high',
      label: 'สูงปานกลาง',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
      advice: 'สูงกว่าเกณฑ์ทั่วไป ควรรักษาระดับกิจกรรมและการทานอาหารให้สม่ำเสมอ',
    };
  } else {
    return {
      status: 'very_high',
      label: 'สูงมาก',
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
      advice: 'สูงเกินเป้าหมาย ระวังอาการปัสสาวะบ่อย กระหายน้ำ อ่อนเพลีย',
    };
  }
}

export const PERIOD_LABELS: Record<GlucosePeriod, string> = {
  fasting: 'ก่อนอาหารเช้า (Fasting)',
  before_lunch: 'ก่อนอาหารกลางวัน',
  after_lunch: 'หลังอาหารกลางวัน 2 ชม.',
  before_dinner: 'ก่อนอาหารเย็น',
  after_dinner: 'หลังอาหารเย็น 2 ชม.',
  bedtime: 'ก่อนนอน',
  random: 'สุ่มตรวจระหว่างวัน',
  during_hypo: 'ขณะมีอาการผิดปกติ/น้ำตาลตก',
};

export interface SiteInfo {
  id: InjectionSite;
  label: string;
  area: 'abdomen' | 'thigh' | 'arm' | 'buttock';
  description: string;
  x: number; // percentage in svg
  y: number; // percentage in svg
}

export const INJECTION_SITES: SiteInfo[] = [
  { id: 'abdomen_top_right', label: 'หน้าท้อง ขวาบน', area: 'abdomen', description: 'ห่างจากสะดือ 2 นิ้วมือ', x: 42, y: 44 },
  { id: 'abdomen_top_left', label: 'หน้าท้อง ซ้ายบน', area: 'abdomen', description: 'ห่างจากสะดือ 2 นิ้วมือ', x: 58, y: 44 },
  { id: 'abdomen_bottom_right', label: 'หน้าท้อง ขวาล่าง', area: 'abdomen', description: 'ห่างจากสะดือ 2 นิ้วมือ', x: 42, y: 52 },
  { id: 'abdomen_bottom_left', label: 'หน้าท้อง ซ้ายล่าง', area: 'abdomen', description: 'ห่างจากสะดือ 2 นิ้วมือ', x: 58, y: 52 },
  { id: 'thigh_right', label: 'ต้นขาขวา (ด้านนอก)', area: 'thigh', description: 'บริเวณกึ่งกลางต้นขาด้านนอก', x: 38, y: 70 },
  { id: 'thigh_left', label: 'ต้นขาซ้าย (ด้านนอก)', area: 'thigh', description: 'บริเวณกึ่งกลางต้นขาด้านนอก', x: 62, y: 70 },
  { id: 'arm_right', label: 'ต้นแขนขวา (ด้านหลัง)', area: 'arm', description: 'บริเวณกล้ามเนื้อต้นแขนส่วนนอก/หลัง', x: 25, y: 38 },
  { id: 'arm_left', label: 'ต้นแขนซ้าย (ด้านหลัง)', area: 'arm', description: 'บริเวณกล้ามเนื้อต้นแขนส่วนนอก/หลัง', x: 75, y: 38 },
  { id: 'buttock_right', label: 'สะโพกขวา', area: 'buttock', description: 'ส่วนบนด้านนอกของสะโพก', x: 36, y: 58 },
  { id: 'buttock_left', label: 'สะโพกซ้าย', area: 'buttock', description: 'ส่วนบนด้านนอกของสะโพก', x: 64, y: 58 },
];

export interface ThaiFoodItem {
  id: string;
  name: string;
  category: 'rice_noodle' | 'fruit' | 'snack' | 'drink' | 'dish';
  portion: string;
  carbsGrams: number;
  carbExchanges: number; // 15g = 1 carb
  calories: number;
  glycemicIndex: 'low' | 'medium' | 'high';
}

export const THAI_FOOD_DATABASE: ThaiFoodItem[] = [
  { id: 'tf_1', name: 'ข้าวสวย / ข้าวกล้อง', category: 'rice_noodle', portion: '1 ทัพพี (60g)', carbsGrams: 15, carbExchanges: 1.0, calories: 80, glycemicIndex: 'medium' },
  { id: 'tf_2', name: 'ข้าวเหนียว', category: 'rice_noodle', portion: '1/2 ทัพพี (35g)', carbsGrams: 15, carbExchanges: 1.0, calories: 80, glycemicIndex: 'high' },
  { id: 'tf_3', name: 'ข้าวต้ม', category: 'rice_noodle', portion: '1 ถ้วย (120g)', carbsGrams: 15, carbExchanges: 1.0, calories: 80, glycemicIndex: 'medium' },
  { id: 'tf_4', name: 'ขนมปังโฮลวีต', category: 'rice_noodle', portion: '1 แผ่น (30g)', carbsGrams: 15, carbExchanges: 1.0, calories: 75, glycemicIndex: 'low' },
  { id: 'tf_5', name: 'ก๋วยเตี๋ยวเส้นเล็ก/เส้นหมี่', category: 'rice_noodle', portion: '1 ทัพพีลวกสุก', carbsGrams: 15, carbExchanges: 1.0, calories: 80, glycemicIndex: 'medium' },
  { id: 'tf_6', name: 'วุ้นเส้นสุก', category: 'rice_noodle', portion: '1 ทัพพี', carbsGrams: 15, carbExchanges: 1.0, calories: 80, glycemicIndex: 'low' },
  { id: 'tf_7', name: 'ส้มโอ', category: 'fruit', portion: '2 กลีบกลาง', carbsGrams: 15, carbExchanges: 1.0, calories: 60, glycemicIndex: 'low' },
  { id: 'tf_8', name: 'ฝรั่ง', category: 'fruit', portion: '1/2 ผลกลาง (4 ชิ้น)', carbsGrams: 15, carbExchanges: 1.0, calories: 60, glycemicIndex: 'low' },
  { id: 'tf_9', name: 'กล้วยน้ำว้า', category: 'fruit', portion: '1 ลูกเล็ก', carbsGrams: 15, carbExchanges: 1.0, calories: 60, glycemicIndex: 'medium' },
  { id: 'tf_10', name: 'แอปเปิ้ล', category: 'fruit', portion: '1 ผลเล็ก', carbsGrams: 15, carbExchanges: 1.0, calories: 60, glycemicIndex: 'low' },
  { id: 'tf_11', name: 'แตงโม', category: 'fruit', portion: '6-8 ชิ้นพอดีคำ', carbsGrams: 15, carbExchanges: 1.0, calories: 60, glycemicIndex: 'high' },
  { id: 'tf_12', name: 'นมจืดไขมันต่ำ', category: 'drink', portion: '1 กล่อง (200ml)', carbsGrams: 12, carbExchanges: 0.8, calories: 90, glycemicIndex: 'low' },
  { id: 'tf_13', name: 'นมถั่วเหลืองไม่หวาน', category: 'drink', portion: '1 กล่อง (200ml)', carbsGrams: 8, carbExchanges: 0.5, calories: 100, glycemicIndex: 'low' },
  { id: 'tf_14', name: 'ชาเขียว/กาแฟดำ (ไม่ใส่น้ำตาล)', category: 'drink', portion: '1 แก้ว', carbsGrams: 0, carbExchanges: 0, calories: 5, glycemicIndex: 'low' },
  { id: 'tf_15', name: 'ชานมไข่มุกหวานปกติ', category: 'drink', portion: '1 แก้ว (500ml)', carbsGrams: 55, carbExchanges: 3.7, calories: 350, glycemicIndex: 'high' },
  { id: 'tf_16', name: 'ข้าวมันไก่ (พร้อมข้าว)', category: 'dish', portion: '1 จานปกติ', carbsGrams: 50, carbExchanges: 3.3, calories: 550, glycemicIndex: 'high' },
  { id: 'tf_17', name: 'ก๋วยเตี๋ยวน้ำใสรวม', category: 'dish', portion: '1 ชาม', carbsGrams: 35, carbExchanges: 2.3, calories: 320, glycemicIndex: 'medium' },
  { id: 'tf_18', name: 'ผัดไทยกุ้งสด', category: 'dish', portion: '1 จาน', carbsGrams: 60, carbExchanges: 4.0, calories: 580, glycemicIndex: 'high' },
  { id: 'tf_19', name: 'ส้มตำไทย', category: 'dish', portion: '1 จานเล็ก', carbsGrams: 15, carbExchanges: 1.0, calories: 120, glycemicIndex: 'medium' },
  { id: 'tf_20', name: 'แกงจืดเต้าหู้หมูสับ', category: 'dish', portion: '1 ถ้วย', carbsGrams: 6, carbExchanges: 0.4, calories: 140, glycemicIndex: 'low' },
];
