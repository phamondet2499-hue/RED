import { useState, useEffect } from 'react';
import { AppData, GlucoseRecord, MedicationSchedule, MedicationLog, FoodRecord, VitalsRecord, ExerciseRecord, FootCheckRecord, DoctorAppointment, ReminderAlarm, UserProfile } from './types';
import { loadAppData, saveAppData, resetToSeedData } from './utils/storage';
import { soundFx } from './utils/sound';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { GlucoseView } from './components/GlucoseView';
import { MedicationInsulinView } from './components/MedicationInsulinView';
import { InsightsView } from './components/InsightsView';
import { FoodCarbView } from './components/FoodCarbView';
import { AppointmentsView } from './components/AppointmentsView';
import { DoctorDashboardView } from './components/DoctorDashboardView';
import { SelfCareView } from './components/SelfCareView';
import { SettingsView } from './components/SettingsView';
import { HypoEmergencyModal } from './components/HypoEmergencyModal';
import { AlarmAlertModal } from './components/AlarmAlertModal';
import { QuickLogModal } from './components/QuickLogModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ShareExportModal } from './components/ShareExportModal';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isHypoModalOpen, setIsHypoModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<ReminderAlarm | null>(null);
  const [quickLogType, setQuickLogType] = useState<'glucose' | 'medication' | 'vitals' | 'food' | 'appointment' | null>(null);

  // Sync state to local storage whenever data changes
  const updateData = (updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveAppData(next);
      return next;
    });
  };

  // Background checker for alarms every 30 seconds
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMins = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${currentHours}:${currentMins}`;
      const dayOfWeek = now.getDay();

      const matchingAlarm = data.alarms.find(
        (a) => a.enabled && a.time === timeStr && a.days.includes(dayOfWeek)
      );

      if (matchingAlarm && (!activeAlarm || activeAlarm.id !== matchingAlarm.id)) {
        setActiveAlarm(matchingAlarm);
        if (matchingAlarm.sound) {
          soundFx.playMedicationChime();
        }
      }
    };

    const interval = setInterval(checkAlarms, 30000);
    return () => clearInterval(interval);
  }, [data.alarms, activeAlarm]);

  // Handler: Add Glucose
  const handleAddGlucose = (record: Omit<GlucoseRecord, 'id'>) => {
    const newRecord: GlucoseRecord = {
      ...record,
      id: `gl_${Date.now()}`,
    };
    updateData((prev) => ({
      ...prev,
      glucoseLogs: [newRecord, ...prev.glucoseLogs],
    }));

    // If hypo, automatically suggest opening the 15-15 rule
    if (newRecord.value < 70) {
      setIsHypoModalOpen(true);
      soundFx.playEmergencyAlarm();
    }
  };

  // Handler: Delete Glucose
  const handleDeleteGlucose = (id: string) => {
    updateData((prev) => ({
      ...prev,
      glucoseLogs: prev.glucoseLogs.filter((g) => g.id !== id),
    }));
  };

  // Handler: Add Medication Schedule
  const handleAddMedSchedule = (schedule: Omit<MedicationSchedule, 'id'>) => {
    const newSchedule: MedicationSchedule = {
      ...schedule,
      id: `med_${Date.now()}`,
    };
    updateData((prev) => ({
      ...prev,
      medSchedules: [...prev.medSchedules, newSchedule],
    }));
  };

  // Handler: Delete Medication Schedule
  const handleDeleteMedSchedule = (id: string) => {
    updateData((prev) => ({
      ...prev,
      medSchedules: prev.medSchedules.filter((s) => s.id !== id),
    }));
  };

  // Handler: Log Medication Take / Injection
  const handleLogMedication = (log: Omit<MedicationLog, 'id'>) => {
    const newLog: MedicationLog = {
      ...log,
      id: `ml_${Date.now()}`,
    };
    updateData((prev) => {
      // Also decrement stock if oral/dose
      const updatedSchedules = prev.medSchedules.map((s) => {
        if (s.id === log.scheduleId && s.currentStock > 0) {
          return { ...s, currentStock: s.currentStock - 1 };
        }
        return s;
      });

      return {
        ...prev,
        medLogs: [newLog, ...prev.medLogs],
        medSchedules: updatedSchedules,
      };
    });
  };

  // Handler: Quick Toggle Medication checkbox from Dashboard
  const handleQuickToggleMed = (scheduleId: string, time: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = data.medLogs.find(
      (l) => l.scheduleId === scheduleId && l.date === todayStr && l.scheduledTime === time && l.status === 'taken'
    );

    if (existing) {
      // Remove
      updateData((prev) => ({
        ...prev,
        medLogs: prev.medLogs.filter((l) => l.id !== existing.id),
      }));
    } else {
      // Add
      const sch = data.medSchedules.find((s) => s.id === scheduleId);
      if (!sch) return;
      handleLogMedication({
        scheduleId: sch.id,
        medName: sch.name,
        type: sch.type,
        dose: sch.dose,
        date: todayStr,
        scheduledTime: time,
        takenTime: new Date().toTimeString().slice(0, 5),
        status: 'taken',
      });
    }
  };

  // Handler: Water
  const handleLogWater = (amountMl: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    updateData((prev) => {
      const existing = prev.waterLogs.find((w) => w.date === todayStr);
      let updatedWater: typeof prev.waterLogs;
      if (existing) {
        updatedWater = prev.waterLogs.map((w) =>
          w.date === todayStr ? { ...w, amountMl: w.amountMl + amountMl } : w
        );
      } else {
        updatedWater = [...prev.waterLogs, { id: `w_${Date.now()}`, date: todayStr, amountMl }];
      }
      return { ...prev, waterLogs: updatedWater };
    });
  };

  // Handler: Add Food
  const handleAddFood = (food: Omit<FoodRecord, 'id'>) => {
    const newFood: FoodRecord = { ...food, id: `food_${Date.now()}` };
    updateData((prev) => ({ ...prev, foodLogs: [newFood, ...prev.foodLogs] }));
  };

  // Handler: Delete Food
  const handleDeleteFood = (id: string) => {
    updateData((prev) => ({
      ...prev,
      foodLogs: prev.foodLogs.filter((f) => f.id !== id),
    }));
  };

  // Handler: Add Exercise
  const handleAddExercise = (ex: Omit<ExerciseRecord, 'id'>) => {
    const newEx: ExerciseRecord = { ...ex, id: `ex_${Date.now()}` };
    updateData((prev) => ({ ...prev, exerciseLogs: [newEx, ...prev.exerciseLogs] }));
  };

  // Handler: Delete Exercise
  const handleDeleteExercise = (id: string) => {
    updateData((prev) => ({
      ...prev,
      exerciseLogs: prev.exerciseLogs.filter((e) => e.id !== id),
    }));
  };

  // Handler: Save Foot Check
  const handleSaveFootCheck = (check: Omit<FootCheckRecord, 'id'>) => {
    updateData((prev) => {
      const filtered = prev.footCheckLogs.filter((f) => f.date !== check.date);
      return {
        ...prev,
        footCheckLogs: [{ ...check, id: `fc_${Date.now()}` }, ...filtered],
      };
    });
  };

  // Handler: Add Vitals
  const handleAddVitals = (vitals: Omit<VitalsRecord, 'id'>) => {
    const newVitals: VitalsRecord = { ...vitals, id: `vit_${Date.now()}` };
    updateData((prev) => ({ ...prev, vitalsLogs: [newVitals, ...prev.vitalsLogs] }));
  };

  // Handler: Add Doctor Appointment
  const handleAddAppointment = (appt: Omit<DoctorAppointment, 'id'>) => {
    const newAppt: DoctorAppointment = { ...appt, id: `appt_${Date.now()}` };
    updateData((prev) => ({ ...prev, appointments: [...prev.appointments, newAppt] }));
  };

  // Handler: Delete Appointment
  const handleDeleteAppointment = (id: string) => {
    updateData((prev) => ({
      ...prev,
      appointments: prev.appointments.filter((a) => a.id !== id),
    }));
  };

  // Handler: Update Appointment Status / Doctor Feedback
  const handleUpdateAppointmentStatus = (
    id: string,
    status: 'upcoming' | 'completed' | 'cancelled',
    feedback?: string
  ) => {
    updateData((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) =>
        a.id === id ? { ...a, status, doctorFeedback: feedback || a.doctorFeedback } : a
      ),
    }));
  };

  // Handler: Save Profile
  const handleSaveProfile = (profile: UserProfile) => {
    updateData((prev) => ({ ...prev, profile }));
  };

  // Handler: Save Alarms
  const handleSaveAlarms = (alarms: ReminderAlarm[]) => {
    updateData((prev) => ({ ...prev, alarms }));
  };

  // Handler: Reset to Seed Data
  const handleResetData = () => {
    const seed = resetToSeedData();
    setData(seed);
    soundFx.playSuccessTone();
  };

  // Handler: Import JSON
  const handleImportData = (imported: AppData) => {
    setData(imported);
    saveAppData(imported);
    soundFx.playSuccessTone();
  };

  // Next upcoming appointment for header
  const todayStr = new Date().toISOString().split('T')[0];
  const nextAppointment = data.appointments
    .filter((a) => a.date >= todayStr && a.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  // Count pending medications for badge
  const activeSchedules = data.medSchedules.filter((s) => s.isActive);
  const totalDoses = activeSchedules.reduce((sum, s) => sum + s.times.length, 0);
  const takenDoses = data.medLogs.filter((l) => l.date === todayStr && l.status === 'taken').length;
  const pendingMedsCount = Math.max(0, totalDoses - takenDoses);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      {/* Top Application Header */}
      <Header
        profile={data.profile}
        nextAppointment={nextAppointment}
        onOpenHypoModal={() => setIsHypoModalOpen(true)}
        onOpenAppointments={() => setCurrentTab('appointments')}
        onOpenSettings={() => setCurrentTab('settings')}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        activeAlarmsCount={data.alarms.filter((a) => a.enabled).length}
      />

      {/* Main Tab Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        pendingMedsCount={pendingMedsCount}
      />

      {/* Main View Body */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
        {currentTab === 'dashboard' && (
          <DashboardView
            data={data}
            onNavigate={setCurrentTab}
            onLogWater={handleLogWater}
            onQuickToggleMed={handleQuickToggleMed}
            onOpenQuickLogModal={setQuickLogType}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        )}

        {currentTab === 'glucose' && (
          <GlucoseView
            records={data.glucoseLogs}
            onAddRecord={handleAddGlucose}
            onDeleteRecord={handleDeleteGlucose}
          />
        )}

        {currentTab === 'medication' && (
          <MedicationInsulinView
            schedules={data.medSchedules}
            logs={data.medLogs}
            onAddSchedule={handleAddMedSchedule}
            onDeleteSchedule={handleDeleteMedSchedule}
            onLogMedication={handleLogMedication}
            onToggleScheduleActive={() => {}}
            profile={data.profile}
            glucoseLogs={data.glucoseLogs}
            vitalsLogs={data.vitalsLogs}
            onUpdateProfile={handleSaveProfile}
          />
        )}

        {currentTab === 'insights' && (
          <InsightsView
            data={data}
            onNavigateToMedication={() => setCurrentTab('medication')}
            onNavigateToGlucose={() => setCurrentTab('glucose')}
          />
        )}

        {currentTab === 'food' && (
          <FoodCarbView
            logs={data.foodLogs}
            onAddFood={handleAddFood}
            onDeleteFood={handleDeleteFood}
            dailyTargetGrams={data.profile.carbDailyTargetGrams || 135}
          />
        )}

        {currentTab === 'appointments' && (
          <AppointmentsView
            appointments={data.appointments}
            onAddAppointment={handleAddAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onUpdateStatus={handleUpdateAppointmentStatus}
          />
        )}

        {currentTab === 'selfcare' && (
          <SelfCareView
            waterLogs={data.waterLogs}
            exerciseLogs={data.exerciseLogs}
            footLogs={data.footCheckLogs}
            vitalsLogs={data.vitalsLogs}
            dailyWaterTarget={data.profile.waterDailyTargetMl || 2000}
            onAddWater={handleLogWater}
            onAddExercise={handleAddExercise}
            onDeleteExercise={handleDeleteExercise}
            onSaveFootCheck={handleSaveFootCheck}
            onAddVitals={handleAddVitals}
          />
        )}

        {currentTab === 'doctor' && (
          <DoctorDashboardView 
            data={data} 
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            profile={data.profile}
            alarms={data.alarms}
            onSaveProfile={handleSaveProfile}
            onSaveAlarms={handleSaveAlarms}
            onResetData={handleResetData}
            fullData={data}
            onImportData={handleImportData}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        )}
      </main>

      {/* Share & Export Files Modal */}
      <ShareExportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={data}
        onNavigateToDoctorReport={() => setCurrentTab('doctor')}
      />

      {/* PWA Installation Instructions Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Offline Connectivity Indicator Banner */}
      <OfflineIndicator />

      {/* Hypo Emergency 15-15 Rule Modal */}
      <HypoEmergencyModal
        isOpen={isHypoModalOpen}
        onClose={() => setIsHypoModalOpen(false)}
        emergencyContactName={data.profile.emergencyContactName}
        emergencyContactPhone={data.profile.emergencyContactPhone}
        onLogGlucose={(val) => {
          handleAddGlucose({
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5),
            period: 'during_hypo',
            value: val,
            note: 'เจาะตรวจหลังปฏิบัติตามกฎ 15-15',
          });
        }}
      />

      {/* Active Alarm Notification Modal */}
      <AlarmAlertModal
        alarm={activeAlarm}
        onDismiss={() => setActiveAlarm(null)}
        onTakeAction={(alarm) => {
          setActiveAlarm(null);
          if (alarm.relatedId) {
            const sch = data.medSchedules.find((s) => s.id === alarm.relatedId);
            if (sch) {
              handleQuickToggleMed(sch.id, sch.times[0] || alarm.time);
            }
          }
        }}
      />

      {/* Quick Action Logging Modal */}
      <QuickLogModal
        type={quickLogType}
        onClose={() => setQuickLogType(null)}
        medSchedules={data.medSchedules}
        onAddGlucose={handleAddGlucose}
        onAddMedLog={handleLogMedication}
        onAddFood={handleAddFood}
        onAddVitals={handleAddVitals}
        onAddAppointment={handleAddAppointment}
      />

    </div>
  );
}
