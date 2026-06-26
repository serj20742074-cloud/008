import React, { useState, useEffect } from 'react';
import { DbStore } from '../db';
import { Plus, X, RotateCcw, FolderHeart, Train, ClipboardCheck } from 'lucide-react';

interface CategoryManagerProps {
  categories: string[];
  onChanged: (newCategories: string[]) => void;
}

export default function CategoryManager({ categories, onChanged }: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'inspection_types' | 'stations'>('categories');
  const [newCategory, setNewCategory] = useState('');
  const [newStation, setNewStation] = useState('');
  const [newInspectionType, setNewInspectionType] = useState('');
  const [stations, setStations] = useState<string[]>([]);
  const [inspectionTypes, setInspectionTypes] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Initial load
  useEffect(() => {
    setStations(DbStore.getStations());
    setInspectionTypes(DbStore.getInspectionTypes());
  }, []);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCategory.trim();
    if (!cleanName) return;

    if (categories.includes(cleanName)) {
      setError('Такая категория уже существует в справочнике');
      return;
    }

    const updated = [...categories, cleanName];
    DbStore.saveCategories(updated);
    onChanged(updated);
    setNewCategory('');
    setError('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (categories.length <= 1) {
      setError('Нельзя удалить последнюю категорию во избежание сбоев');
      return;
    }
    const updated = categories.filter(c => c !== cat);
    DbStore.saveCategories(updated);
    onChanged(updated);
    setError('');
  };

  const handleResetCategories = () => {
    const defaults = ["Инфраструктура", "Охрана труда", "Техническая документация", "Безопасность движения", "Регламент переговоров", "Грузовая работа", "Другое"];
    DbStore.saveCategories(defaults);
    onChanged(defaults);
    setError('');
  };

  // Stations handlers
  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStation = newStation.trim();
    if (!cleanStation) return;

    if (stations.some(s => s.trim().toLowerCase() === cleanStation.toLowerCase())) {
      setError('Железнодорожная станция с таким названием уже существует');
      return;
    }

    const updated = [...stations, cleanStation];
    DbStore.saveStations(updated);
    setStations(updated);
    setNewStation('');
    setError('');
    onChanged(categories); // notify parents to pull new data
  };

  const handleRemoveStation = (st: string) => {
    if (stations.length <= 1) {
      setError('Необходимо сохранить как минимум одну станцию в справочнике');
      return;
    }
    const updated = stations.filter(s => s !== st);
    DbStore.saveStations(updated);
    setStations(updated);
    setError('');
    onChanged(categories);
  };

  const handleResetStations = () => {
    const defaults = ["Лихая", "Глубокая", "Каменская", "Зверево", "Сулин", "Шахтная", "Персиановка", "Новочеркасск"];
    DbStore.saveStations(defaults);
    setStations(defaults);
    setError('');
    onChanged(categories);
  };

  // Inspection types handlers
  const handleAddInspectionType = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanType = newInspectionType.trim();
    if (!cleanType) return;

    if (inspectionTypes.some(t => t.trim().toLowerCase() === cleanType.toLowerCase())) {
      setError('Вид проводимой проверки с таким наименованием уже существует');
      return;
    }

    const updated = [...inspectionTypes, cleanType];
    DbStore.saveInspectionTypes(updated);
    setInspectionTypes(updated);
    setNewInspectionType('');
    setError('');
    onChanged(categories);
  };

  const handleRemoveInspectionType = (type: string) => {
    if (inspectionTypes.length <= 1) {
      setError('Необходимо сохранить как минимум один вид проверки в справочнике');
      return;
    }
    const updated = inspectionTypes.filter(t => t !== type);
    DbStore.saveInspectionTypes(updated);
    setInspectionTypes(updated);
    setError('');
    onChanged(categories);
  };

  const handleResetInspectionTypes = () => {
    const defaults = [
      "Плановая комплексная проверка",
      "Выборочный комиссионный осмотр",
      "Внезапный целевой осмотр",
      "Оперативный аудит охраны труда",
      "Плановое обследование путей"
    ];
    DbStore.saveInspectionTypes(defaults);
    setInspectionTypes(defaults);
    setError('');
    onChanged(categories);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="directory-manager-container">
      {/* Tab Switcher Header */}
      <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          {activeTab === 'categories' ? (
            <FolderHeart className="w-5 h-5 text-slate-700" />
          ) : activeTab === 'inspection_types' ? (
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
          ) : (
            <Train className="w-5 h-5 text-rose-600" />
          )}
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            {activeTab === 'categories' 
              ? 'Справочник категорий замечаний' 
              : activeTab === 'inspection_types'
                ? 'Справочник видов проводимых проверок'
                : 'Справочник железнодорожных станций'
            }
          </h2>
        </div>

        {/* Tab Picker Buttons */}
        <div className="bg-slate-200 p-1 rounded-lg flex flex-wrap gap-1 self-start lg:self-center">
          <button
            onClick={() => { setActiveTab('categories'); setError(''); }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1 ${
              activeTab === 'categories' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span>Категории замечаний</span>
          </button>
          <button
            onClick={() => { setActiveTab('inspection_types'); setError(''); }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1 ${
              activeTab === 'inspection_types' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Виды проверок</span>
          </button>
          <button
            onClick={() => { setActiveTab('stations'); setError(''); }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1 ${
              activeTab === 'stations' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>Станции (Общий)</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <p className="text-xs text-slate-500">
            {activeTab === 'categories' 
              ? 'Настройте рубрикатор видов контроля. Это поле определяет классификацию нарушений.'
              : activeTab === 'inspection_types'
                ? 'Настройте доступные в системе виды контроля/осмотра путей и станций. Добавленные варианты появятся при создании новых проверок.'
                : 'Этот справочник синхронизируется между всеми вашими приложениями РЖД в рамках локального хранилища.'
            }
          </p>

          <button
            onClick={() => {
              if (activeTab === 'categories') handleResetCategories();
              else if (activeTab === 'inspection_types') handleResetInspectionTypes();
              else handleResetStations();
            }}
            className="flex items-center space-x-1 text-[11px] text-slate-500 hover:text-red-650 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition font-bold self-start sm:self-center"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Сбросить к дефолтным</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-800 p-3 rounded-lg text-xs font-semibold border border-red-100">
            {error}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex flex-wrap gap-2.5 mb-6">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold font-mono uppercase"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="ml-2 text-slate-400 hover:text-red-500 rounded hover:bg-slate-200 p-0.5 transition"
                    title="Удалить категорию"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Новая категория (напр., Энергоснабжение)"
                className="flex-1 border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить категорию</span>
              </button>
            </form>
          </div>
        )}

        {/* Inspection Types Tab */}
        {activeTab === 'inspection_types' && (
          <div>
            <div className="flex flex-wrap gap-2.5 mb-6">
              {inspectionTypes.map((type) => (
                <div
                  key={type}
                  className="flex items-center bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg px-3 py-1.5 text-xs font-semibold"
                >
                  <ClipboardCheck className="w-3 h-3 text-emerald-600 mr-1.5" />
                  <span>{type}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInspectionType(type)}
                    className="ml-2 text-emerald-400 hover:text-red-650 rounded hover:bg-emerald-100 p-0.5 transition"
                    title="Удалить вид проверки"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddInspectionType} className="flex gap-2">
              <input
                type="text"
                value={newInspectionType}
                onChange={(e) => setNewInspectionType(e.target.value)}
                placeholder="Новый вид проверки (напр., Квартальный технический аудит)"
                className="flex-1 border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить вид проверки</span>
              </button>
            </form>
          </div>
        )}

        {/* Stations Tab */}
        {activeTab === 'stations' && (
          <div>
            <div className="flex flex-wrap gap-2.5 mb-6">
              {stations.map((st) => (
                <div
                  key={st}
                  className="flex items-center bg-rose-50 border border-rose-100 text-rose-805 rounded-lg px-3 py-1.5 text-xs font-extrabold"
                >
                  <Train className="w-3 h-3 text-rose-500 mr-1.5" />
                  <span>{st}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStation(st)}
                    className="ml-2 text-rose-400 hover:text-red-650 rounded hover:bg-rose-100 p-0.5 transition"
                    title="Удалить станцию"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddStation} className="flex gap-2">
              <input
                type="text"
                value={newStation}
                onChange={(e) => setNewStation(e.target.value)}
                placeholder="Новая станция (напр., Батайск)"
                className="flex-1 border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-rose-650 hover:bg-rose-750 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить станцию</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
