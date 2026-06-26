import React from 'react';
import { ShieldAlert, User, WifiOff, Clock } from 'lucide-react';
import { CURRENT_USER } from '../db';

interface HeaderProps {
  onGoHome: () => void;
  activeScreen: string;
}

export default function Header({ onGoHome, activeScreen }: HeaderProps) {
  const getHeaderDateString = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const weekday = weekdays[d.getDay()];
    return `${day}.${month}.${year} (${weekday})`;
  };

  return (
    <header className="bg-slate-900 border-b border-slate-850 text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0" id="app-header">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={onGoHome} id="brand-logo">
        <div className="p-2.5 bg-red-600 rounded-md shadow-md animate-pulse">
          <ShieldAlert className="w-6 h-6 text-yellow-100" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">РЖД Контроль</h1>
          <p className="text-xs text-slate-400 font-mono">Мобильный terminal «Проверки»</p>
        </div>
      </div>

      <div className="flex items-center space-x-6 text-sm">
        <div className="hidden lg:flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700" id="current-user-badge">
          <User className="w-4 h-4 text-slate-300" />
          <span className="text-slate-200 font-medium">{CURRENT_USER}</span>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300" id="mock-date-indicator">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span className="font-mono">{getHeaderDateString()}</span>
        </div>

        <div className="flex items-center space-x-2 text-rose-400 font-semibold px-3 py-1.5 bg-rose-950/40 border border-rose-900/50 rounded-lg" id="offline-badge">
          <WifiOff className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Автономно</span>
        </div>
      </div>
    </header>
  );
}
