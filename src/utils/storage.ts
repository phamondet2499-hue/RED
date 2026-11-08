import { AppData, GlucoseRecord, MedicationSchedule, MedicationLog, VitalsRecord, FoodRecord, ExerciseRecord, WaterRecord, DoctorAppointment, FootCheckRecord, ReminderAlarm, UserProfile } from '../types';

const STORAGE_KEY = 'diabetes_care_plus_data_v1';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'สมชาย รักสุขภาพ',
  age: 58,
  gender: 'male',
  diabetesType: 'type2',
  yearDiagnosed: 2020,
  targetFastingMin: 70,
  targetFastingMax: 130,
  targetPostMealMax: 180,
  targetHbA1c: 6.5,
  waterDailyTargetMl: 2000,
  carbDailyTargetGrams: 135, // ~9 carbs/day
  stepsDailyTarget: 6000,
  emergencyContactName: 'คุณสุดา (ภรรยา)',
  emergencyContactPhone: '081-234-5678',
  doctorName: 'นพ. วรพงษ์ เกียรติวิทยา (อายุรแพทย์ต่อมไร้ท่อ)',
  hospitalName: 'โรงพยาบาลจุฬาลงกรณ์',
  weightKg: 68,
  totalDailyInsulinUnits: 26,
  customIcr: 12,
  customIsf: 45,
  preferredIcrRule: '500',
};

// Generate realistic seed data for immediate clinical richness
export function generateSeedData(): AppData {
  const today = new Date();
  const getOffsetDate = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const todayStr = getOffsetDate(0);

  const medSchedules: MedicationSchedule[] = [
    {
      id: 'med_1',
      name: 'Metformin (500 mg)',
      type: 'oral_med',
      dose: '1 เม็ด',
      unit: 'เม็ด',
      times: ['08:00', '18:30'],
      mealRelation: 'after_meal',
      color: '#3B82F6', // Blue
      currentStock: 45,
      lowStockThreshold: 14,
      instructions: 'รับประทานหลังอาหารทันทีเพื่อลดอาการระคายเคืองกระเพาะ',
      isActive: true,
    },
    {
      id: 'med_2',
      name: 'Gliclazide (MR 30 mg)',
      type: 'oral_med',
      dose: '1 เม็ด',
      unit: 'เม็ด',
      times: ['07:30'],
      mealRelation: 'before_meal',
      color: '#10B981', // Emerald
      currentStock: 20,
      lowStockThreshold: 10,
      instructions: 'ทานก่อนอาหารเช้า 15-30 นาที',
      isActive: true,
    },
    {
      id: 'med_3',
      name: 'Insulin Glargine (Lantus)',
      type: 'insulin_long',
      dose: '14 ยูนิต',
      unit: 'ยูนิต',
      times: ['21:00'],
      mealRelation: 'bedtime',
      color: '#8B5CF6', // Purple
      currentStock: 2,
      lowStockThreshold: 1,
      instructions: 'ฉีดเข้าใต้ผิวหนังเวลาเดิมทุกคืน หมุนเวียนตำแหน่งฉีดสม่ำเสมอ',
      isActive: true,
    },
    {
      id: 'med_4',
      name: 'Insulin Aspart (NovoRapid)',
      type: 'insulin_rapid',
      dose: '6 ยูนิต',
      unit: 'ยูนิต',
      times: ['07:30', '18:00'],
      mealRelation: 'before_meal',
      color: '#F59E0B', // Amber
      currentStock: 3,
      lowStockThreshold: 1,
      instructions: 'ฉีดก่อนเริ่มรับประทานอาหารไม่เกิน 5-10 นาที',
      isActive: true,
    }
  ];

  const glucoseLogs: GlucoseRecord[] = [];
  const vitalsLogs: VitalsRecord[] = [];
  const foodLogs: FoodRecord[] = [];
  const exerciseLogs: ExerciseRecord[] = [];
  const waterLogs: WaterRecord[] = [];
  const medLogs: MedicationLog[] = [];
  const footCheckLogs: FootCheckRecord[] = [];

  // Populate 14 days of realistic logs
  for (let i = 13; i >= 0; i--) {
    const dStr = getOffsetDate(i);

    // Fasting glucose
    const fastingVal = Math.floor(105 + Math.random() * 25 - (i % 3 === 0 ? 10 : 0));
    glucoseLogs.push({
      id: `gl_f_${i}`,
      date: dStr,
      time: '07:00',
      period: 'fasting',
      value: fastingVal,
      note: i === 2 ? 'นอนดึกเล็กน้อย' : undefined,
    });

    // Post-meal glucose (some days)
    if (i % 2 === 0) {
      // Day 4 has a spike due to a skipped mealtime insulin dose
      const postMealVal = i === 4 ? 208 : Math.floor(135 + Math.random() * 25);
      glucoseLogs.push({
        id: `gl_p_${i}`,
        date: dStr,
        time: '13:30',
        period: 'after_lunch',
        value: postMealVal,
        note: i === 4 ? 'ลืมฉีดอินซูลินมื้ออาหาร น้ำตาลดีดสูง' : 'หลังทานข้าวราดแกง ฉีด NovoRapid 6U',
      });
    }

    // Bedtime glucose
    if (i % 3 === 0) {
      const bedtimeVal = Math.floor(115 + Math.random() * 20);
      glucoseLogs.push({
        id: `gl_b_${i}`,
        date: dStr,
        time: '21:30',
        period: 'bedtime',
        value: bedtimeVal,
      });
    }

    // Vitals
    vitalsLogs.push({
      id: `vit_${i}`,
      date: dStr,
      time: '07:15',
      sys: Math.floor(122 + Math.random() * 10),
      dia: Math.floor(78 + Math.random() * 6),
      pulse: Math.floor(72 + Math.random() * 8),
      weight: Number((68.2 - (13 - i) * 0.05 + Math.random() * 0.2).toFixed(1)),
    });

    // Exercise
    if (i % 2 === 0 || i === 1) {
      exerciseLogs.push({
        id: `ex_${i}`,
        date: dStr,
        time: '17:30',
        type: 'เดินเร็วรอบสวนสาธารณะ',
        durationMinutes: 30,
        steps: Math.floor(4500 + Math.random() * 2500),
        caloriesBurned: Math.floor(140 + Math.random() * 40),
        intensity: 'moderate',
      });
    }

    // Water
    waterLogs.push({
      id: `w_${i}`,
      date: dStr,
      amountMl: Math.floor(1750 + Math.random() * 600),
    });

    // Food (Sample for today & yesterday)
    if (i <= 1) {
      foodLogs.push(
        {
          id: `food_b_${i}`,
          date: dStr,
          time: '08:00',
          meal: 'breakfast',
          title: 'ข้าวต้มข้าวกล้องอกไก่ + ไข่ต้ม 1 ฟอง',
          carbsGrams: 28,
          carbExchanges: 1.9,
          calories: 280,
          tags: ['ดัชนีน้ำตาลต่ำ', 'โปรตีนสูง'],
        },
        {
          id: `food_l_${i}`,
          date: dStr,
          time: '12:30',
          meal: 'lunch',
          title: 'ก๋วยเตี๋ยวเกาเหลาหมูตุ๋น + ข้าวสวย 1 ทัพพี + ฝรั่ง 4 ชิ้น',
          carbsGrams: 35,
          carbExchanges: 2.3,
          calories: 420,
        },
        {
          id: `food_d_${i}`,
          date: dStr,
          time: '18:30',
          meal: 'dinner',
          title: 'แกงส้มผักรวมปลาช่อน + ข้าวกล้อง 1 ทัพพี',
          carbsGrams: 25,
          carbExchanges: 1.7,
          calories: 310,
        }
      );
    }

    // Medication logs
    medLogs.push(
      {
        id: `ml_1_${i}`,
        scheduleId: 'med_1',
        medName: 'Metformin (500 mg)',
        type: 'oral_med',
        dose: '1 เม็ด',
        date: dStr,
        scheduledTime: '08:00',
        takenTime: '08:05',
        status: 'taken',
      },
      {
        id: `ml_2_${i}`,
        scheduleId: 'med_3',
        medName: 'Insulin Glargine (Lantus)',
        type: 'insulin_long',
        dose: '14 ยูนิต',
        date: dStr,
        scheduledTime: '21:00',
        takenTime: '21:00',
        status: 'taken',
        injectionSite: i % 2 === 0 ? 'abdomen_top_left' : 'abdomen_top_right',
      },
      {
        id: `ml_3_${i}`,
        scheduleId: 'med_4',
        medName: 'Insulin Aspart (NovoRapid)',
        type: 'insulin_rapid',
        dose: '6 ยูนิต',
        date: dStr,
        scheduledTime: '12:30',
        takenTime: i === 4 ? '12:30' : '12:25',
        status: i === 4 ? 'skipped' : 'taken',
        injectionSite: 'abdomen_bottom_left',
        note: i === 4 ? 'ลืมพกปากกาอินซูลินไปที่ทำงาน' : 'ฉีดก่อนอาหารกลางวัน 5 นาที',
      }
    );

    // Foot check
    if (i % 3 === 0) {
      footCheckLogs.push({
        id: `fc_${i}`,
        date: dStr,
        hasRedness: false,
        hasBlister: false,
        hasNumbness: false,
        hasSwelling: false,
        hasDryCracks: false,
        note: 'ผิวเท้าชุ่มชื้นปกติ ไม่มีแผลหรือรอยกดทับ',
      });
    }
  }

  // Today specific appointment in future
  const appointmentNext = new Date(today);
  appointmentNext.setDate(today.getDate() + 5);
  const nextApptStr = appointmentNext.toISOString().split('T')[0];

  const appointments: DoctorAppointment[] = [
    {
      id: 'appt_1',
      date: nextApptStr,
      time: '09:00',
      doctorName: 'นพ. วรพงษ์ เกียรติวิทยา',
      hospital: 'รพ. จุฬาลงกรณ์ (คลินิกเบาหวาน ตึก ภปร ชั้น 5)',
      department: 'ศูนย์ความเป็นเลิศทางการแพทย์ด้านเบาหวาน',
      reason: 'ติดตามผลเลือด HbA1c ประจำ 3 เดือน และตรวจการทำงานของไต',
      preparationNotes: [
        'งดน้ำและอาหารหลัง 22:00 น. ก่อนวันนัด (ตรวจเลือด Fasting Glucose & Lipids)',
        'นำสมุดบันทึกหรือเปิดประวัติค่าน้ำตาลในแอปนี้ให้คุณหมอดู',
        'นำยาและอินซูลินที่ใช้อยู่ปัจจุบันมาด้วยทั้งหมด',
      ],
      status: 'upcoming',
    },
    {
      id: 'appt_past_1',
      date: getOffsetDate(85),
      time: '09:30',
      doctorName: 'พญ. สิริพร นันท์ทวีวัฒน์',
      hospital: 'รพ. จุฬาลงกรณ์',
      department: 'จักษุวิทยา (ตรวจจอประสาทตา)',
      reason: 'ตรวจคัดกรองเบาหวานขึ้นจอประสาทตา (Diabetic Retinopathy) ประจำปี',
      preparationNotes: ['มีหยอดยาขยายม่านตา ควรมีญาติพามา ไม่ควรขับรถเอง'],
      status: 'completed',
      doctorFeedback: 'ผลตรวจจอประสาทตาทั้ง 2 ข้างปกติ ไม่พบภาวะเบาหวานขึ้นจอตา นัดติดตามผลอีก 1 ปี',
    }
  ];

  const alarms: ReminderAlarm[] = [
    {
      id: 'alm_1',
      title: 'ทานยา Metformin + Gliclazide มื้อเช้า',
      time: '08:00',
      type: 'medication',
      enabled: true,
      sound: true,
      days: [0, 1, 2, 3, 4, 5, 6],
      relatedId: 'med_1',
    },
    {
      id: 'alm_2',
      title: 'เจาะตรวจน้ำตาลหลังอาหารกลางวัน (2 ชม.)',
      time: '13:30',
      type: 'glucose',
      enabled: true,
      sound: true,
      days: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      id: 'alm_3',
      title: 'ฉีดอินซูลิน Lantus ก่อนนอน (14 ยูนิต)',
      time: '21:00',
      type: 'insulin',
      enabled: true,
      sound: true,
      days: [0, 1, 2, 3, 4, 5, 6],
      relatedId: 'med_3',
    },
    {
      id: 'alm_4',
      title: 'ดื่มน้ำแก้วที่ 4 และยืดเหยียดร่างกาย',
      time: '15:00',
      type: 'water',
      enabled: true,
      sound: false,
      days: [1, 2, 3, 4, 5],
    }
  ];

  return {
    profile: DEFAULT_PROFILE,
    glucoseLogs,
    medSchedules,
    medLogs,
    vitalsLogs,
    foodLogs,
    exerciseLogs,
    waterLogs,
    appointments,
    footCheckLogs,
    alarms,
  };
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateSeedData();
      saveAppData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppData;
    // ensure basic keys exist
    if (!parsed.profile || !parsed.glucoseLogs || !parsed.medSchedules) {
      const initial = generateSeedData();
      saveAppData(initial);
      return initial;
    }
    return parsed;
  } catch (e) {
    console.error('Error reading localStorage', e);
    const initial = generateSeedData();
    return initial;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
}

export function resetToSeedData(): AppData {
  const seed = generateSeedData();
  saveAppData(seed);
  return seed;
}
