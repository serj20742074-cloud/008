import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  Plus,
  Eye,
  User,
  ClipboardList,
  Filter
} from 'lucide-react';
import { Inspection, Remark } from '../types';
import { formatDateToRu } from '../utils';

interface InspectionCalendarProps {
  inspections: Inspection[];
  remarks: Remark[];
  onSelectInspection: (id: string) => void;
  onCreateNewOnDate: (dateStr: string) => void;
}

export default function InspectionCalendar({
  inspections,
  remarks,
  onSelectInspection,
  onCreateNewOnDate
}: InspectionCalendarProps) {
  // Use actual dynamic today's date context
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [activeTab, setActiveTab] = useState<'calendar' | 'registry'>('calendar');

  // Search filter for all inspections registry
  const [registrySearch, setRegistrySearch] = useState('');
  const [registryTypeFilter, setRegistryTypeFilter] = useState('');

  // Localized Russian calendar names
  const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Total days in current chosen month
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Find weekday of the first day in month (1-based index conversion to standard Mon-Sun)
  const startDayOffset = useMemo(() => {
    // getDay() is 0 for Sunday, 1 for Monday...
    let day = new Date(currentYear, currentMonth, 1).getDay();
    // Convert to Mon=0, Tue=1 ... Sun=6
    return day === 0 ? 6 : day - 1;
  }, [currentYear, currentMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Helper date-string builder (YYYY-MM-DD)
  const getDateString = (dayNum: number): string => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  // Check how many inspections exist on a date-string
  const inspectionsByDate = useMemo(() => {
    const map: Record<string, Inspection[]> = {};
    inspections.forEach(insp => {
      if (!map[insp.date]) {
        map[insp.date] = [];
      }
      map[insp.date].push(insp);
    });
    return map;
  }, [inspections]);

  // Remarks count cached by Inspection Id
  const remarkCountByInspId = useMemo(() => {
    const map: Record<string, number> = {};
    remarks.forEach(rem => {
      map[rem.inspectionId] = (map[rem.inspectionId] || 0) + 1;
    });
    return map;
  }, [remarks]);

  // Remarks grouped by Inspection Id
  const stationsByInspId = useMemo(() => {
    const map: Record<string, string[]> = {};
    remarks.forEach(rem => {
      if (!map[rem.inspectionId]) {
        map[rem.inspectionId] = [];
      }
      if (rem.station && !map[rem.inspectionId].includes(rem.station)) {
        map[rem.inspectionId].push(rem.station);
      }
    });
    return map;
  }, [remarks]);

  // Filtered list of all inspections for the registry tab
  const filteredAllInspections = useMemo(() => {
    return inspections.filter(insp => {
      const matchSearch = 
        (insp.number || '').toLowerCase().includes(registrySearch.toLowerCase()) ||
        (insp.inspector || '').toLowerCase().includes(registrySearch.toLowerCase()) ||
        (insp.inspectionType || '').toLowerCase().includes(registrySearch.toLowerCase()) ||
        (insp.comment || '').toLowerCase().includes(registrySearch.toLowerCase());

      const matchType = registryTypeFilter === '' || insp.inspectionType === registryTypeFilter;

      return matchSearch && matchType;
    }).reverse(); // Latest inspections first
  }, [inspections, registrySearch, registryTypeFilter]);

  // Unique list of all inspection types across the dataset for dropdown filter
  const uniqueInspectionTypes = useMemo(() => {
    return Array.from(new Set(inspections.map(i => i.inspectionType).filter(Boolean)));
  }, [inspections]);

  // Selected date's list of inspections
  const selectedDateInspections = inspectionsByDate[selectedDateStr] || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-205 shadow-sm overflow-hidden" id="inspections-calendar-registry-panel">
      {/* Header bar and Switch tabs */}
      <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-1">
          <h2 className="text-md font-bold flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-red-500" />
            <span>Календарь и реестр проверок</span>
          </h2>
          <p className="text-xs text-slate-300">
            Просматривайте график проведения обследований инфраструктуры ОАО «РЖД» и управляйте ими.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'calendar' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Интерактивный календарь</span>
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'registry' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Все проверки в целом ({inspections.length})</span>
          </button>
        </div>
      </div>

      <div className="p-5">
        {activeTab === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Calendar grid view component (8 cols on lg) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                    РЖД Текущая дата: {today.getDate()} {['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'][today.getMonth()]} {today.getFullYear()} г.
                  </span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition"
                    title="Предыдущий месяц"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setCurrentMonth(today.getMonth());
                      setCurrentYear(today.getFullYear());
                      setSelectedDateStr(todayStr);
                    }}
                    className="text-xs font-bold px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition"
                  >
                    Текущий
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition"
                    title="Следующий месяц"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day names line */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 font-sans">
                {WEEKDAYS.map((w, idx) => (
                  <div key={idx} className={idx >= 5 ? 'text-red-500/80' : ''}>{w}</div>
                ))}
              </div>

              {/* Calendar cells grid */}
              <div className="grid grid-cols-7 gap-1.5" id="calendar-days-layout">
                {/* Pad leading days with empty space */}
                {Array.from({ length: startDayOffset }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square bg-slate-50/50 rounded-xl border border-slate-100/50"></div>
                ))}

                {/* Actual days of the month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = getDateString(dayNum);
                  const daysInspections = inspectionsByDate[dateStr] || [];
                  const isSelected = selectedDateStr === dateStr;
                  const isToday = dateStr === todayStr;

                  return (
                    <button
                      key={`day-${dayNum}`}
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={`aspect-square relative rounded-xl border p-1 text-left flex flex-col justify-between transition group cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md z-10'
                          : isToday
                          ? 'bg-red-50/70 border-red-500 text-slate-900 font-extrabold hover:bg-red-50'
                          : daysInspections.length > 0
                          ? 'bg-emerald-50/70 border-emerald-300 text-slate-800 hover:bg-emerald-100/80 hover:border-emerald-400'
                          : 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {/* Day Number */}
                      <span className="text-xs font-bold leading-none">
                        {dayNum}
                      </span>

                      {/* Info marker inside the cell */}
                      <div className="flex flex-wrap gap-0.5 justify-end">
                        {isToday && !isSelected && (
                          <span className="text-[8px] bg-red-600 text-white px-1 leading-none rounded-sm font-semibold mb-0.5">
                            Сегодня
                          </span>
                        )}

                        {daysInspections.length > 0 && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-white text-slate-900' : 'bg-emerald-600 text-white'
                          }`} title={`Проверок: ${daysInspections.length}`}>
                            {daysInspections.length}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend instruction */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-[11px] text-slate-400 font-medium">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 bg-white border border-slate-200 rounded"></span>
                  <span>Без проверок</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 bg-emerald-50 border border-emerald-300 rounded"></span>
                  <span>Были проверки</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 bg-red-50 border border-red-500 rounded"></span>
                  <span>15 июня 2026 (Сегодня)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 bg-slate-900 rounded"></span>
                  <span>Выбранная дата</span>
                </div>
              </div>
            </div>

            {/* Inspections list container for chosen day (5 cols on lg) */}
            <div className="lg:col-span-5 border-l border-slate-150 lg:pl-6 space-y-4">
              <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Проверки на дату
                  </h3>
                  <p className="text-sm font-bold text-slate-600 font-mono">
                    {selectedDateStr.split('-').reverse().join('.')}
                  </p>
                </div>
                {selectedDateInspections.length > 0 && (
                  <span className="bg-slate-100 text-slate-800 text-xs font-mono font-bold px-2 py-1 rounded-lg">
                    Найдено: {selectedDateInspections.length}
                  </span>
                )}
              </div>

              {selectedDateInspections.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-2xl text-center space-y-4">
                  <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Проверок в этот день не проводилось</p>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Вы можете быстро создать запись об обследовании путей, привязанную к этой дате.
                    </p>
                  </div>
                  <button
                    onClick={() => onCreateNewOnDate(selectedDateStr)}
                    className="mx-auto bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1 shadow-sm"
                    id={`btn-calendar-add-on-${selectedDateStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить проверку</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1" id="calendar-day-inspections">
                  {selectedDateInspections.map((insp) => {
                    const remsCount = remarkCountByInspId[insp.id] || 0;
                    const stations = stationsByInspId[insp.id] || [];

                    return (
                      <div
                        key={insp.id}
                        onClick={() => onSelectInspection(insp.id)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3.5 transition cursor-pointer group flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="bg-red-105 text-red-650 font-bold font-mono text-xs px-2.5 py-0.5 rounded border border-red-150">
                              № {insp.number}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">
                              {formatDateToRu(insp.date)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs line-clamp-1 group-hover:text-red-600 transition-colors">
                              {insp.inspectionType}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono font-medium truncate mt-0.5">
                              Проверяющий: {insp.inspector}
                            </p>
                          </div>
                          {insp.comment && (
                            <p className="text-[11px] text-slate-600 italic bg-white p-1.5 rounded border border-slate-150 line-clamp-2">
                              «{insp.comment}»
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-150 text-[11px]">
                          <span className="text-slate-400">
                            Станции: {stations.length > 0 ? (
                              <strong className="text-slate-700">{stations.join(', ')}</strong>
                            ) : (
                              <em className="text-slate-400">не зарегистрировано</em>
                            )}
                          </span>
                          <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                            <span>Замечаний: {remsCount}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* General Inspections Registry View Component */
          <div className="space-y-4" id="inspections-general-registry">
            {/* Filter controls */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Поиск по номеру, составителю или по тексту..."
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <select
                  value={registryTypeFilter}
                  onChange={(e) => setRegistryTypeFilter(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="">Все виды проверок ({uniqueInspectionTypes.length})</option>
                  {uniqueInspectionTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end items-center text-xs font-bold text-slate-400">
                <span>Отображено: <strong className="text-slate-800">{filteredAllInspections.length}</strong> проверок</span>
              </div>
            </div>

            {/* List of inspections */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-sans font-bold border-b border-slate-200">
                    <th className="p-3 border-r border-slate-200">№ Проверки</th>
                    <th className="p-3 border-r border-slate-200">Дата</th>
                    <th className="p-3 border-r border-slate-200 font-sans">Вид обследования</th>
                    <th className="p-3 border-r border-slate-200">ФИО инспектора</th>
                    <th className="p-3 border-r border-slate-200 font-sans">Присутствующие станции</th>
                    <th className="p-3 border-r border-slate-200 text-center">Замечаний</th>
                    <th className="p-3 text-center">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredAllInspections.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 italic font-sans">
                        Проверок по выбранным фильтрам поиска не найдено.
                      </td>
                    </tr>
                  ) : (
                    filteredAllInspections.map((insp) => {
                      const count = remarkCountByInspId[insp.id] || 0;
                      const stations = stationsByInspId[insp.id] || [];

                      return (
                        <tr key={insp.id} className="hover:bg-slate-50 transition font-medium">
                          <td className="p-3 font-bold border-r border-slate-150">
                            <span className="bg-slate-100 px-2 py-1 rounded text-slate-800">
                              № {insp.number}
                            </span>
                          </td>
                          <td className="p-3 border-r border-slate-150">{formatDateToRu(insp.date)}</td>
                          <td className="p-3 border-r border-slate-150 font-sans text-slate-800 font-semibold">{insp.inspectionType}</td>
                          <td className="p-3 border-r border-slate-150 font-sans text-slate-600">{insp.inspector}</td>
                          <td className="p-3 border-r border-slate-150 font-sans text-slate-700 font-semibold">
                            {stations.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {stations.map(st => (
                                  <span key={st} className="bg-blue-50 text-blue-800 text-[9px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-blue-200">
                                    {st}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">не внесено</span>
                            )}
                          </td>
                          <td className="p-3 border-r border-slate-150 text-center">
                            <span className={`px-2 py-1 rounded font-bold text-xs ${count > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                              {count}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => onSelectInspection(insp.id)}
                              className="bg-slate-900 text-white font-sans text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 transition flex items-center space-x-1 mx-auto cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Открыть</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
