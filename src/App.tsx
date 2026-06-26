import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardCheck,
  Plus,
  Train,
  ListTodo,
  Bug,
  FolderHeart,
  ChevronRight,
  ShieldPlus,
  ArrowRight,
  UserCheck,
  Calendar,
  Layers,
  ArrowLeft,
  Download,
  X,
  Database
} from 'lucide-react';
import { DbStore, CURRENT_USER, DEFAULT_STATIONS, safeLocalStorage } from './db';
import { Inspection, Remark, Photo, RemarkLog } from './types';
import { formatDateToRu } from './utils';

// Importing custom sub-components
import Header from './components/Header';
import CategoryManager from './components/CategoryManager';
import StationsList from './components/StationsList';
import DebugPanel from './components/DebugPanel';
import AllRemarks from './components/AllRemarks';
import InspectionDetail from './components/InspectionDetail';
import RemarkCard from './components/RemarkCard';
import InspectionCalendar from './components/InspectionCalendar';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    'home' | 'new_inspection' | 'inspection_details' | 'remark_card' | 'stations' | 'all_remarks' | 'debug' | 'category_manager'
  >('home');

  // Selected entities for deep screens
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [selectedRemarkId, setSelectedRemarkId] = useState<string | null>(null);
  const [backScreen, setBackScreen] = useState<'home' | 'all_remarks' | 'inspection_details' | 'stations'>('home');

  // DB Data in state
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [logs, setLogs] = useState<RemarkLog[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [inspectionTypes, setInspectionTypes] = useState<string[]>([]);

  // Form State: New Inspection
  const [newInspNumber, setNewInspNumber] = useState('');
  const [newInspDate, setNewInspDate] = useState(DbStore.getTodayString());
  const [newInspType, setNewInspType] = useState('Плановое обследование путей');
  const [newInspInspector, setNewInspInspector] = useState('Иванов С.П. (Начальник отдела)');
  const [newInspComment, setNewInspComment] = useState('');
  const [newInspError, setNewInspError] = useState('');
  const [allRemarksStatusFilter, setAllRemarksStatusFilter] = useState('');
  const [allRemarksStationFilter, setAllRemarksStationFilter] = useState('');
  const [allRemarksInspectorFilter, setAllRemarksInspectorFilter] = useState('');
  const [selectedInspectorFilter, setSelectedInspectorFilter] = useState('');
  const [autoBackupToast, setAutoBackupToast] = useState<{ filename: string; date: string } | null>(null);

  // Checks and triggers the scheduled 17:00 daily auto-backup dynamically
  const checkAutoBackup = () => {
    const rawNow = new Date();
    const currentHour = rawNow.getHours();
    
    // Check if daily system actual hour has passed 17:00
    if (currentHour >= 17) {
      const todayKey = rawNow.toISOString().slice(0, 10); // YYYY-MM-DD format
      const lastBackupDate = safeLocalStorage.getItem('LAST_AUTO_BACKUP_DATE');
      
      if (lastBackupDate !== todayKey) {
        try {
          const dataStr = DbStore.exportToJson();
          const backupData = JSON.parse(dataStr);
          
          // Store locally in automated snapshots list
          const backupsHistoryStr = safeLocalStorage.getItem('PORUCHENIYA_AUTO_BACKUPS_v1') || '[]';
          const backupsHistory = JSON.parse(backupsHistoryStr);
          
          if (!backupsHistory.some((b: any) => b.date === todayKey)) {
            backupsHistory.push({
              date: todayKey,
              time: `${rawNow.getHours()}:${rawNow.getMinutes().toString().padStart(2, '0')}`,
              filename: `rzhd_porucheniya_autobackup_${todayKey}_1700.json`,
              data: backupData
            });
            safeLocalStorage.setItem('PORUCHENIYA_AUTO_BACKUPS_v1', JSON.stringify(backupsHistory));
          }
          
          safeLocalStorage.setItem('LAST_AUTO_BACKUP_DATE', todayKey);
          
          // Trigger file download automatically
          const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const finalFilename = `rzhd_porucheniya_autobackup_${todayKey}_1700.json`;
          
          link.href = url;
          link.download = finalFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          setAutoBackupToast({ filename: finalFilename, date: todayKey });
        } catch (e) {
          console.error('Auto backup execution failed:', e);
        }
      }
    }
  };

  useEffect(() => {
    checkAutoBackup();
    const interval = setInterval(checkAutoBackup, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-reload on state modification
  const refreshFromDb = () => {
    // Sync automatic calculations like overdue statuses upon pulling cards from DB
    const loadedInspections = DbStore.getInspections();
    const loadedRemarks = DbStore.getRemarks();
    const loadedPhotos = DbStore.getPhotos();
    const loadedLogs = DbStore.getLogs();
    const loadedCategories = DbStore.getCategories();
    const loadedInspectionTypes = DbStore.getInspectionTypes();

    setInspections(loadedInspections);
    setRemarks(loadedRemarks);
    setPhotos(loadedPhotos);
    setLogs(loadedLogs);
    setCategories(loadedCategories);
    setInspectionTypes(loadedInspectionTypes);
  };

  useEffect(() => {
    DbStore.init();
    refreshFromDb();
    
    // Auto-generate a dummy inspection number for the form
    const randomNum = "ПР-" + Math.floor(100 + Math.random() * 900);
    setNewInspNumber(randomNum);

    const loadedInspectionTypes = DbStore.getInspectionTypes();
    if (loadedInspectionTypes.length > 0) {
      setNewInspType(loadedInspectionTypes[0]);
    }
  }, []);

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-generate next sequential inspection number from maximum found or default to ПР-503
    const maxNum = inspections.length > 0 ? Math.max(...inspections.map(i => {
      const parsed = parseInt((i.number || '').replace(/\D/g, ''), 10);
      return isNaN(parsed) ? 0 : parsed;
    })) + 1 : 503;
    const generatedNumber = `ПР-${maxNum}`;

    const created = DbStore.addInspection({
      number: generatedNumber,
      date: newInspDate,
      inspector: newInspInspector.trim() || 'Иванов С.П. (Начальник отдела)',
      inspectionType: newInspType,
      comment: newInspComment.trim()
    });

    // Reset Form values
    setNewInspComment('');
    setNewInspError('');

    // Reload state and immediately enter newly saved inspection detail view as specified
    refreshFromDb();
    setSelectedInspectionId(created.id);
    setCurrentScreen('inspection_details');
  };

  const handleSelectRemark = (remarkId: string, returnScreen: 'all_remarks' | 'inspection_details' | 'stations' = 'all_remarks') => {
    setSelectedRemarkId(remarkId);
    setBackScreen(returnScreen);
    setCurrentScreen('remark_card');
  };

  const handleSelectStationRemarks = (stationName: string, statusFilter: 'Выполнено' | 'Просрочено' | 'Активные' | '') => {
    // Filter remarks belonging to this station directly!
    let filteredRemarks = remarks.filter(r => r.station && r.station.trim().toLowerCase() === stationName.trim().toLowerCase());

    if (statusFilter === 'Просрочено') {
      filteredRemarks = filteredRemarks.filter(r => r.status === 'Просрочено');
    } else if (statusFilter === 'Выполнено') {
      filteredRemarks = filteredRemarks.filter(r => r.status === 'Выполнено');
    } else if (statusFilter === 'Активные') {
      filteredRemarks = filteredRemarks.filter(r => r.status === 'В работе' || r.status === 'На контроле');
    }

    // ТЗ requirement: if exactly 1 matching remark is filtered, immediately open its card
    if (filteredRemarks.length === 1) {
      setSelectedRemarkId(filteredRemarks[0].id);
      setBackScreen('stations');
      setCurrentScreen('remark_card');
    } else {
      setAllRemarksStationFilter(stationName);
      setAllRemarksStatusFilter(statusFilter);
      setBackScreen('stations');
      setCurrentScreen('all_remarks');
    }
  };

  // Dynamic list of unique inspectors
  const allInspectorsList = Array.from(new Set(inspections.map(i => i.inspector).filter(Boolean)));

  const filteredInspectionsForStats = selectedInspectorFilter
    ? inspections.filter(i => i.inspector === selectedInspectorFilter)
    : inspections;

  const filteredRemarksForStats = selectedInspectorFilter
    ? remarks.filter(r => {
        const parent = inspections.find(i => i.id === r.inspectionId);
        return parent?.inspector === selectedInspectorFilter;
      })
    : remarks;

  // Quick stats computed for dashboard cards
  const activeInspectionsCount = filteredInspectionsForStats.length;
  const totalRemarksCount = filteredRemarksForStats.length;
  const overdueRemarksCount = filteredRemarksForStats.filter(r => r.status === 'Просрочено').length;
  const activeRemarksCount = filteredRemarksForStats.filter(r => r.status === 'В работе' || r.status === 'На контроле').length;
  const completedRemarksCount = filteredRemarksForStats.filter(r => r.status === 'Выполнено').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased" id="tablet-viewport">
      {/* Upper Status strip / Branding */}
      <Header onGoHome={() => setCurrentScreen('home')} activeScreen={currentScreen} />

      {/* Main Container simulating interactive tablet frame layout */}
      <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto" id="tablet-main-stage">
        <AnimatePresence mode="wait">
          {currentScreen === 'home' && (
            <motion.div
              key="home-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
              id="home-workspace"
            >
              {/* Filter by Inspector at the very top of the workspace */}
              <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Фильтр статистики и реестра</h4>
                    <p className="text-xs text-slate-400">Выберите проверяющего для пересчета плиток и перехода в отчеты</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-750">Проверяющий:</span>
                  <select
                    value={selectedInspectorFilter}
                    onChange={(e) => setSelectedInspectorFilter(e.target.value)}
                    className="flex-grow sm:flex-grow-0 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="">Все проверяющие ({allInspectorsList.length})</option>
                    {allInspectorsList.map(ins => (
                      <option key={ins} value={ins}>{ins}</option>
                    ))}
                  </select>
                  {selectedInspectorFilter && (
                    <button
                      onClick={() => setSelectedInspectorFilter('')}
                      className="text-xs font-bold text-red-650 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition"
                    >
                      Сброс
                    </button>
                  )}
                </div>
              </div>

              {/* Dashboard visual stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="home-dashboard-widgets">
                {/* 1. Замечаний всего */}
                <button
                  onClick={() => {
                    setAllRemarksStatusFilter('');
                    setAllRemarksStationFilter('');
                    setAllRemarksInspectorFilter(selectedInspectorFilter);
                    setCurrentScreen('all_remarks');
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm flex flex-col justify-between text-left hover:border-slate-400 hover:shadow-md active:bg-slate-50 transition cursor-pointer group focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block group-hover:text-slate-600 transition-colors">Замечаний всего</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-extrabold text-slate-850 font-mono">{totalRemarksCount}</span>
                    <span className="text-xs text-slate-500">записано</span>
                  </div>
                </button>

                {/* 2. Активные замечания */}
                <button
                  onClick={() => {
                    setAllRemarksStatusFilter('Активные');
                    setAllRemarksStationFilter('');
                    setAllRemarksInspectorFilter(selectedInspectorFilter);
                    setCurrentScreen('all_remarks');
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm flex flex-col justify-between text-left hover:border-amber-450 hover:shadow-md active:bg-slate-50 transition cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block group-hover:text-amber-700 transition-colors">Активные замечания</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-extrabold text-amber-600 font-mono">{activeRemarksCount}</span>
                    <span className="text-xs text-slate-500">в работе</span>
                  </div>
                </button>

                {/* 3. Просрочено устранение */}
                <button
                  onClick={() => {
                    setAllRemarksStatusFilter('Просрочено');
                    setAllRemarksStationFilter('');
                    setAllRemarksInspectorFilter(selectedInspectorFilter);
                    setCurrentScreen('all_remarks');
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm flex flex-col justify-between text-left hover:border-red-400 hover:shadow-md active:bg-slate-50 transition cursor-pointer group focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <span className="text-xs font-semibold text-red-500 uppercase tracking-wider block group-hover:text-red-700 transition-colors">Просрочено устранение</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-extrabold text-red-600 font-mono animate-pulse">{overdueRemarksCount}</span>
                    <span className="text-xs text-red-500 font-black">Внимание</span>
                  </div>
                </button>

                {/* 4. Устранено в срок */}
                <button
                  onClick={() => {
                    setAllRemarksStatusFilter('Выполнено');
                    setAllRemarksStationFilter('');
                    setAllRemarksInspectorFilter(selectedInspectorFilter);
                    setCurrentScreen('all_remarks');
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm flex flex-col justify-between text-left hover:border-blue-400 hover:shadow-md active:bg-slate-50 transition cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block group-hover:text-blue-800 transition-colors">Устранено в срок</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-extrabold text-blue-700 font-mono">{completedRemarksCount}</span>
                    <span className="text-xs text-slate-500">закрыто</span>
                  </div>
                </button>
              </div>

              {/* Grid 4-Button tablet layout strictly configured */}
              {/* ТЗ: Главный экран. Отображаются кнопки: 1. Новая проверка, 2. Станции, 3. Все замечания, 4. Отладка (служебный режим) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="home-navigation-grid">
                {/* 1. Новая проверка */}
                <button
                  onClick={() => setCurrentScreen('new_inspection')}
                  className="bg-white border hover:border-red-500 rounded-2xl p-6 shadow-sm hover:shadow-md transition text-left group flex items-start space-x-5"
                  id="btn-nav-new-inspection"
                >
                  <div className="p-4 bg-red-105 text-red-650 rounded-xl group-hover:scale-105 transition-transform">
                    <ShieldPlus className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-red-650 transition-colors">1. Новая проверка</h3>
                    <p className="text-sm text-slate-500 leading-snug">
                      Открыть сессию контроля. Заполнить реквизиты, выбрать железнодорожную станцию и перейти к регистрации нарушений.
                    </p>
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-red-600 pt-1 group-hover:underline">
                      <span>Начать оформление</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>

                {/* 2. Станции */}
                <button
                  onClick={() => setCurrentScreen('stations')}
                  className="bg-white border hover:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition text-left group flex items-start space-x-5"
                  id="btn-nav-stations"
                >
                  <div className="p-4 bg-slate-100 text-slate-700 rounded-xl group-hover:scale-105 transition-transform">
                    <Train className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-slate-850 transition-colors">2. Станции</h3>
                    <p className="text-sm text-slate-500 leading-snug">
                      Реестр станций с агрегированными показателями по проверкам, нарушениям сроков и устраненным дефектам.
                    </p>
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700 pt-1 group-hover:underline">
                      <span>Просмотреть станции</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>

                {/* 3. Все замечания */}
                <button
                  onClick={() => setCurrentScreen('all_remarks')}
                  className="bg-white border hover:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition text-left group flex items-start space-x-5"
                  id="btn-nav-all-remarks"
                >
                  <div className="p-4 bg-slate-100 text-slate-700 rounded-xl group-hover:scale-105 transition-transform">
                    <ListTodo className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-slate-850 transition-colors">3. Все замечания ({totalRemarksCount})</h3>
                    <p className="text-sm text-slate-500 leading-snug">
                      Единая база результатов проверок с подробными фильтрами по статусам, ответственным, датам и полнотекстовым поиском.
                    </p>
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700 pt-1 group-hover:underline">
                      <span>Открыть реестр нарушений</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>

                {/* 4. Отладка (служебный режим) */}
                <button
                  onClick={() => setCurrentScreen('debug')}
                  className="bg-white border hover:border-indigo-650 rounded-2xl p-6 shadow-sm hover:shadow-md transition text-left group flex items-start space-x-5"
                  id="btn-nav-debug"
                >
                  <div className="p-4 bg-indigo-50 text-indigo-700 rounded-xl group-hover:scale-105 transition-transform">
                    <Bug className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-650 transition-colors">4. Отладка (служебный режим)</h3>
                    <p className="text-sm text-slate-500 leading-snug">
                      Резервное копирование (JSON импорт/экспорт), принудительный сброс данных и автоматическое наполнение демонстрационной базой.
                    </p>
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-700 pt-1 group-hover:underline">
                      <span>Перейти в отладку</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              </div>

              {/* Sub-bar for Editable Categories */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white border border-slate-205 rounded-2xl shadow-sm gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                    <FolderHeart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Редактировать справочник категорий</h4>
                    <p className="text-xs text-slate-400">Справочник используется при классификации замечаний в полевых условиях</p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentScreen('category_manager')}
                  className="bg-slate-105 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs transition"
                  id="btn-go-categories-manager"
                >
                  Редактировать категории
                </button>
              </div>

              {/* Active Calendar & Inspection Registry Component */}
              <InspectionCalendar
                inspections={inspections}
                remarks={remarks}
                onSelectInspection={(id) => {
                  setSelectedInspectionId(id);
                  setCurrentScreen('inspection_details');
                }}
                onCreateNewOnDate={(dateStr) => {
                  setNewInspDate(dateStr);
                  setCurrentScreen('new_inspection');
                }}
              />
            </motion.div>
          )}

          {currentScreen === 'new_inspection' && (
            <motion.div
              key="new-inspection-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
              id="new-inspection-workspace"
            >
              {/* Back Link */}
              <div>
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold"
                  id="btn-back-from-new"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Вернуться на главную</span>
                </button>
              </div>

              {/* Form setup conforming to 'Карточка проверки содержит' */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-2xl mx-auto">
                <div className="bg-slate-900 text-white p-6">
                  <h3 className="text-lg font-bold">Оформление акта Новой Проверки</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    После сохранения откроется экран детализации для внесения подробных фотозамечаний.
                  </p>
                </div>

                <form onSubmit={handleCreateInspection} className="p-6 space-y-5" id="new-inspection-form">
                  {newInspError && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-lg text-xs font-semibold border border-red-100">
                      {newInspError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Дата проверки */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Дата проверки *</label>
                      <input
                        type="date"
                        required
                        value={newInspDate}
                        onChange={(e) => setNewInspDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>

                    {/* Вид проверки */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Вид проводимой проверки</label>
                      <select
                        value={newInspType}
                        onChange={(e) => setNewInspType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                      >
                        {inspectionTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Проверяющий */}
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Проверяющий (Свободное поле) *</label>
                      <input
                        type="text"
                        required
                        value={newInspInspector}
                        onChange={(e) => setNewInspInspector(e.target.value)}
                        placeholder="Введите ФИО и должность проверяющего..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                        id="new-insp-inspector-field"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Укажите ФИО и должность лица, проводящего данную проверку.
                      </span>
                    </div>
                  </div>

                  {/* Комментарий */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Комментарий к проверке</label>
                    <textarea
                      rows={3}
                      value={newInspComment}
                      onChange={(e) => setNewInspComment(e.target.value)}
                      placeholder="Укажите дополнительные ориентиры, погодные условия или задачи выезда..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>

                  <div className="bg-slate-50 -mx-6 -mb-6 p-4 border-t border-slate-200 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setCurrentScreen('home')}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-4 py-2.5 rounded-lg text-xs"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2.5 rounded-lg text-xs flex items-center space-x-1 shadow-sm"
                      id="btn-save-new-inspection"
                    >
                      <span>Создать и продолжить</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {currentScreen === 'inspection_details' && selectedInspectionId && inspections.some(i => i.id === selectedInspectionId) && (
            <motion.div
              key="inspection-details-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <InspectionDetail
                inspection={inspections.find(i => i.id === selectedInspectionId)!}
                remarks={remarks}
                photos={photos}
                onBack={() => setCurrentScreen('home')}
                onSelectRemark={(remId) => handleSelectRemark(remId, 'inspection_details')}
                onRefreshData={refreshFromDb}
                categories={categories}
              />
            </motion.div>
          )}

          {currentScreen === 'remark_card' && selectedRemarkId && remarks.some(r => r.id === selectedRemarkId) && (
            <motion.div
              key="remark-card-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RemarkCard
                remark={remarks.find(r => r.id === selectedRemarkId)!}
                photos={photos}
                logs={logs}
                inspections={inspections}
                onBack={() => {
                  if (backScreen === 'inspection_details') {
                    setCurrentScreen('inspection_details');
                  } else if (backScreen === 'stations') {
                    setCurrentScreen('stations');
                  } else {
                    setCurrentScreen('all_remarks');
                  }
                }}
                onRefreshData={refreshFromDb}
                categories={categories}
              />
            </motion.div>
          )}

          {currentScreen === 'stations' && (
            <motion.div
              key="stations-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              id="stations-view-stage"
            >
              <div className="mb-4">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold"
                  id="btn-back-stations"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>На главную</span>
                </button>
              </div>
              <StationsList
                onSelectInspection={(inspId) => {
                  setSelectedInspectionId(inspId);
                  setCurrentScreen('inspection_details');
                }}
                onSelectStationRemarks={(stName, statFilt) => {
                  handleSelectStationRemarks(stName, statFilt || '');
                }}
              />
            </motion.div>
          )}

          {currentScreen === 'all_remarks' && (
            <motion.div
              key="all-remarks-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="all-remarks-view-stage"
            >
              <div className="mb-4">
                <button
                  onClick={() => {
                    if (backScreen === 'stations') {
                      setCurrentScreen('stations');
                    } else {
                      setCurrentScreen('home');
                    }
                  }}
                  className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold"
                  id="btn-back-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{backScreen === 'stations' ? 'Вернуться к станциям' : 'На главную'}</span>
                </button>
              </div>
              <AllRemarks
                remarks={remarks}
                inspections={inspections}
                onSelectRemark={(remId) => handleSelectRemark(remId, 'all_remarks')}
                initialStatusFilter={allRemarksStatusFilter}
                onClearInitialStatus={() => setAllRemarksStatusFilter('')}
                initialStationFilter={allRemarksStationFilter}
                onClearInitialStation={() => setAllRemarksStationFilter('')}
                initialInspectorFilter={allRemarksInspectorFilter}
                onClearInitialInspector={() => setAllRemarksInspectorFilter('')}
              />
            </motion.div>
          )}

          {currentScreen === 'debug' && (
            <motion.div
              key="debug-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold"
                  id="btn-back-debug"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>На главную</span>
                </button>
              </div>
              <DebugPanel onRefreshData={refreshFromDb} />
            </motion.div>
          )}

          {currentScreen === 'category_manager' && (
            <motion.div
              key="category-manager-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold"
                  id="btn-back-cat"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>На главную</span>
                </button>
              </div>
              <CategoryManager categories={categories} onChanged={refreshFromDb} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer layout bar */}
      <footer className="bg-slate-900 border-t border-slate-850 py-4 px-6 text-slate-400 text-center text-xs mt-auto font-mono" id="app-footer">
        © 2026 РЖД Департамент пути и сооружений. Система регистрации замечаний. Служба главного инженера.
      </footer>

      <AnimatePresence>
        {autoBackupToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white border border-rose-900/60 rounded-xl p-4 shadow-xl flex items-start space-x-3"
            id="toast-auto-backup"
          >
            <div className="p-2 bg-emerald-650 rounded-lg text-white">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-100">Авторезервирование ОАО «РЖД»</h4>
              <p className="text-xs text-slate-300 mt-1">Система автоматически создала резервную копию базы данных в 17:00.</p>
              <p className="text-[10px] font-mono text-emerald-400 mt-0.5 break-all">{autoBackupToast.filename}</p>
              
              <div className="mt-3 flex items-center space-x-2">
                <button
                  onClick={() => {
                    const dataStr = DbStore.exportToJson();
                    const url = URL.createObjectURL(new Blob([dataStr], { type: 'application/json' }));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = autoBackupToast.filename;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-emerald-650 hover:bg-emerald-705 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition"
                >
                  <Download className="w-3 h-3" />
                  <span>Скачать повторно</span>
                </button>
                <button
                  onClick={() => setAutoBackupToast(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] px-2.5 py-1.5 rounded-lg cursor-pointer transition"
                >
                  Закрыть
                </button>
              </div>
            </div>
            <button
              onClick={() => setAutoBackupToast(null)}
              className="text-slate-400 hover:text-white transition p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
