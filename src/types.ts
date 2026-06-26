export interface Inspection {
  id: string;
  number: string;
  date: string;
  station?: string;
  inspector: string;
  inspectionType: string;
  comment: string;
}

export interface Remark {
  id: string;
  inspectionId: string;
  station: string;
  category: string;
  objectControl: string;
  location: string;
  violationType: string;
  description: string;
  document: string;
  documentPoint: string;
  correctiveAction: string;
  responsible: string;
  dueDate: string;
  status: 'В работе' | 'На контроле' | 'Выполнено' | 'Просрочено';
  audioPath?: string; // base64 URI for audio recording memo
}

export interface Photo {
  id: string;
  remarkId: string;
  filePath: string; // base64 or URL
  createdAt: string;
}

export interface RemarkLog {
  id: string;
  remarkId: string;
  date: string;
  author: string;
  actionType: 'creation' | 'status_change' | 'due_date_change' | 'photo_add' | 'comment_add' | 'edit';
  details: string;
}

export interface StationStats {
  name: string;
  inspectionsCount: number;
  remarksCount: number;
  overdueCount: number;
  completedCount: number;
}
