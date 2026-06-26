import React, { useState } from 'react';
import { Remark, Photo, RemarkLog, Inspection } from '../types';
import { DbStore, CURRENT_USER } from '../db';
import { ArrowLeft, Edit3, Camera, Play, Volume2, Files, Calendar, History, Save, Trash2, CheckCircle2, MessageSquare, AlertTriangle } from 'lucide-react';

interface RemarkCardProps {
  remark: Remark;
  photos: Photo[];
  logs: RemarkLog[];
  inspections: Inspection[];
  onBack: () => void;
  onRefreshData: () => void;
  categories: string[];
}

export default function RemarkCard({
  remark,
  photos,
  logs,
  inspections,
  onBack,
  onRefreshData,
  categories
}: RemarkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Comment state
  const [commentText, setCommentText] = useState('');

  // Editing form states
  const [editStation, setEditStation] = useState(remark.station || '');
  const [editCategory, setEditCategory] = useState(remark.category);
  const [editObjectControl, setEditObjectControl] = useState(remark.objectControl);
  const [editLocation, setEditLocation] = useState(remark.location);
  const [editViolationType, setEditViolationType] = useState(remark.violationType);
  const [editDescription, setEditDescription] = useState(remark.description);
  const [editDocument, setEditDocument] = useState(remark.document);
  const [editDocumentPoint, setEditDocumentPoint] = useState(remark.documentPoint);
  const [editCorrectiveAction, setEditCorrectiveAction] = useState(remark.correctiveAction);
  const [editResponsible, setEditResponsible] = useState(remark.responsible);
  const [editDueDate, setEditDueDate] = useState(remark.dueDate);
  const [editStatus, setEditStatus] = useState(remark.status);

  // Message toast for developmental Stage-2 features
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const parentInspection = inspections.find(i => i.id === remark.inspectionId);
  const remarkPhotos = photos.filter(p => p.remarkId === remark.id);
  const remarkLogs = logs
    .filter(l => l.remarkId === remark.id)
    .sort((a, b) => b.date.localeCompare(a.date)); // descending order (newest first)

  const showToast = (featureName: string) => {
    setToastMessage(`Раздел «${featureName}» относится к Этапу 2 развития согласно ТЗ и симулирован для проверки интерфейса.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Remark = {
      ...remark,
      station: editStation,
      category: editCategory,
      objectControl: editObjectControl,
      location: editLocation,
      violationType: editViolationType,
      description: editDescription,
      document: editDocument,
      documentPoint: editDocumentPoint,
      correctiveAction: editCorrectiveAction,
      responsible: editResponsible,
      dueDate: editDueDate,
      status: editStatus
    };
    DbStore.updateRemark(updated);
    setIsEditing(false);
    onRefreshData();
  };

  // Immediate status quick change
  const handleStatusChange = (newStatus: Remark['status']) => {
    const updated: Remark = { ...remark, status: newStatus };
    DbStore.updateRemark(updated);
    setEditStatus(newStatus);
    onRefreshData();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    DbStore.addRemarkComment(remark.id, commentText.trim());
    setCommentText('');
    onRefreshData();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          DbStore.addPhoto(remark.id, reader.result);
          onRefreshData();
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDeleteRemarkClick = () => {
    if (window.confirm('Вы уверены, что хотите безвозвратно удалить это замечание со всеми связанными фотографиями, комментариями и логами?')) {
      DbStore.deleteRemark(remark.id);
      onRefreshData();
      onBack();
    }
  };

  const getStatusBadgeColor = (statusVal: string) => {
    switch (statusVal) {
      case "В работе": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "На контроле": return "bg-amber-100 text-amber-800 border-amber-350";
      case "Выполнено": return "bg-blue-105 text-blue-800 border-blue-300";
      case "Просрочено": return "bg-red-100 text-red-800 border-red-300 animate-pulse";
      default: return "bg-slate-150 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="space-y-6" id={`remark-card-${remark.id}`}>
      {/* Navigation & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            title="Назад"
            id="btn-remark-card-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold font-mono tracking-wide bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md uppercase">
                {remark.category}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {remark.id}</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg mt-1 block">
              {remark.violationType}
            </h3>
          </div>
        </div>

        {/* Quick Status Modifiers */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1">Изменить статус:</span>
          {(['В работе', 'На контроле', 'Выполнено', 'Просрочено'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => handleStatusChange(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                remark.status === st
                  ? getStatusBadgeColor(st) + ' ring-2 ring-offset-2 ring-slate-800'
                  : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-50'
              }`}
            >
              {st === "В работе" && "🟢 В работе"}
              {st === "На контроле" && "🟡 На контроле"}
              {st === "Выполнено" && "🔵 Выполнено"}
              {st === "Просрочено" && "🔴 Просрочено"}
            </button>
          ))}
        </div>
      </div>

      {/* Development Toast notifications */}
      {toastMessage && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg p-3 text-xs font-semibold flex items-center space-x-2 animate-fade-in" id="development-toast">
          <AlertTriangle className="w-4 h-4 text-indigo-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tablet Layout Buttons Bar */}
      {/* ТЗ: Кнопки: Фото, Видео, Аудио, Документы, История нарушения, Редактировать замечание */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3" id="remark-action-buttons-bar">
        {/* Photo Button */}
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="card-photo-direct-input"
          />
          <label
            htmlFor="card-photo-direct-input"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-slate-700 cursor-pointer text-xs font-bold text-center transition shadow-sm"
          >
            <Camera className="w-4 h-4 mb-1" />
            <span>+ ФОТО</span>
          </label>
        </div>

        {/* Video simulation */}
        <button
          onClick={() => showToast('Видеофиксация')}
          className="bg-white hover:bg-slate-50 text-slate-700 flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-slate-250 text-xs font-bold text-center transition"
        >
          <Play className="w-4 h-4 text-slate-500 mb-1" />
          <span>+ ВИДЕО</span>
        </button>

        {/* Audio simulation */}
        <button
          onClick={() => showToast('Аудиозапись')}
          className="bg-white hover:bg-slate-50 text-slate-700 flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-slate-250 text-xs font-bold text-center transition"
        >
          <Volume2 className="w-4 h-4 text-slate-500 mb-1" />
          <span>+ АУДИО</span>
        </button>

        {/* Documents simulation */}
        <button
          onClick={() => showToast('Прикрепить файлы')}
          className="bg-white hover:bg-slate-50 text-slate-700 flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-slate-250 text-xs font-bold text-center transition"
        >
          <Files className="w-4 h-4 text-slate-500 mb-1" />
          <span>+ ДОКИ</span>
        </button>

        {/* History Tab Trigger */}
        <button
          onClick={() => {
            setActiveTab('history');
            const hElem = document.getElementById('remark-workspace-tabs');
            hElem?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold text-center transition ${
            activeTab === 'history'
              ? 'bg-blue-50 text-blue-800 border-blue-400'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-250'
          }`}
        >
          <History className="w-4 h-4 text-slate-500 mb-1" />
          <span>ЖУРНАЛ</span>
        </button>

        {/* Edit Toggle */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold text-center transition ${
            isEditing
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-250'
          }`}
          id="btn-toggle-edit-remark"
        >
          <Edit3 className="w-4 h-4 text-slate-500 mb-1" />
          <span>ИЗМЕНИТЬ</span>
        </button>

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDeleteRemarkClick}
          className="bg-red-550 hover:bg-red-650 text-white flex flex-col items-center justify-center py-2.5 px-2 rounded-xl cursor-pointer text-xs font-bold text-center transition shadow-sm"
          id="btn-delete-remark"
        >
          <Trash2 className="w-4 h-4 text-white mb-1" />
          <span>УДАЛИТЬ</span>
        </button>
      </div>

      {/* Main Workspace split into two blocks or full width editor */}
      {isEditing ? (
        /* Edit Form mode */
        <form onSubmit={handleUpdate} className="bg-white rounded-xl border-2 border-amber-300 shadow-sm overflow-hidden" id="edit-remark-form">
          <div className="bg-amber-100/50 p-4 border-b border-amber-200">
            <h4 className="font-bold text-sm text-amber-900">Режим редактирования параметров замечания</h4>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Железнодорожная станция</label>
                <select
                  value={editStation}
                  onChange={(e) => setEditStation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-rose-700"
                >
                  {DbStore.getStations().map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Категория</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Объект контроля</label>
                <input
                  type="text"
                  value={editObjectControl}
                  onChange={(e) => setEditObjectControl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Место выявления</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Тип нарушения</label>
                <input
                  type="text"
                  value={editViolationType}
                  onChange={(e) => setEditViolationType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Описание замечания</label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-750 block mb-1">Мероприятия по устранению</label>
                <textarea
                  rows={2}
                  value={editCorrectiveAction}
                  onChange={(e) => setEditCorrectiveAction(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm col-span-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ответственный</label>
                <input
                  type="text"
                  value={editResponsible}
                  onChange={(e) => setEditResponsible(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Срок устранения</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Текущий статус</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold"
                >
                  <option value="В работе">В работе 🟢</option>
                  <option value="На контроле">На контроле 🟡</option>
                  <option value="Выполнено">Выполнено 🔵</option>
                  <option value="Просрочено">Просрочено 🔴</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
            <button
              type="button"
              onClick={handleDeleteRemarkClick}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5"
              id="btn-form-delete-remark"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить замечание</span>
            </button>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-extrabold flex items-center space-x-1"
                id="btn-save-edit-remark"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Сохранить параметры</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* View Card mode - conforming to the strict 4-block layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="remark-card-workspace">
          {/* Blocks 1, 2, 3, 4 */}
          <div className="lg:col-span-2 space-y-6">
            {/* БЛОК 1. НАРУШЕНИЕ */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Блок 1. Выявленное нарушение</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(remark.status)}`}>
                  {remark.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 block text-xs font-bold">Железнодорожная станция:</span>
                  <span className="font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md text-xs select-none">
                    🚂 {remark.station || 'Не указана'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-bold">Орган/Категория:</span>
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded text-xs select-none">
                    {remark.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-bold">Объект контроля:</span>
                  <span className="font-bold text-slate-800">{remark.objectControl}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-bold">Место выявления:</span>
                  <span className="font-semibold text-slate-700">{remark.location || 'Не указано'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-bold">Резюме нарушения:</span>
                  <span className="font-medium text-slate-800">{remark.violationType}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                <span className="text-slate-400 block text-xs font-bold mb-2">Детальное описание замечания:</span>
                <p className="text-slate-800 leading-relaxed text-sm whitespace-pre-wrap">{remark.description}</p>
              </div>
            </div>

            {/* БЛОК 2. ФОТОМАТЕРИАЛЫ */}
            {/* "Описание замечания -> Фотоматериалы -> Нормативное основание" - layout strictly respected as requested */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Блок 2. Фотофиксация</span>
                <span className="text-xs text-slate-400">Снимков в системе: {remarkPhotos.length}</span>
              </div>

              {remarkPhotos.length === 0 ? (
                <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <Camera className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                  <p className="text-slate-500 font-semibold text-xs">Файлы фотоматериалов отсутствуют</p>
                  <label
                    htmlFor="card-photo-direct-input-bottom"
                    className="mt-2.5 bg-slate-800 hover:bg-slate-900 text-white cursor-pointer px-3.5 py-1.5 rounded-lg text-xs font-bold inline-block"
                  >
                    Загрузить фото
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="card-photo-direct-input-bottom"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="remark-photo-gallery">
                  {remarkPhotos.map((photo, pIdx) => (
                    <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm aspect-video bg-slate-100">
                      <img
                        src={photo.filePath}
                        alt={`Доказательство ${pIdx + 1}`}
                        className="w-full h-full object-cover cursor-zoom-in"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-3 text-white">
                        <span className="text-[10px] font-mono">Снимок {pIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => DbStore.deletePhoto(photo.id, remark.id)}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-md p-1.5 transition"
                          title="Удалить снимок"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Audio playback inside Block 2 if present */}
              {remark.audioPath && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="bg-[#b31f24]/10 text-[#b31f24] rounded-full p-2">
                      <Volume2 className="w-4 h-4 animate-bounce" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Аудиозапись нарушения</span>
                      <span className="text-[10px] text-slate-400 font-mono">Голосовая заметка к дефекту</span>
                    </div>
                  </div>
                  <audio src={remark.audioPath} controls className="h-8 max-w-[190px] md:max-w-none" />
                </div>
              )}
            </div>

            {/* БЛОК 3. УСТРАНЕНИЕ */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Блок 3. Мероприятия по устранению</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-150">
                  <span className="block font-black text-slate-800 mb-1">Предписанные мероприятия:</span>
                  <p className="text-slate-700">{remark.correctiveAction || 'Дорожные работы по устранению не назначены'}</p>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs font-bold">Ответственный исполнитель:</span>
                  <span className="font-extrabold text-slate-800">{remark.responsible}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs font-bold">Установленный срок устранения:</span>
                  <span className="font-extrabold text-red-700 font-mono flex items-center space-x-1 mt-0.5">
                    <Calendar className="w-4 h-4 mr-1 text-slate-500 inline" />
                    <span>{remark.dueDate}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Bar tabs: Journal and adding comments */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              {/* Internal Tab Header selector */}
              <div id="remark-workspace-tabs" className="bg-slate-50 flex border-b border-slate-150">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
                    activeTab === 'details' ? 'border-slate-800 text-slate-900 bg-white' : 'border-transparent text-slate-500'
                  }`}
                >
                  Комментарии
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
                    activeTab === 'history' ? 'border-slate-800 text-slate-900 bg-white' : 'border-transparent text-slate-500'
                  }`}
                  id="tab-history-logs"
                >
                  Журнал изменений ({remarkLogs.length})
                </button>
              </div>

              <div className="p-4 flex-1">
                {activeTab === 'details' ? (
                  /* Comments & Chat input representation */
                  <div className="space-y-4">
                    <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1" id="comments-timeline">
                      {remarkLogs.filter(l => l.actionType === 'comment_add').length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                          <p>Диспетчерских комментариев нет. Вы можете оставить первый комментарий ниже.</p>
                        </div>
                      ) : (
                        remarkLogs
                          .filter(l => l.actionType === 'comment_add')
                          .map((log) => (
                            <div key={log.id} className="bg-slate-55 p-3 rounded-xl border border-slate-150 text-xs">
                              <div className="flex justify-between items-center text-slate-400 mb-1">
                                <span className="font-extrabold text-slate-700">{log.author}</span>
                                <span>{log.date}</span>
                              </div>
                              <p className="text-slate-800 select-text leading-relaxed font-sans">{log.details.replace('Добавлен комментарий к замечанию: ', '')}</p>
                            </div>
                          ))
                      )}
                    </div>

                    <form onSubmit={handleAddComment} className="border-t border-slate-100 pt-3 flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Введите оперативный комментарий..."
                        className="flex-1 bg-slate-50 text-slate-805 text-xs rounded-lg p-2.5 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                      <button
                        type="submit"
                        className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-3.5 py-2 rounded-lg transition"
                      >
                        Отправить
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Room Database Audit logs */
                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1" id="logs-timeline">
                    {remarkLogs.map((log) => (
                      <div key={log.id} className="border-l-2 border-indigo-200 pl-3 py-1.5 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-450 font-mono">
                          <span className="font-bold text-slate-600">{log.author}</span>
                          <span>{log.date}</span>
                        </div>
                        <p className="text-slate-750 text-xs leading-normal">
                          {log.details}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Parent inspection quick link widget */}
            {parentInspection && (
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-xs space-y-2">
                <span className="text-slate-400 block font-bold">Справочная информация о проверке:</span>
                <div>
                  <p className="font-extrabold text-slate-850">Проверка № {parentInspection.number}</p>
                  <p className="text-slate-500">{parentInspection.inspectionType}</p>
                </div>
                <div className="flex justify-between text-[11px] text-slate-450 border-t border-slate-200 pt-2 font-mono">
                  <span>Дата: {parentInspection.date}</span>
                  <span>Станция: {remark.station || parentInspection.station || 'Мультистанционная'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
