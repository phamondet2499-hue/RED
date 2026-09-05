export type DiabetesType = 'type1' | 'type2' | 'gdm' | 'prediabetes';

export type GlucosePeriod = 
  | 'fasting'        // ก่อนอาหารเช้า
  | 'before_lunch'   // ก่อนอาหารกลางวัน
  | 'after_lunch'    // หลังอาหารกลางวัน (2 ชม.)
  | 'before_dinner'  // ก่อนอาหารเย็น
  | 'after_dinner'   // หลังอาหารเย็น (2 ชม.)
  | 'bedtime'        // ก่อนนอน
  | 'random'         // สุ่มตรวจ
  | 'during_hypo';   // ตอนมีอาการน้ำตาลตก

export interface GlucoseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  period: GlucosePeriod;
  value: number; // mg/dL
  note?: string;
  symptoms?: string[];
}

export type MedicationType = 'oral_med' | 'insulin_rapid' | 'insulin_long' | 'insulin_mixed';

export type InjectionSite = 
  | 'abdomen_top_right'
  | 'abdomen_top_left'
  | 'abdomen_bottom_right'
  | 'abdomen_bottom_left'
  | 'thigh_right'
  | 'thigh_left'
  | 'arm_right'
  | 'arm_left'
  | 'buttock_right'
  | 'buttock_left';

export interface MedicationSchedule {
  id: string;
  name: string;
  type: MedicationType;
  dose: string; // e.g. "1 เม็ด" or "12 ยูนิต"
  unit: string; // "เม็ด" | "ยูนิต" | "มล." | "แคปซูล"
  times: string[]; // e.g. ["07:30", "18:30"]
  mealRelation: 'before_meal' | 'after_meal' | 'with_meal' | 'bedtime' | 'anytime';
  color: string; // color tag
  currentStock: number;
  lowStockThreshold: number;
  instructions?: string;
  isActive: boolean;
}

export interface MedicationLog {
  id: string;
  scheduleId: string;
  medName: string;
  type: MedicationType;
  dose: string;
  date: string; // YYYY-MM-DD
  scheduledTime: string;
  takenTime: string;
  status: 'taken' | 'skipped';
  injectionSite?: InjectionSite;
  note?: string;
}

export interface VitalsRecord {
  id: string;
  date: string;
  time: string;
  sys: number; // systolic mmHg
  dia: number; // diastolic mmHg
  pulse: number; // bpm
  weight?: number; // kg
  note?: string;
}

export interface FoodRecord {
  id: string;
  date: string;
  time: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  carbsGrams: number;
  carbExchanges: number; // 1 carb = 15g
  calories?: number;
  tags?: string[];
  note?: string;
}

export interface ExerciseRecord {
  id: string;
  date: string;
  time: string;
  type: string; // เดิน, วิ่ง, ปั่นจักรยาน, ว่ายน้ำ, กายบริหาร
  durationMinutes: number;
  steps?: number;
  caloriesBurned?: number;
  intensity: 'light' | 'moderate' | 'vigorous';
  note?: string;
}

export interface WaterRecord {
  id: string;
  date: string;
  amountMl: number;
}

export interface DoctorAppointment {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  doctorName: string;
  hospital: string;
  department: string;
  reason: string;
  preparationNotes: string[];
  status: 'upcoming' | 'completed' | 'cancelled';
  doctorFeedback?: string;
  nextMedChanges?: string;
}

export interface FootCheckRecord {
  id: string;
  date: string;
  hasRedness: boolean;
  hasBlister: boolean;
  hasNumbness: boolean;
  hasSwelling: boolean;
  hasDryCracks: boolean;
  note?: string;
}

export interface ReminderAlarm {
  id: string;
  title: string;
  time: string; // HH:mm
  type: 'medication' | 'insulin' | 'glucose' | 'water' | 'exercise';
  enabled: boolean;
  sound: boolean;
  days: number[]; // 0=Sun, 1=Mon...
  relatedId?: string; // e.g. scheduleId
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  diabetesType: DiabetesType;
  yearDiagnosed: number;
  targetFastingMin: number; // 70
  targetFastingMax: number; // 130
  targetPostMealMax: number; // 180
  targetHbA1c: number; // 6.5 or 7.0
  waterDailyTargetMl: number; // 2000
  carbDailyTargetGrams: number; // 150
  stepsDailyTarget: number; // 6000
  emergencyContactName: string;
  emergencyContactPhone: string;
  doctorName: string;
  hospitalName: string;
}

export interface AppData {
  profile: UserProfile;
  glucoseLogs: GlucoseRecord[];
  medSchedules: MedicationSchedule[];
  medLogs: MedicationLog[];
  vitalsLogs: VitalsRecord[];
  foodLogs: FoodRecord[];
  exerciseLogs: ExerciseRecord[];
  waterLogs: WaterRecord[];
  appointments: DoctorAppointment[];
  footCheckLogs: FootCheckRecord[];
  alarms: ReminderAlarm[];
}
