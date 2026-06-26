import React, { useState, useEffect } from 'react';
import { Remark, Inspection } from '../types';
import { DbStore } from '../db';
import { formatDateToRu } from '../utils';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, Calendar, User, UserCheck, Eye, ClipboardMinus } from 'lucide-react';

interface AllRemarksProps {
  remarks: Remark[];
  inspections: Inspection[];
  onSelectRemark: (remarkId: string) => void;
  initialStatusFilter?: string;
  onClearInitialStatus?: () => void;
  initialStationFilter?: string;
  onClearInitialStation?: () => void;
  initialInspectorFilter?: string;
  onClearInitialInspector?: () => void;
}

export default function AllRemarks({
  remarks,
  inspections,
  onSelectRemark,
  initialStatusFilter,
  onClearInitialStatus,
  initialStationFilter,
  onClearInitialStation,
  initialInspectorFilter,
  onClearInitialInspector
}: AllRemarksProps) {
  // Filters state
  const [stationName, setStationName] = useState('');
  const [category, setCategory] = useState('');
  const [objectControl, setObjectControl] = useState('');
  const [responsible, setResponsible] = useState('');
  const [status, setStatus] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionType, setInspectionType] = useState('');
  const [inspector, setInspector] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (initialStatusFilter !== undefined) {
      setStatus(initialStatusFilter);
      if (initialStatusFilter) {
        setShowFilters(true);
      }
    }
  }, [initialStatusFilter]);

  useEffect(() => {
    if (initialStationFilter !== undefined) {
      setStationName(initialStationFilter);
      if (initialStationFilter) {
        setShowFilters(true);
      }
    }
  }, [initialStationFilter]);

  useEffect(() => {
    if (initialInspectorFilter !== undefined) {
      setInspector(initialInspectorFilter);
      if (initialInspectorFilter) {
        setShowFilters(true);
      }
    }
  }, [initialInspectorFilter]);

  // Sorting
  const [sortBy, setSortBy] = useState<'dueDate' | 'status' | 'id'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Dynamic filter lists
  const stations = Array.from(new Set(remarks.map(r => r.station).filter(Boolean)));
  const categories = DbStore.getCategories();
  const objects = Array.from(new Set(remarks.map(r => r.objectControl).filter(Boolean)));
  const responsibles = Array.from(new Set(remarks.map(r => r.responsible).filter(Boolean)));
  const inspectionTypes = Array.from(new Set(inspections.map(i => i.inspectionType)));
  const inspectors = Array.from(new Set(inspections.map(i => i.inspector).filter(Boolean)));

  // Combine remarked info with its parent inspection
  const remarksWithInspections = remarks.map(r => {
    const parent = inspections.find(i => i.id === r.inspectionId);
    return {
      ...r,
      parentInspection: parent
    };
  });

  // Apply filters
  const filteredRemarks = remarksWithInspections.filter(r => {
    // 1. Text Search
    if (searchQuery && !r.description.toLowerCase().includes(searchQuery.toLowerCase()) && !r.violationType.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // 2. Station
    if (stationName && r.station !== stationName) {
      return false;
    }
    // 3. Category
    if (category && r.category !== category) {
      return false;
    }
    // 4. Object Control
    if (objectControl && r.objectControl !== objectControl) {
      return false;
    }
    // 5. Responsible
    if (responsible && r.responsible !== responsible) {
      return false;
    }
    // 6. Status
    if (status) {
      if (status === 'Активные') {
        if (r.status !== 'В работе' && r.status !== 'На контроле') {
          return false;
        }
      } else if (r.status !== status) {
        return false;
      }
    }
    // 7. Due Date
    if (dueDate && r.dueDate !== dueDate) {
      return false;
    }
    // 8. Inspection Date
    if (inspectionDate && r.parentInspection?.date !== inspectionDate) {
      return false;
    }
    // 9. Inspection Type
    if (inspectionType && r.parentInspection?.inspectionType !== inspectionType) {
      return false;
    }
    // 10. Inspector (Проверяющий)
    if (inspector && r.parentInspection?.inspector !== inspector) {
      return false;
    }
    return true;
  });

  // Apply sorting
  const sortedRemarks = [...filteredRemarks].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'dueDate') {
      comparison = a.dueDate.localeCompare(b.dueDate);
    } else if (sortBy === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else {
      comparison = a.id.localeCompare(b.id);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Reset filters
  const handleResetFilters = () => {
    setStationName('');
    setCategory('');
    setObjectControl('');
    setResponsible('');
    setStatus('');
    setDueDate('');
    setInspectionDate('');
    setInspectionType('');
    setInspector('');
    setSearchQuery('');
    onClearInitialStatus?.();
    onClearInitialStation?.();
    onClearInitialInspector?.();
  };

  const getStatusBadge = (statusValue: string) => {
    switch (statusValue) {
      case "В работе":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">🟢 В работе</span>;
      case "На контроле":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">🟡 На контроле</span>;
      case "Выполнено":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">🔵 Выполнено</span>;
      case "Просрочено":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 animate-pulse">🔴 Просрочено</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{statusValue}</span>;
    }
  };

  return (
    <div className="space-y-6" id="all-remarks-section">
      {/* Search Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по тексту замечания или нарушению..."
              className="w-full bg-slate-50 text-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white transition"
              id="remarks-text-search"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center space-x-1.5 px-4 py-3 rounded-lg border text-sm font-semibold transition ${
                showFilters || stationName || category || objectControl || responsible || status || dueDate || inspectionDate || inspectionType
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-700 border-slate-350 hover:bg-slate-50'
              }`}
              id="btn-toggle-filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Фильтры {showFilters ? '▲' : '▼'}</span>
            </button>

            {(stationName || category || objectControl || responsible || status || dueDate || inspectionDate || inspectionType || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-semibold transition"
                id="btn-reset-filters"
              >
                Очистить
              </button>
            )}
          </div>
        </div>

        {/* Collapsible filters panel */}
        {(showFilters || stationName || category || objectControl || responsible || status || dueDate || inspectionDate || inspectionType) && (
          <div className="pt-4 border-t border-slate-150 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="remarks-filters-panel">
            {/* 1. Станция */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Станция</label>
              <select
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Все станции</option>
                {stations.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>

            {/* 2. Категория */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Все категории</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* 3. Объект контроля */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Объект контроля</label>
              <select
                value={objectControl}
                onChange={(e) => setObjectControl(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Все объекты</option>
                {objects.map(obj => <option key={obj} value={obj}>{obj}</option>)}
              </select>
            </div>

            {/* 4. Ответственный */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Ответственный</label>
              <select
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Все ответственные</option>
                {responsibles.map(resp => <option key={resp} value={resp}>{resp}</option>)}
              </select>
            </div>

            {/* 5. Статус */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Статус</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Все статусы</option>
                <option value="Активные">Активные замечания ⚠️</option>
                <option value="В работе">В работе 🟢</option>
                <option value="На контроле">На контроле 🟡</option>
                <option value="Выполнено">Выполнено 🔵</option>
                <option value="Просрочено">Просрочено 🔴</option>
              </select>
            </div>

            {/* 6. Срок устранения */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Срок устранения</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-500"
              />
            </div>

            {/* 7. Дата проверки */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Дата проверки</label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-500"
              />
            </div>

            {/* 8. Вид проверки */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Вид проверки</label>
              <select
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Все виды проверок</option>
                {inspectionTypes.map(it => <option key={it} value={it}>{it}</option>)}
              </select>
            </div>

            {/* 9. Проверяющий */}
            <div>
              <label className="text-xs font-bold text-slate-705 block mb-1">Проверяющий</label>
              <select
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Все проверяющие</option>
                {inspectors.map(it => <option key={it} value={it}>{it}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sorting Control */}
      <div className="flex justify-between items-center bg-slate-100 px-4 py-2.5 rounded-lg text-xs font-medium text-slate-600">
        <div>
          Найдено замечаний: <strong className="text-slate-800 font-mono">{filteredRemarks.length}</strong>
        </div>
        <div className="flex items-center space-x-3">
          <span>Сортировать по:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700"
          >
            <option value="dueDate">Срок устранения</option>
            <option value="status">Статус</option>
            <option value="id">Порядковый №</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center space-x-0.5 bg-white border border-slate-300 rounded p-1 text-slate-700 hover:bg-slate-50 transition"
            title="Изменить порядок сортировки"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="uppercase">{sortOrder}</span>
          </button>
        </div>
      </div>

      {/* Remarks Grid Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="all-remarks-grid">
        {sortedRemarks.map((rem) => (
          <div
            key={rem.id}
            onClick={() => onSelectRemark(rem.id)}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-350 hover:shadow-md cursor-pointer transition duration-150 flex flex-col justify-between"
            id={`remark-panel-${rem.id}`}
          >
            <div className="p-5">
              {/* Header inside and status */}
              <div className="flex justify-between items-start gap-2 mb-3">
                <span className="bg-slate-100 text-slate-700 font-bold font-mono text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {rem.category}
                </span>
                {getStatusBadge(rem.status)}
              </div>

              <h4 className="text-slate-905 font-bold text-md leading-snug line-clamp-2 mb-2">
                {rem.violationType}
              </h4>

              <p className="text-slate-500 text-sm line-clamp-3 mb-4">
                {rem.description}
              </p>

              {/* Grid data */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                <div>
                  <span className="text-slate-400 block">Объект контроля:</span>
                  <span className="font-semibold text-slate-700">{rem.objectControl}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Место выявления:</span>
                  <span className="font-semibold text-slate-700">{rem.location || 'Не указано'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ответственный:</span>
                  <span className="font-semibold text-slate-700 flex items-center space-x-1">
                    <UserCheck className="w-3 h-3 text-slate-500 inline mr-0.5" />
                    <span className="truncate max-w-40 inline-block">{rem.responsible}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Срок устранения:</span>
                  <span className={`font-mono font-bold ${rem.status === 'Просрочено' ? 'text-red-600' : 'text-slate-700'}`}>
                    {formatDateToRu(rem.dueDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom info strip */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1 truncate max-w-[70%]">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">{rem.station || rem.parentInspection?.station || 'Мультистанционная'}</span>
                <span className="text-slate-350">|</span>
                <span>{rem.parentInspection?.number} ({formatDateToRu(rem.parentInspection?.date)})</span>
              </span>

              <span className="text-slate-700 font-bold flex items-center space-x-1 hover:text-slate-900 group">
                <span>Перейти</span>
                <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
              </span>
            </div>
          </div>
        ))}

        {sortedRemarks.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 py-16 text-center" id="no-filtered-remarks">
            <ClipboardMinus className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-lg">Замечания по выбранным фильтрам не найдены</p>
            <button
              onClick={handleResetFilters}
              className="mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
              id="btn-clear-empty-remarks"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
