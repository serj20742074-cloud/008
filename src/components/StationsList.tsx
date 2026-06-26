import React, { useState } from 'react';
import { DbStore } from '../db';
import { formatDateToRu } from '../utils';
import { Train, Search, FileSpreadsheet, AlertTriangle, CheckCircle, ClipboardList, ChevronRight } from 'lucide-react';

interface StationsListProps {
  onSelectInspection?: (inspectionId: string) => void;
  onSelectStationRemarks?: (stationName: string, statusFilter?: 'Выполнено' | 'Просрочено' | 'Активные' | '') => void;
}

export default function StationsList({
  onSelectInspection = () => {},
  onSelectStationRemarks = () => {}
}: StationsListProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStationInspections, setExpandedStationInspections] = useState<string | null>(null);

  const stats = DbStore.getStationStats();
  const allInspections = DbStore.getInspections();

  // Filtered stats
  const filteredStats = stats.filter(st => 
    st.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalInspections = stats.reduce((acc, curr) => acc + curr.inspectionsCount, 0);
  const totalRemarks = stats.reduce((acc, curr) => acc + curr.remarksCount, 0);
  const totalOverdue = stats.reduce((acc, curr) => acc + curr.overdueCount, 0);
  const totalCompleted = stats.reduce((acc, curr) => acc + curr.completedCount, 0);

  return (
    <div className="space-y-6" id="stations-list-section">
      {/* Search and Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6" id="stations-summary-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Реестр железнодорожных станций</h2>
            <p className="text-sm text-slate-500">Сводные показатели по выявленным нарушениям и инспекциям</p>
          </div>
          
          <div className="relative w-full lg:w-80">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск станции..."
              className="w-full bg-slate-50 text-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
              id="stations-search-input"
            />
          </div>
        </div>

        {/* Global Summary Badge Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100" id="global-stats-counters">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center space-x-3">
            <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Всего проверок</p>
              <p className="text-lg font-bold text-slate-800">{totalInspections}</p>
            </div>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Всего замечаний</p>
              <p className="text-lg font-bold text-blue-900">{totalRemarks}</p>
            </div>
          </div>

          <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50 flex items-center space-x-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Просрочено</p>
              <p className="text-lg font-bold text-red-700">{totalOverdue}</p>
            </div>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Решено/Устранено</p>
              <p className="text-lg font-bold text-emerald-800">{totalCompleted}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Stations */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="stations-grid">
        {filteredStats.map((st) => {
          const isInspectionsExpanded = expandedStationInspections === st.name;
          const stationRemarks = DbStore.getRemarks().filter(
            r => r.station && r.station.trim().toLowerCase() === st.name.trim().toLowerCase()
          );
          const stationInspectionIds = Array.from(new Set(stationRemarks.map(r => r.inspectionId)));
          const stationInspections = allInspections.filter(
            i => stationInspectionIds.includes(i.id) || (i.station && i.station.trim().toLowerCase() === st.name.trim().toLowerCase())
          );

          return (
            <div
              key={st.name}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition duration-200 flex flex-col justify-between"
              id={`station-card-${st.name.replace(/\s+/g, '-')}`}
            >
              {/* Station Header */}
              <div className="bg-slate-50 p-4 border-b border-slate-150 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg">
                    <Train className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800">{st.name}</h3>
                </div>
              </div>

              {/* Station Stats Body */}
              <div className="p-5 space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3 text-center">
                  {/* Проверки (Click to see inspections) */}
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedStationInspections(isInspectionsExpanded ? null : st.name);
                    }}
                    className={`p-2.5 rounded-lg border transition text-center focus:outline-none focus:ring-2 focus:ring-slate-500 flex flex-col items-center justify-center ${
                      isInspectionsExpanded
                        ? 'bg-slate-200 border-slate-400 text-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-800 hover:scale-[1.02]'
                    }`}
                    title="Нажмите, чтобы просмотреть проверки по этой станции"
                  >
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-tight">Проверки 🕵️‍♂️</span>
                    <span className="text-xl font-extrabold font-mono mt-1">{st.inspectionsCount}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 underline">
                      {isInspectionsExpanded ? 'скрыть' : 'посмотреть'}
                    </span>
                  </button>

                  {/* Замечания (Click to go to All Remarks) */}
                  <button
                    type="button"
                    onClick={() => onSelectStationRemarks(st.name, '')}
                    className="p-2.5 rounded-lg border bg-blue-50/40 hover:bg-blue-50 border-blue-100 hover:border-blue-300 transition text-center focus:outline-none focus:ring-2 focus:ring-blue-400 hover:scale-[1.02] flex flex-col items-center justify-center"
                    title="Перейти к реестру всех замечаний станции"
                  >
                    <span className="block text-xs font-bold text-blue-600 uppercase tracking-tight">Замечания 📋</span>
                    <span className="text-xl font-extrabold font-mono text-blue-900 mt-1">{st.remarksCount}</span>
                    <span className="text-[9px] text-blue-400 mt-0.5 underline">открыть все</span>
                  </button>
                </div>

                {/* Interactive Status Breakdowns */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Замечания по статусам (нажмите для перехода):</span>
                  
                  {/* Просрочено */}
                  <button
                    type="button"
                    onClick={() => onSelectStationRemarks(st.name, 'Просрочено')}
                    className="w-full flex justify-between items-center text-sm hover:bg-red-50 p-2 rounded-lg border border-transparent hover:border-red-150 transition text-left focus:outline-none focus:ring-1 focus:ring-red-200"
                    title="Открыть просроченные замечания"
                  >
                    <span className="text-slate-600 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-1"></span>
                      <span>Просрочено:</span>
                    </span>
                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-xs ${st.overdueCount > 0 ? 'bg-red-100 text-red-700 font-extrabold' : 'text-slate-500'}`}>
                      {st.overdueCount} →
                    </span>
                  </button>

                  {/* Выполнено */}
                  <button
                    type="button"
                    onClick={() => onSelectStationRemarks(st.name, 'Выполнено')}
                    className="w-full flex justify-between items-center text-sm hover:bg-blue-50 p-2 rounded-lg border border-transparent hover:border-blue-150 transition text-left focus:outline-none focus:ring-1 focus:ring-blue-200"
                    title="Открыть выполненные замечания"
                  >
                    <span className="text-slate-600 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1"></span>
                      <span>Выполнено (устранено):</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 bg-blue-50 px-1.5 py-0.5 rounded text-xs">
                      {st.completedCount} →
                    </span>
                  </button>

                  {/* В работе / На контроле */}
                  <button
                    type="button"
                    onClick={() => onSelectStationRemarks(st.name, 'Активные')}
                    className="w-full flex justify-between items-center text-sm hover:bg-emerald-50 p-2 rounded-lg border border-transparent hover:border-emerald-150 transition text-left focus:outline-none focus:ring-1 focus:ring-emerald-200"
                    title="Открыть замечания в работе"
                  >
                    <span className="text-slate-600 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1"></span>
                      <span>В работе / На контроле:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 bg-emerald-50 px-1.5 py-0.5 rounded text-xs">
                      {st.remarksCount - st.completedCount} →
                    </span>
                  </button>
                </div>
              </div>

              {/* Collapsible Inspections list inside the Station card */}
              {isInspectionsExpanded && (
                <div className="px-5 pb-5 pt-3 bg-slate-50 border-t border-slate-150 space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Сессии проверок ({stationInspections.length}):</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedStationInspections(null);
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-bold underline"
                    >
                      Скрыть
                    </button>
                  </div>
                  
                  {stationInspections.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {stationInspections.slice().reverse().map(insp => (
                        <button
                          key={insp.id}
                          onClick={() => onSelectInspection(insp.id)}
                          className="w-full text-left bg-white hover:bg-slate-100 p-2.5 rounded-lg border border-slate-200 shadow-xs transition flex items-center justify-between group active:bg-slate-200"
                          title="Открыть карточку этой проверки и перейти к внесению замечаний"
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-extrabold font-mono text-slate-900 block group-hover:text-red-650 transition-colors">
                              № {insp.number}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[170px] md:max-w-[200px]">
                              {insp.inspectionType}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-slate-400 group-hover:text-red-650 transition-colors">
                            <span className="text-[9px] font-mono font-bold">{formatDateToRu(insp.date)}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2">На этой станции еще не зарегистрировано проверок</p>
                  )}
                </div>
              )}
              
              {/* Footer with a helper bar */}
              <div className="bg-slate-50/50 px-5 py-2 text-[10px] text-slate-400 text-right border-t border-slate-100">
                Нажмите на показатели для детализации
              </div>
            </div>
          );
        })}

        {filteredStats.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center" id="no-stations">
            <Train className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Станции с таким названием не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}
