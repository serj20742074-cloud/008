import React, { useState, useRef } from 'react';
import { DbStore, safeLocalStorage } from '../db';
import { formatDateToRu } from '../utils';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  AlertTriangle,
  CalendarRange,
  FileJson,
  FileCheck2
} from 'lucide-react';

interface DebugPanelProps {
  onRefreshData: () => void;
}

export default function DebugPanel({ onRefreshData }: DebugPanelProps) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [autoBackups, setAutoBackups] = useState<any[]>(() => {
    try {
      return JSON.parse(safeLocalStorage.getItem('PORUCHENIYA_AUTO_BACKUPS_v1') || '[]');
    } catch {
      return [];
    }
  });

  const handleCreateTestBackup = () => {
    try {
      const rawNow = new Date();
      const todayKey = rawNow.toISOString().slice(0, 10);
      const dataStr = DbStore.exportToJson();
      const backupData = JSON.parse(dataStr);
      
      const backupsHistoryStr = safeLocalStorage.getItem('PORUCHENIYA_AUTO_BACKUPS_v1') || '[]';
      const backupsHistory = JSON.parse(backupsHistoryStr);
      
      const newBackup = {
        date: todayKey,
        time: `${rawNow.getHours()}:${rawNow.getMinutes().toString().padStart(2, '0')}`,
        filename: `rzhd_porucheniya_autobackup_${todayKey}_1700_manual_test.json`,
        data: backupData
      };
      
      backupsHistory.push(newBackup);
      safeLocalStorage.setItem('PORUCHENIYA_AUTO_BACKUPS_v1', JSON.stringify(backupsHistory));
      setAutoBackups(backupsHistory);
      
      // Trigger download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = newBackup.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMessage({ text: 'Имитация автоматического резервного копирования в 17:00 успешно запущена! Файл сохранен в Загрузках.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: `Сбой симуляции: ${err?.message || err}`, type: 'error' });
    }
  };

  const handleDownloadHistoricalBackup = (backup: any) => {
    try {
      const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setMessage({ text: `Не удалось скачать резервную копию: ${err?.message || err}`, type: 'error' });
    }
  };

  const handleClearHistoricalBackups = () => {
    if (window.confirm('Очистить весь локальный архив автоматических копий?')) {
      safeLocalStorage.removeItem('PORUCHENIYA_AUTO_BACKUPS_v1');
      setAutoBackups([]);
      setMessage({ text: 'Рабочий архив автоматических копий очищен.', type: 'success' });
    }
  };

  // Trigger JSON database export and start browser downloading
  const handleExportFile = () => {
    try {
      const dataStr = DbStore.exportToJson();
      const backupData = JSON.parse(dataStr);
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const dateSuffix = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `rzhd_porucheniya_backup_${dateSuffix}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ text: 'База данных успешно экспортирована во внешний JSON файл и сохранена в загрузках!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: `Не удалось завершить экспорт: ${err?.message || err}`, type: 'error' });
    }
  };

  // Import JSON content from a selected file
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error('Файл пуст или некорректен');
        }

        // Test parse first to confirm valid structure
        JSON.parse(text);

        const success = DbStore.loadFromJson(text);
        if (success) {
          setMessage({ text: `Файл "${file.name}" успешно импортирован! База данных обновлена.`, type: 'success' });
          onRefreshData();
        } else {
          setMessage({ text: 'Сбой при загрузке. Убедитесь, что JSON содержит правильную структуру ОАО «РЖД».', type: 'error' });
        }
      } catch (err: any) {
        setMessage({ text: `Ошибка разбора JSON файла: ${err?.message || 'Неверный формат документа'}`, type: 'error' });
      }
    };
    reader.readAsText(file);
    
    // Clear the input value so the change event triggers again for the same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (window.confirm('Вы уверены, что хотите сбросить ВСЮ базу данных к исходным демонстрационным данным? Все текущие изменения будут стерты.')) {
      DbStore.resetToDefault();
      setMessage({ text: 'База данных успешно сброшена к исходным демонстрационным данным.', type: 'success' });
      onRefreshData();
    }
  };

  const handleWipe = () => {
    if (window.confirm('ВНИМАНИЕ! Вы хотите полностью очистить локальную базу данных (все проверки и замечания)?')) {
      safeLocalStorage.clear();
      DbStore.init(); // Setup empty structures
      setMessage({ text: 'Все локальные данные успешно стерты.', type: 'success' });
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6" id="debug-panel-section">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="w-6 h-6 text-red-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Экспорт и импорт базы данных файлом</h2>
            <p className="text-sm text-slate-500">Система резервного копирования и автономного обмена данными ОАО «РЖД»</p>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg text-sm mb-6 flex items-start space-x-2.5 border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-805 border-emerald-150'
                : 'bg-red-50 text-red-850 border-red-150'
            }`}
            id="debug-notif-message"
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-505 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-505 flex-shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* File-Based Import / Export Section */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Export File Area */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="text-slate-800 font-bold text-sm flex items-center space-x-1.5">
                  <FileJson className="w-4 h-4 text-red-600" />
                  <span>Экспорт в файл JSON</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Сохраните все текущие проверки, замечания, фотографии, логи и справочники в один локальный файл. Этот файл можно использовать как резервную копию или передать коллегам на другой планшет.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportFile}
                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-2.5 px-4 rounded-lg transition text-xs flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                id="btn-export-json-file"
              >
                <Download className="w-4 h-4" />
                <span>Сохранить базу в файл (.json)</span>
              </button>
            </div>

            {/* Import File Area */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="text-slate-800 font-bold text-sm flex items-center space-x-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>Импорт из файла JSON</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Выберите ранее экспортированный файл резервной копии в формате <strong>.json</strong>. Данные будут загружены в вашу систему с замещением текущих рабочих записей.
                </p>
              </div>
              
              <div>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  className="hidden"
                  id="db-file-uploader-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-emerald-600 hover:bg-emerald-705 text-white font-bold py-2.5 px-4 rounded-lg transition text-xs flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                  id="btn-trigger-import-file"
                >
                  <Upload className="w-4 h-4" />
                  <span>Загрузить данные из файла</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Daily Automated Backup Status Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6" id="daily-autobackup-area">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Ежедневное автоматическое резервирование (17:00 ежедневно)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Система автоматически сохраняет полную архивную копию базы данных при использовании терминала в 17:00.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCreateTestBackup}
                className="bg-emerald-550 hover:bg-emerald-650 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center space-x-1 shadow-sm"
                id="btn-simulate-1700-backup"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Имитировать 17:00 сейчас</span>
              </button>
              
              {autoBackups.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistoricalBackups}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer"
                  id="btn-clear-auto-backups-archive"
                >
                  Очистить архив
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Локальный архив автоматических копий ({autoBackups.length}):</h4>
            {autoBackups.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Автоматические копии пока не создавались. Они будут автоматически формироваться каждый день при наступлении 17:00 или при нажатии кнопки имитации.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1" id="historical-autobackups-list">
                {autoBackups.map((bk, i) => (
                  <div key={i} className="py-2.5 flex justify-between items-center text-xs group hover:bg-white rounded-md px-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {formatDateToRu(bk.date)}
                      </span>
                      <span className="text-slate-400 font-mono">{bk.time}</span>
                      <span className="text-slate-700 truncate max-w-[200px] md:max-w-xs font-mono" title={bk.filename}>
                        {bk.filename}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadHistoricalBackup(bk)}
                      className="text-slate-600 hover:text-emerald-700 flex items-center space-x-1 font-bold bg-white border border-slate-200 hover:border-emerald-300 rounded px-2 py-1 transition shadow-sm cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Скачать копия</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low-level Administration controls */}
        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Опасная зона администратора / Сброс</h3>
          <div className="flex flex-wrap gap-3">
            {/* Reset button */}
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-lg transition text-xs cursor-pointer"
              id="btn-debug-reset-demo"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Сбросить к Демо-данным</span>
            </button>

            {/* Wipe button */}
            <button
              onClick={handleWipe}
              className="flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold py-2 px-3 rounded-lg transition text-xs cursor-pointer"
              id="btn-debug-wipe"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить всю локальную БД</span>
            </button>
          </div>
        </div>

      </div>

      {/* Database state information & simulation guides */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5" id="debug-simulation-info">
        <div className="flex items-start space-x-3">
          <CalendarRange className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800">Симуляция просроченных замечаний:</p>
            <p>
              Приложение автоматически сверяет дату устранения правонарушений («Срок устранения») с текущей фактической системной датой <strong className="font-mono text-slate-800">{formatDateToRu(DbStore.getTodayString())} г.</strong>
            </p>
            <p>
              Если замечание находится в статусе <strong>«В работе»</strong> или <strong>«На контроле»</strong>, а срок устранения меньше этой даты — статус автоматически вычисляется как 🔴 <strong>«Просрочено»</strong>. Вы можете отредактировать срок в карточке замечания или зайти во вкладку «Все замечания» для проверки фильтрации.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
