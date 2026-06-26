import { Inspection, Remark, Photo, RemarkLog, StationStats } from './types';

// Default categories as defined in the spec
export const DEFAULT_CATEGORIES = [
  "Инфраструктура",
  "Охрана труда",
  "Техническая документация",
  "Безопасность движения",
  "Регламент переговоров",
  "Грузовая работа",
  "Другое"
];

// Default stations list
export const DEFAULT_STATIONS = [
  "Станция Лихая",
  "Станция Ростов-Главный",
  "Станция Батайск",
  "Станция Таганрог",
  "Станция Новочеркасск",
  "Станция Шахтная",
  "Станция Глубокая"
];

// Default list of inspection types
export const DEFAULT_INSPECTION_TYPES = [
  "Плановая комплексная проверка",
  "Выборочный комиссионный осмотр",
  "Внезапный целевой осмотр",
  "Оперативный аудит охраны труда",
  "Плановое обследование путей"
];

// Helper to generate IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

// Minimalist stylish base64 SVG mock assets for railroad photos
// Photo 1: Schematic tracks represent Infrastructure issues
const SVG_TRACKS = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%232b2d42"/><line x1="50" y1="200" x2="110" y2="0" stroke="%238d99ae" stroke-width="8"/><line x1="250" y1="200" x2="190" y2="0" stroke="%238d99ae" stroke-width="8"/><line x1="70" y1="170" x2="230" y2="170" stroke="%23ef233c" stroke-width="6"/><line x1="80" y1="130" x2="220" y2="130" stroke="%23ef233c" stroke-width="6"/><line x1="90" y1="90" x2="210" y2="90" stroke="%23ef233c" stroke-width="6"/><line x1="100" y1="50" x2="200" y2="50" stroke="%23ffb703" stroke-width="6"/><text x="15" y="30" fill="white" font-family="sans-serif" font-size="12">Инфраструктура: Просадка стыка</text></svg>`;

// Photo 2: Schematic Helmet for Occupational Safety
const SVG_SAFETY = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%231a4968"/><path d="M150,50 C100,50 80,90 80,120 L220,120 C220,90 200,50 150,50 Z" fill="%23ffb703"/><rect x="70" y="120" width="160" height="10" rx="5" fill="%23f9c74f"/><line x1="150" y1="50" x2="150" y2="35" stroke="%23ffb703" stroke-width="8"/><text x="15" y="30" fill="white" font-family="sans-serif" font-size="12">Охрана Труда: Отсутствие СИЗ</text></svg>`;

// Photo 3: Schematic Document
const SVG_DOC = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23432818"/><rect x="90" y="30" width="120" height="140" rx="4" fill="%23ffffff"/><line x1="110" y1="60" x2="190" y2="60" stroke="%23333333" stroke-width="4"/><line x1="110" y1="80" x2="170" y2="80" stroke="%23333333" stroke-width="4"/><line x1="110" y1="100" x2="190" y2="100" stroke="%23333333" stroke-width="4"/><line x1="110" y1="120" x2="150" y2="120" stroke="%23ef233c" stroke-width="4"/><text x="15" y="25" fill="white" font-family="sans-serif" font-size="12">Тех. Документация: Устаревший график</text></svg>`;

// Mock inspector (only 1 user according to specs: "вся информация вводится одним пользователе единолично")
export const CURRENT_USER = "Иванов С.П. (Начальник отдела)";

export const INITIAL_INSPECTIONS: Inspection[] = [
  {
    id: "INSP-001",
    number: "ПР-501",
    date: "2026-06-10",
    inspector: CURRENT_USER,
    inspectionType: "Плановая комплексная проверка",
    comment: "Особое внимание уделить путевому хозяйству и стрелочным переводам на постах."
  },
  {
    id: "INSP-002",
    number: "ПР-502",
    date: "2026-06-12",
    inspector: CURRENT_USER,
    inspectionType: "Внезапный целевой осмотр",
    comment: "Проверка соблюдения регламента переговоров ДСП с машинистами поездов и условий охраны труда в ночную смену."
  }
];

export const INITIAL_REMARKS: Remark[] = [
  {
    id: "REMARK-101",
    inspectionId: "INSP-001",
    station: "Станция Лихая",
    category: "Инфраструктура",
    objectControl: "Стрелочный перевод №4",
    location: "Четная горловина путей",
    violationType: "Провисание и люфт соединительной тяги",
    description: "При осмотре стрелочного перевода выявлено недопустимое провисание рабочей тяги первой степени с видимыми следами истирания.",
    document: "Инструкция ЦП-515",
    documentPoint: "п. 4.12.3",
    correctiveAction: "Провести регулировку соединительных тяг стрелочного перевода, заменить изношенные болтовые соединения.",
    responsible: "Савельев А.Д. (Дорожный мастер)",
    dueDate: "2026-06-18",
    status: "В работе"
  },
  {
    id: "REMARK-102",
    inspectionId: "INSP-001",
    station: "Станция Лихая",
    category: "Охрана труда",
    objectControl: "Инструментальный склад ПЧ-4",
    location: "Служебное здание",
    violationType: "Отсутствие защитных диэлектрических перчаток у электромонтера",
    description: "Проведение работ со щитовым оборудованием производилось электромонтером без диэлектрических перчаток с истекшим сроком поверки.",
    document: "ПТЭ Железных дорог РФ",
    documentPoint: "Приложение 7, п. 2.1",
    correctiveAction: "Изъять неисправные и непроверенные СИЗ, выдать сертифицированные диэлектрические перчатки, пройти внеочередной инструктаж.",
    responsible: "Петров И.К. (Главный инженер ПЧ)",
    dueDate: "2026-06-14",
    status: "На контроле"
  },
  {
    id: "REMARK-103",
    inspectionId: "INSP-002",
    station: "Станция Ростов-Главный",
    category: "Техническая документация",
    objectControl: "Пульт-табло дежурного ДСП",
    location: "Пост ЭЦ",
    violationType: "Неактуальный график дежурств и отсутствие росписей",
    description: "Рабочий график дежурств сменных помощников дежурного по станции на июнь 2026 года составлен некорректно, подписи начальника станции отсутствуют.",
    document: "Инструкция по ведению технической документации",
    documentPoint: "Раздел II, п. 12",
    correctiveAction: "Переоформить график дежурств, согласовать и завизировать у начальника станции.",
    responsible: "Смирнова Е.Н. (Дежурный по станции)",
    dueDate: "2026-06-15",
    status: "В работе"
  },
  {
    id: "REMARK-104",
    inspectionId: "INSP-001",
    station: "Станция Лихая",
    category: "Безопасность движения",
    objectControl: "Рельсо-шпальная решетка",
    location: "Путь №6, ПК-3",
    violationType: "Захламление габарита пути деталями ВСП",
    description: "На междупутье 5-го и 6-го путей складированы элементы рельсовых скреплений и деревянные шпалы без ограждения, мешающие свободному проходу составителей.",
    document: "Инструкция ЦШ-720",
    documentPoint: "п. 8.4",
    correctiveAction: "Срочно убрать элементы ВСП в предназначенные места хранения на складе.",
    responsible: "Савельев А.Д. (Дорожный мастер)",
    dueDate: "2026-06-11", // Overdue in 2026-06-13!
    status: "В работе"
  },
  {
    id: "REMARK-105",
    inspectionId: "INSP-002",
    station: "Станция Ростов-Главный",
    category: "Регламент переговоров",
    objectControl: "Канал радиосвязи ШП",
    location: "Пост ЭЦ",
    violationType: "Нарушение регламента переговоров",
    description: "ДСП при ведении переговоров с машинистом маневрового локомотива не назвала номер его локомотива при переданном приказе на движение.",
    document: "Приложение №20 к Инструкции по движению поездов",
    documentPoint: "раздел А, п. 3",
    correctiveAction: "Провести разбор случая ведения переговоров со сменой, назначить повторное тестирование регламента.",
    responsible: "Смирнова Е.Н. (Дежурный по станции)",
    dueDate: "2026-06-12", // Overdue, but let's say it's complete
    status: "Выполнено"
  }
];

export const INITIAL_PHOTOS: Photo[] = [
  {
    id: "PHOTO-1",
    remarkId: "REMARK-101",
    filePath: SVG_TRACKS,
    createdAt: "2026-06-10T14:22:10"
  },
  {
    id: "PHOTO-2",
    remarkId: "REMARK-102",
    filePath: SVG_SAFETY,
    createdAt: "2026-06-10T15:30:00"
  },
  {
    id: "PHOTO-3",
    remarkId: "REMARK-103",
    filePath: SVG_DOC,
    createdAt: "2026-06-12T09:12:00"
  }
];

export const INITIAL_LOGS: RemarkLog[] = [
  // LOGS FOR REMARK 101
  {
    id: "LOG-1",
    remarkId: "REMARK-101",
    date: "2026-06-10 14:20",
    author: CURRENT_USER,
    actionType: "creation",
    details: "Замечание успешно зарегистрировано в ходе проверки ПР-501."
  },
  {
    id: "LOG-2",
    remarkId: "REMARK-101",
    date: "2026-06-10 14:22",
    author: CURRENT_USER,
    actionType: "photo_add",
    details: "Добавлена фотография просадки рабочей тяги стрелочного перевода."
  },
  // LOGS FOR REMARK 102
  {
    id: "LOG-3",
    remarkId: "REMARK-102",
    date: "2026-06-10 15:25",
    author: CURRENT_USER,
    actionType: "creation",
    details: "Замечание успешно зарегистрировано."
  },
  {
    id: "LOG-4",
    remarkId: "REMARK-102",
    date: "2026-06-10 15:30",
    author: CURRENT_USER,
    actionType: "photo_add",
    details: "Добавлен снимок изъятых СИЗ без штампа поверки."
  },
  {
    id: "LOG-5",
    remarkId: "REMARK-102",
    date: "2026-06-11 11:00",
    author: CURRENT_USER,
    actionType: "status_change",
    details: "Статус изменен с 'В работе' на 'На контроле'."
  },
  // LOGS FOR REMARK 104
  {
    id: "LOG-6",
    remarkId: "REMARK-104",
    date: "2026-06-10 16:00",
    author: CURRENT_USER,
    actionType: "creation",
    details: "Замечание успешно зарегистрировано."
  }
];

// LocalStorage API
const KEYS = {
  INSPECTIONS: "PROVERKI_INSPECTIONS_v1",
  REMARKS: "PROVERKI_REMARKS_v1",
  PHOTOS: "PROVERKI_PHOTOS_v1",
  LOGS: "PROVERKI_LOGS_v1",
  CATEGORIES: "PROVERKI_CATEGORIES_v1",
  STATIONS: "PROVERKI_STATIONS_v1",
  INSPECTION_TYPES: "PROVERKI_INSPECTION_TYPES_v1"
};

// Safe transparent local storage wrapper for iPad/Safari/private mode compatibility
let memoryStore: Record<string, string> = {};
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch (e) {
      console.warn("safeLocalStorage.getItem failed for key:", key, e);
    }
    return memoryStore[key] || null;
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("safeLocalStorage.setItem failed for key:", key, e);
    }
    memoryStore[key] = value;
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("safeLocalStorage.removeItem failed for key:", key, e);
    }
    delete memoryStore[key];
  },
  clear(): void {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("safeLocalStorage.clear failed", e);
    }
    memoryStore = {};
  }
};

export class DbStore {
  static init() {
    if (!safeLocalStorage.getItem(KEYS.INSPECTIONS)) {
      safeLocalStorage.setItem(KEYS.INSPECTIONS, JSON.stringify(INITIAL_INSPECTIONS));
    }
    if (!safeLocalStorage.getItem(KEYS.REMARKS)) {
      safeLocalStorage.setItem(KEYS.REMARKS, JSON.stringify(INITIAL_REMARKS));
    }
    if (!safeLocalStorage.getItem(KEYS.PHOTOS)) {
      safeLocalStorage.setItem(KEYS.PHOTOS, JSON.stringify(INITIAL_PHOTOS));
    }
    if (!safeLocalStorage.getItem(KEYS.LOGS)) {
      safeLocalStorage.setItem(KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
    }
    if (!safeLocalStorage.getItem(KEYS.CATEGORIES)) {
      safeLocalStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!safeLocalStorage.getItem(KEYS.INSPECTION_TYPES)) {
      safeLocalStorage.setItem(KEYS.INSPECTION_TYPES, JSON.stringify(DEFAULT_INSPECTION_TYPES));
    }
    if (!safeLocalStorage.getItem(KEYS.STATIONS)) {
      const shared = safeLocalStorage.getItem("PORUCHENIYA_STATIONS_v1") || safeLocalStorage.getItem("SHARED_RAILWAY_STATIONS_v1");
      if (shared) {
        safeLocalStorage.setItem(KEYS.STATIONS, shared);
      } else {
        safeLocalStorage.setItem(KEYS.STATIONS, JSON.stringify(DEFAULT_STATIONS));
      }
    }
  }

  static getStations(): string[] {
    this.init();
    const alternativeKeys = ["PORUCHENIYA_STATIONS_v1", "SHARED_RAILWAY_STATIONS_v1", KEYS.STATIONS];
    for (const key of alternativeKeys) {
      const stored = safeLocalStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            safeLocalStorage.setItem(KEYS.STATIONS, JSON.stringify(parsed));
            return parsed;
          }
        } catch (e) {}
      }
    }
    return DEFAULT_STATIONS;
  }

  static saveStations(stations: string[]) {
    safeLocalStorage.setItem(KEYS.STATIONS, JSON.stringify(stations));
    safeLocalStorage.setItem("PORUCHENIYA_STATIONS_v1", JSON.stringify(stations));
    safeLocalStorage.setItem("SHARED_RAILWAY_STATIONS_v1", JSON.stringify(stations));
  }

  // Get current local system date string (YYYY-MM-DD) for automatic state calculations
  static getTodayString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static getInspections(): Inspection[] {
    this.init();
    const data = safeLocalStorage.getItem(KEYS.INSPECTIONS);
    return data ? JSON.parse(data) : [];
  }

  static saveInspections(inspections: Inspection[]) {
    safeLocalStorage.setItem(KEYS.INSPECTIONS, JSON.stringify(inspections));
  }

  static getRemarks(): Remark[] {
    this.init();
    const data = safeLocalStorage.getItem(KEYS.REMARKS);
    const remarks: Remark[] = data ? JSON.parse(data) : [];
    
    // Automatically flag as "Просрочено" if past due date and not "Выполнено"
    // Also, if the remark was "Просрочено" but its deadline has been extended to the future, restore it to "В работе"
    const today = this.getTodayString();
    let updated = false;
    const mapped = remarks.map(r => {
      if (r.status !== "Выполнено" && r.dueDate < today && r.status !== "Просрочено") {
        updated = true;
        return { ...r, status: "Просрочено" as const };
      }
      if (r.status === "Просрочено" && r.dueDate >= today) {
        updated = true;
        return { ...r, status: "В работе" as const };
      }
      return r;
    });

    if (updated) {
      this.saveRemarks(mapped);
      return mapped;
    }
    return remarks;
  }

  static saveRemarks(remarks: Remark[]) {
    safeLocalStorage.setItem(KEYS.REMARKS, JSON.stringify(remarks));
  }

  static getPhotos(): Photo[] {
    this.init();
    const data = safeLocalStorage.getItem(KEYS.PHOTOS);
    return data ? JSON.parse(data) : [];
  }

  static savePhotos(photos: Photo[]) {
    safeLocalStorage.setItem(KEYS.PHOTOS, JSON.stringify(photos));
  }

  static getLogs(): RemarkLog[] {
    this.init();
    const data = safeLocalStorage.getItem(KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  }

  static saveLogs(logs: RemarkLog[]) {
    safeLocalStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  }

  static getCategories(): string[] {
    this.init();
    const data = safeLocalStorage.getItem(KEYS.CATEGORIES);
    return data ? JSON.parse(data) : [];
  }

  static saveCategories(categories: string[]) {
    safeLocalStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  }

  static getInspectionTypes(): string[] {
    this.init();
    const data = safeLocalStorage.getItem(KEYS.INSPECTION_TYPES);
    return data ? JSON.parse(data) : [];
  }

  static saveInspectionTypes(types: string[]) {
    safeLocalStorage.setItem(KEYS.INSPECTION_TYPES, JSON.stringify(types));
  }

  // Operations
  static addInspection(inspection: Omit<Inspection, 'id'>): Inspection {
    const inspections = this.getInspections();
    const newInsp: Inspection = {
      ...inspection,
      id: "INSP-" + generateId()
    };
    inspections.push(newInsp);
    this.saveInspections(inspections);
    return newInsp;
  }

  static addRemark(remark: Omit<Remark, 'id'>): Remark {
    const remarks = this.getRemarks();
    const newRem: Remark = {
      ...remark,
      id: "REMARK-" + generateId()
    };
    remarks.push(newRem);
    this.saveRemarks(remarks);

    // Write audit log
    this.addLog({
      remarkId: newRem.id,
      date: new Date().toISOString().substring(0, 16).replace('T', ' '),
      author: CURRENT_USER,
      actionType: 'creation',
      details: `Замечание успешно зарегистрировано по объекту "${newRem.objectControl}".`
    });

    return newRem;
  }

  static updateRemark(updatedRemark: Remark) {
    const remarks = this.getRemarks();
    const oldIndex = remarks.findIndex(r => r.id === updatedRemark.id);
    if (oldIndex !== -1) {
      const oldRem = remarks[oldIndex];
      remarks[oldIndex] = updatedRemark;
      this.saveRemarks(remarks);

      // Log changes
      const dateTime = new Date().toISOString().substring(0, 16).replace('T', ' ');
      if (oldRem.status !== updatedRemark.status) {
        this.addLog({
          remarkId: updatedRemark.id,
          date: dateTime,
          author: CURRENT_USER,
          actionType: 'status_change',
          details: `Статус изменен с "${oldRem.status}" на "${updatedRemark.status}".`
        });
      }
      if (oldRem.dueDate !== updatedRemark.dueDate) {
        this.addLog({
          remarkId: updatedRemark.id,
          date: dateTime,
          author: CURRENT_USER,
          actionType: 'due_date_change',
          details: `Срок устранения изменен с ${oldRem.dueDate} на ${updatedRemark.dueDate}.`
        });
      }
      if (
        oldRem.description !== updatedRemark.description ||
        oldRem.objectControl !== updatedRemark.objectControl ||
        oldRem.location !== updatedRemark.location ||
        oldRem.category !== updatedRemark.category
      ) {
        this.addLog({
          remarkId: updatedRemark.id,
          date: dateTime,
          author: CURRENT_USER,
          actionType: 'edit',
          details: `Отредактированы основные параметры замечания.`
        });
      }
    }
  }

  static updateInspection(updatedInspection: Inspection) {
    const inspections = this.getInspections();
    const index = inspections.findIndex(i => i.id === updatedInspection.id);
    if (index !== -1) {
      inspections[index] = updatedInspection;
      this.saveInspections(inspections);
    }
  }

  static deleteInspection(inspectionId: string) {
    const inspections = this.getInspections();
    const filteredInspections = inspections.filter(i => i.id !== inspectionId);
    this.saveInspections(filteredInspections);

    // Delete remarks for this inspection
    const remarks = this.getRemarks();
    const remainingRemarks = remarks.filter(r => r.inspectionId !== inspectionId);
    this.saveRemarks(remainingRemarks);

    // Filter photos for deleted remarks
    const deletedRemarkIds = remarks.filter(r => r.inspectionId === inspectionId).map(r => r.id);
    const photos = this.getPhotos();
    const remainingPhotos = photos.filter(p => !deletedRemarkIds.includes(p.remarkId));
    this.savePhotos(remainingPhotos);

    // Filter logs
    const logs = this.getLogs();
    const remainingLogs = logs.filter(l => !deletedRemarkIds.includes(l.remarkId));
    this.saveLogs(remainingLogs);
  }

  static deleteRemark(remarkId: string) {
    const remarks = this.getRemarks();
    const filteredRemarks = remarks.filter(r => r.id !== remarkId);
    this.saveRemarks(filteredRemarks);

    // Delete photos for this remark
    const photos = this.getPhotos();
    const remainingPhotos = photos.filter(p => p.remarkId !== remarkId);
    this.savePhotos(remainingPhotos);

    // Delete logs for this remark
    const logs = this.getLogs();
    const remainingLogs = logs.filter(l => l.remarkId !== remarkId);
    this.saveLogs(remainingLogs);
  }

  static addPhoto(remarkId: string, filePath: string) {
    const photos = this.getPhotos();
    const newPhoto: Photo = {
      id: "PHOTO-" + generateId(),
      remarkId,
      filePath,
      createdAt: new Date().toISOString()
    };
    photos.push(newPhoto);
    this.savePhotos(photos);

    // Audit log
    const dateTime = new Date().toISOString().substring(0, 16).replace('T', ' ');
    this.addLog({
      remarkId,
      date: dateTime,
      author: CURRENT_USER,
      actionType: 'photo_add',
      details: 'Добавлен фотоматериал подтверждения.'
    });
  }

  static deletePhoto(photoId: string, remarkId: string) {
    const photos = this.getPhotos();
    const filtered = photos.filter(p => p.id !== photoId);
    this.savePhotos(filtered);

    // Audit log
    const dateTime = new Date().toISOString().substring(0, 16).replace('T', ' ');
    this.addLog({
      remarkId,
      date: dateTime,
      author: CURRENT_USER,
      actionType: 'photo_add', // or comment_add
      details: 'Удален один из фотоматериалов.'
    });
  }

  static addLog(log: Omit<RemarkLog, 'id'>) {
    const logs = this.getLogs();
    const newLog: RemarkLog = {
      ...log,
      id: "LOG-" + generateId()
    };
    logs.push(newLog);
    this.saveLogs(logs);
  }

  static addRemarkComment(remarkId: string, commentText: string) {
    const dateTime = new Date().toISOString().substring(0, 16).replace('T', ' ');
    this.addLog({
      remarkId,
      date: dateTime,
      author: CURRENT_USER,
      actionType: 'comment_add',
      details: `Добавлен комментарий к замечанию: "${commentText}"`
    });
  }

  // Stations stats calculation dynamically based on standard specifications
  static getStationStats(): StationStats[] {
    const inspections = this.getInspections();
    const remarks = this.getRemarks();
    const stations = this.getStations();
    
    return stations.map(stationName => {
      // Find remarks bound to this station
      const remarksAtStation = remarks.filter(r => r.station && r.station.trim().toLowerCase() === stationName.trim().toLowerCase());
      
      // Find unique Inspections containing remarks on this station
      const uniqueInspectionIds = Array.from(new Set(remarksAtStation.map(r => r.inspectionId)));

      const overdueCount = remarksAtStation.filter(r => r.status === "Просрочено").length;
      const completedCount = remarksAtStation.filter(r => r.status === "Выполнено").length;

      return {
        name: stationName,
        inspectionsCount: uniqueInspectionIds.length,
        remarksCount: remarksAtStation.length,
        overdueCount,
        completedCount
      };
    });
  }

  // Restore DB from loaded state
  static resetToDefault() {
    safeLocalStorage.removeItem(KEYS.INSPECTIONS);
    safeLocalStorage.removeItem(KEYS.REMARKS);
    safeLocalStorage.removeItem(KEYS.PHOTOS);
    safeLocalStorage.removeItem(KEYS.LOGS);
    safeLocalStorage.removeItem(KEYS.CATEGORIES);
    safeLocalStorage.removeItem(KEYS.STATIONS);
    safeLocalStorage.removeItem(KEYS.INSPECTION_TYPES);
    this.init();
  }

  static loadFromJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.inspections && parsed.remarks && parsed.photos) {
        safeLocalStorage.setItem(KEYS.INSPECTIONS, JSON.stringify(parsed.inspections));
        safeLocalStorage.setItem(KEYS.REMARKS, JSON.stringify(parsed.remarks));
        safeLocalStorage.setItem(KEYS.PHOTOS, JSON.stringify(parsed.photos));
        if (parsed.logs) {
          safeLocalStorage.setItem(KEYS.LOGS, JSON.stringify(parsed.logs));
        }
        if (parsed.categories) {
          safeLocalStorage.setItem(KEYS.CATEGORIES, JSON.stringify(parsed.categories));
        }
        if (parsed.stations) {
          safeLocalStorage.setItem(KEYS.STATIONS, JSON.stringify(parsed.stations));
        }
        if (parsed.inspectionTypes) {
          safeLocalStorage.setItem(KEYS.INSPECTION_TYPES, JSON.stringify(parsed.inspectionTypes));
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  static exportToJson(): string {
    const data = {
      inspections: this.getInspections(),
      remarks: this.getRemarks(),
      photos: this.getPhotos(),
      logs: this.getLogs(),
      categories: this.getCategories(),
      stations: this.getStations(),
      inspectionTypes: this.getInspectionTypes()
    };
    return JSON.stringify(data, null, 2);
  }
}
