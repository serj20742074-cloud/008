import React, { useState, useRef, useEffect } from 'react';
import { Inspection, Remark, Photo } from '../types';
import { DbStore } from '../db';
import { formatDateToRu } from '../utils';
import { Plus, Check, ClipboardCopy, ArrowLeft, Camera, Trash2, Calendar, FileText, User, ShieldAlert, BookOpen, Mic, Square, Volume2, Image } from 'lucide-react';

interface InspectionDetailProps {
  inspection: Inspection;
  remarks: Remark[];
  photos: Photo[];
  onBack: () => void;
  onSelectRemark: (remarkId: string) => void;
  onRefreshData: () => void;
  categories: string[];
}

export default function InspectionDetail({
  inspection,
  remarks,
  photos,
  onBack,
  onSelectRemark,
  onRefreshData,
  categories
}: InspectionDetailProps) {
  const [isAddingRemark, setIsAddingRemark] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

  // Edit Inspection State variables
  const [isEditingInspection, setIsEditingInspection] = useState(false);
  const [editedDate, setEditedDate] = useState(inspection.date);
  const [editedType, setEditedType] = useState(inspection.inspectionType);
  const [editedInspector, setEditedInspector] = useState(inspection.inspector);
  const [editedComment, setEditedComment] = useState(inspection.comment || '');

  // Print Act State variables
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [receiver, setReceiver] = useState('Начальнику Лиховской дистанции пути (ПЧ-4) Савельеву А.Д.');
  const [prescriptionTitle, setPrescriptionTitle] = useState('О принятии мер по обеспечению безопасности движения поездов и устранению выявленных нарушений');
  const [formWriterRole, setFormWriterRole] = useState('Начальник отдела контроля инфраструктуры');
  const [formWriterName, setFormWriterName] = useState('Дмитриев К.Л.');

  // Synchronize dynamic local states on session/inspection switch
  useEffect(() => {
    setEditedDate(inspection.date);
    setEditedType(inspection.inspectionType);
    setEditedInspector(inspection.inspector);
    setEditedComment(inspection.comment || '');
  }, [inspection]);

  const handleSaveInspectionEdit = () => {
    const updated = {
      ...inspection,
      date: editedDate,
      inspectionType: editedType,
      inspector: editedInspector,
      comment: editedComment
    };
    DbStore.updateInspection(updated);
    setIsEditingInspection(false);
    onRefreshData();
  };

  const handleDeleteInspectionClick = () => {
    if (window.confirm('Вы уверены, что хотите безвозвратно удалить эту проверку со всеми её замечаниями, логами и фотографиями?')) {
      DbStore.deleteInspection(inspection.id);
      onRefreshData();
      onBack();
    }
  };

  // Form State for new Remark conforming to the 4 Blocks:
  const [remarkStation, setRemarkStation] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Инфраструктура');
  const [objectControl, setObjectControl] = useState('');
  const [location, setLocation] = useState('');
  const [violationType, setViolationType] = useState('');
  const [description, setDescription] = useState('');

  // Photos state for the current unsaved remark (holding as dataURLs)
  const [tempPhotos, setTempPhotos] = useState<string[]>([]);
  
  // Audio state
  const [tempAudioPath, setTempAudioPath] = useState<string | null>(null);

  // Block 3: Normative (We keep state for type contract, although excluded from form inputs)
  const [document, setDocument] = useState('');
  const [documentPoint, setDocumentPoint] = useState('');

  // Block 4: Remediation
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [responsible, setResponsible] = useState('');
  const [dueDate, setDueDate] = useState('2026-06-20'); // Defaults to next week

  const [error, setError] = useState('');

  // NEW CAMERA & AUDIO HARDWARE INTERFACES STATES
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const inspectionRemarks = remarks.filter(r => r.inspectionId === inspection.id);

  // Initialize station and release camera stream on unmount
  useEffect(() => {
    const list = DbStore.getStations();
    if (list.length > 0) {
      setRemarkStation(list[0]);
    }
    return () => {
      stopCamera();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera hardware access rejected or unavailable inside iframe:", err);
      setCameraError('Камера недоступна (ограничено свойствами iframe). Воспользуйтесь симуляцией.');
      setIsCameraActive(true); // Still show interactive module with simulated snap fallback
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && mediaStreamRef.current) {
      try {
        const canvas = window.document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1); // mirror flip matching standard front-facing tablet preview
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setTempPhotos(prev => [...prev, dataUrl]);
          stopCamera();
        }
      } catch (err) {
        simulatePhotoCapture();
      }
    } else {
      simulatePhotoCapture();
    }
  };

  const simulatePhotoCapture = () => {
    const canvas = window.document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 640, 420);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 420);

      // Grid rails simulation
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 640; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 420); ctx.stroke();
      }
      ctx.strokeStyle = '#ef4444'; // Red alignment rails
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(100, 420); ctx.lineTo(260, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(540, 420); ctx.lineTo(380, 0); ctx.stroke();

      // UI Info HUD Overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(10, 10, 620, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`СНИМОК С КАМЕРЫ ПЛАНШЕТА (РЖД MOBILE - AUTONOMOUS)`, 20, 30);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`GPS: 55.7558° N, 37.6173° E | СТАНЦИЯ: ${remarkStation || 'Мультистанционная'} | UTC: ${new Date().toISOString().replace('T',' ' ).slice(0,19)}`, 20, 48);

      // Defect marker crosshair
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(320, 210, 35, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(320, 160); ctx.lineTo(320, 260); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(270, 210); ctx.lineTo(370, 210); ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('ВЫЯВЛЕННЫЙ ДЕФЕКТ ШАБЛОНА КОЛЕИ', 310, 150);

      const dataUrl = canvas.toDataURL('image/jpeg');
      setTempPhotos(prev => [...prev, dataUrl]);
      stopCamera();
    }
  };

  // Screenshots clipboard & simulations
  const handleScreenshotPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData) {
      const items = Array.from(e.clipboardData.items) as DataTransferItem[];
      items.forEach(item => {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                setTempPhotos(prev => [...prev, reader.result as string]);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      });
    }
  };

  const simulateScreenshotPaste = () => {
    const canvas = window.document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 600, 360);
      
      // Draw simulated electronic graph
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 180);
      for (let x = 0; x < 600; x += 10) {
        const y = 180 + Math.sin(x * 0.05) * 50 + Math.cos(x * 0.1) * 20 + (x > 300 && x < 400 ? -80 : 0);
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // UI HUD Overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.fillRect(10, 10, 580, 40);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('ВСТАВКА СКРИНШОТА ИЗ БУФЕРА ОБМЕНА (SCREENSHOT)', 20, 26);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText('Снято на мобильном терминале ЕК АСУ ПЗ', 20, 42);

      // Red failure indicator
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(320, 60, 100, 100);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('ALARM (OTSTUPLENIE 3 STEPENI)', 310, 80);

      const dataUrl = canvas.toDataURL('image/jpeg');
      setTempPhotos(prev => [...prev, dataUrl]);
    }
  };

  // AUDIO RECORDING LOGIC
  const startAudioRecording = async () => {
    setAudioDuration(0);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setTempAudioPath(reader.result);
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop stream tracks
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecordingAudio(true);
      
      timerIntervalRef.current = setInterval(() => {
        setAudioDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.warn("Microphone access rejected or unavailable. Falling back to simulated audio.", err);
      // Simulate recording anyway!
      setIsRecordingAudio(true);
      timerIntervalRef.current = setInterval(() => {
        setAudioDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const stopAudioRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    } else {
      // Simulate recording base64 data URL
      setIsRecordingAudio(false);
      // We generate a tiny 0.4s silent wave encoded in base64 as fallback wav
      const mockAudioBase64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA=="; 
      setTempAudioPath(mockAudioBase64);
    }
  };

  const removeTempAudio = () => {
    setTempAudioPath(null);
  };

  // File loading handler for real tablet/browser testing
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setTempPhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeTempPhoto = (index: number) => {
    setTempPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitRemark = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TЗ: "сделай необязательное заполнение поля при сохранении" -> Optional saves with beautiful fallback defaults
    const finalDescription = description.trim() || 'Описание замечания отсутствует (зарегистрировано по упрощенной форме)';
    const finalViolationType = finalDescription.slice(0, 50) + (finalDescription.length > 50 ? '...' : '');
    const finalObjectControl = 'По категории: ' + category;
    const finalLocation = 'Не определено';
    const finalResponsible = responsible.trim() || 'Дорожный мастер (Довгалева Е.Е.)';
    const finalDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

    // Add remark with Base64 audio path property if generated
    const newRem = DbStore.addRemark({
      inspectionId: inspection.id,
      station: remarkStation || DbStore.getStations()[0] || 'Станция Лихая',
      category,
      objectControl: finalObjectControl,
      location: finalLocation,
      violationType: finalViolationType,
      description: finalDescription,
      document: document || '',
      documentPoint: documentPoint || '',
      correctiveAction: correctiveAction || 'Устранить несоответствие в регламентные сроки',
      responsible: finalResponsible,
      dueDate: finalDueDate,
      status: 'В работе',
      audioPath: tempAudioPath || undefined
    });

    // Save associated photos
    tempPhotos.forEach(pData => {
      DbStore.addPhoto(newRem.id, pData);
    });

    // Reset Form
    const stations = DbStore.getStations();
    setRemarkStation(stations[0] || '');
    setCategory(categories[0] || 'Инфраструктура');
    setObjectControl('');
    setLocation('');
    setViolationType('');
    setDescription('');
    setTempPhotos([]);
    setTempAudioPath(null);
    setDocument('');
    setDocumentPoint('');
    setCorrectiveAction('');
    setResponsible('');
    setDueDate('2026-06-20');
    setError('');

    onRefreshData();
    setActiveTab('list');
    setIsAddingRemark(false);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "В работе": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "На контроле": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Выполнено": return "bg-blue-105 text-blue-800 border-blue-200";
      case "Просрочено": return "bg-red-100 text-red-800 border-red-200 animate-pulse";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (showPrintPreview) {
    return (
      <div className="space-y-6 text-slate-800 printable-act-overlay font-sans" id="act-print-preview-container">
        {/* Control bar - visible in browser preview but hidden during printing via .no-print class */}
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
          <div className="space-y-1">
            <h3 className="text-md font-bold text-white flex items-center space-x-1.5">
              <span>🗎 Генератор Направлений & Актов Проверок</span>
              <span className="bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">Печатная Форма</span>
            </h3>
            <p className="text-xs text-slate-300">
              Настройте параметры сопроводительного письма и распечатайте акт или сохраните в файл PDF.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                window.print();
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <span>🖨️ Распечатать / PDF</span>
            </button>
            <button
              onClick={() => setShowPrintPreview(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-lg transition cursor-pointer"
            >
              <span>Закрыть предпросмотр</span>
            </button>
          </div>
        </div>

        {/* Dynamic Settings Pane - Hidden on Paper */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm no-print space-y-4">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider pb-2 border-b border-slate-150">
            Параметры официального бланка Акта
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Получатель предписания (Нарушитель) *</label>
              <textarea
                rows={2}
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="Пример: Начальнику Лиховской дистанции путей ПЧ-4 Савельеву А.Д."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-slate-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Заголовок требования *</label>
              <textarea
                rows={2}
                value={prescriptionTitle}
                onChange={(e) => setPrescriptionTitle(e.target.value)}
                placeholder="Предписание органов надзора и контроля..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-slate-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Должность составителя *</label>
              <input
                type="text"
                value={formWriterRole}
                onChange={(e) => setFormWriterRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-slate-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">ФИО составителя *</label>
              <input
                type="text"
                value={formWriterName}
                onChange={(e) => setFormWriterName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-slate-500 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Paper Container */}
        <div className="bg-white rounded-lg border border-slate-300 p-8 md:p-12 shadow-xl printable-page max-w-4xl mx-auto space-y-6 text-black relative">
          <div className="flex justify-between items-start border-b-2 border-red-700 pb-4">
            <div className="space-y-1">
              <span className="text-xs font-bold tracking-widest text-slate-600 block leading-tight uppercase font-sans">
                ОАО «РЖД» • ДЕПАРТАМЕНТ КОНТРОЛЯ ИНФРАСТРУКТУРЫ
              </span>
              <span className="text-xs text-slate-500 block leading-snug">
                Территориальный участок Северо-Кавказской железной дороги
              </span>
            </div>
            <div className="text-right text-[10px] text-slate-400 font-mono">
              Форма АКУ-14 / ИНСП <br />
              Утверждена ЦЗ-РЖД
            </div>
          </div>

          <div className="flex justify-end text-xs font-semibold leading-relaxed">
            <div className="w-1/2 text-left bg-slate-50 border-l-2 border-slate-300 p-3 rounded-r whitespace-pre-wrap">
              <span className="text-[10px] uppercase text-slate-400 block font-normal mb-1">Получатель (Нарушителю для мер):</span>
              {receiver}
            </div>
          </div>

          <div className="text-center space-y-2 py-4">
            <h1 className="font-extrabold text-lg tracking-tight uppercase leading-snug">
              АКТ ПРОВЕРКИ И ПРЕДПИСАНИЕ ОБ УСТРАНЕНИИ
            </h1>
            <div className="flex justify-center items-center space-x-6 text-xs text-slate-600 font-mono">
              <span>Документ № <strong className="text-black">{inspection.number}</strong></span>
              <span>Дата составления: <strong className="text-black">{formatDateToRu(inspection.date)}</strong></span>
            </div>
          </div>

          <div className="text-xs md:text-sm leading-relaxed text-slate-900 space-y-3 font-sans">
            <p>
              Разрешите заявить, что в соответствии с Постановлением Правительства РФ, Правилами технической эксплуатации железных дорог РФ и корпоративными стандартами ОАО «РЖД» <strong>{formatDateToRu(inspection.date)}</strong> было произведено обследование железнодорожной путевой инфраструктуры.
            </p>
            <p>
              Проверку на путях осуществил проверяющий: <strong className="underline underline-offset-2">{inspection.inspector}</strong>. 
              Вид проводимых мероприятий: <strong className="italic">{inspection.inspectionType}</strong>.
            </p>
            {inspection.comment && (
              <p className="bg-slate-50 p-3 rounded border border-slate-150 text-xs italic text-slate-700">
                <strong>Дополнительное примечание инспектора:</strong> «{inspection.comment}»
              </p>
            )}
            <p>
              В ходе осмотра объектов комиссионно зафиксированы нижеследующие нарушения, отступления и замечания, требующие немедленного принятия мер к устранению нарушения ответственным персоналом:
            </p>
          </div>

          <div className="overflow-x-auto text-black">
            <table className="w-full text-left text-xs border-collapse border border-slate-300 leading-normal">
              <thead>
                <tr className="bg-slate-100 text-slate-750 font-bold border-b border-slate-300">
                  <th className="border border-slate-300 p-2 text-center">№</th>
                  <th className="border border-slate-300 p-2">Станция</th>
                  <th className="border border-slate-300 p-2">Категория замечания / Описание</th>
                  <th className="border border-slate-300 p-2">Рекомендуемые меры по устранению</th>
                  <th className="border border-slate-300 p-2">Ответственный</th>
                  <th className="border border-slate-300 p-2 text-center">Срок</th>
                </tr>
              </thead>
              <tbody>
                {inspectionRemarks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-slate-300 p-8 text-center text-slate-400 italic">
                      Замечания в ходе данной проверки не зарегистрированы. Инфраструктура содержится в исправном состоянии.
                    </td>
                  </tr>
                ) : (
                  inspectionRemarks.map((rem, idx) => (
                    <tr key={rem.id} className="border-b border-slate-200">
                      <td className="border border-slate-300 p-2 text-center font-mono font-bold bg-slate-50">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 font-bold text-slate-900">{rem.station}</td>
                      <td className="border border-slate-300 p-2 space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block font-sans">
                          {rem.category}
                        </span>
                        <div className="font-semibold text-slate-900">{rem.violationType}</div>
                        <div className="text-[11px] text-slate-700 italic leading-snug">{rem.description}</div>
                      </td>
                      <td className="border border-slate-300 p-2 text-slate-800 text-[11px] whitespace-pre-wrap">{rem.correctiveAction || 'Устранить в нормативные сроки'}</td>
                      <td className="border border-slate-300 p-2 font-medium text-slate-900">{rem.responsible}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono font-bold text-red-700">{formatDateToRu(rem.dueDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Photo evidence gallery embedded to output pdf */}
          {inspectionRemarks.some(rem => photos.some(p => p.remarkId === rem.id)) && (
            <div className="pt-4 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block border-b border-slate-200 pb-1.5">
                ПРИЛОЖЕНИЕ: МАТЕРИАЛЫ И ФОТОТАБЛИЦА НАРУШЕНИЙ
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {inspectionRemarks.map((rem, remIdx) => {
                  const remPhotos = photos.filter(p => p.remarkId === rem.id);
                  if (remPhotos.length === 0) return null;
                  return remPhotos.map((photo, photoIdx) => (
                    <div key={photo.id} className="border border-slate-200 rounded p-1.5 bg-slate-50 flex flex-col justify-between space-y-1">
                      <img
                        src={photo.filePath}
                        alt={`Evidence for Item ${remIdx + 1}`}
                        className="w-full h-24 object-cover rounded border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-[9px] font-mono leading-tight text-slate-500">
                        <strong className="text-slate-800">Фото {remIdx + 1}.{photoIdx + 1}</strong>: к пункту {remIdx + 1} ({rem.station})
                      </div>
                    </div>
                  ));
                })}
              </div>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 p-4 rounded text-[11px] leading-snug text-slate-600 space-y-1 font-sans">
            <h5 className="font-bold text-slate-850 uppercase">Меры реагирования на предписание:</h5>
            <p>1. В соответствии со стандартами ОАО «РЖД» руководителю подразделения надлежит организовать работы по ликвидации нарушений.</p>
            <p>2. Фотоматериалы устных предписаний должны быть зарегистрированы в комплексе ЕК АСУ ПЗ не позже даты, указанной в графе «Срок».</p>
            <p>3. Ответственность за необеспечение безопасности несут должностные лица указанные в акте.</p>
          </div>

          <div className="pt-4 grid grid-cols-2 gap-12 text-xs font-sans">
            <div className="space-y-4">
              <span className="font-bold text-slate-600 block">Акт выписал (Инспектор):</span>
              <div className="border-b border-black pt-4"></div>
              <div className="flex justify-between text-slate-500">
                <span>(Должность, подпись)</span>
                <span>{inspection.inspector}</span>
              </div>
            </div>
            <div className="space-y-4">
              <span className="font-bold text-slate-600 block">С предписанием ознакомлен:</span>
              <div className="border-b border-black pt-4"></div>
              <div className="flex justify-between text-slate-500">
                <span>(Представитель нарушителя)</span>
                <span>_____________________ Ф.И.О.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id={`inspection-container-${inspection.id}`}>
      {/* Detail Header Info or Editor Form */}
      {isEditingInspection ? (
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-md" id="inspection-editor-panel">
          <h3 className="text-md font-bold mb-4 uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
            Редактирование параметров проверки № {inspection.number}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Дата проверки *</label>
              <input
                type="date"
                required
                value={editedDate}
                onChange={(e) => setEditedDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-750 text-white rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Проверяющий *</label>
              <input
                type="text"
                required
                value={editedInspector}
                onChange={(e) => setEditedInspector(e.target.value)}
                className="w-full bg-slate-800 border border-slate-750 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Вид проводимой проверки</label>
              <select
                value={editedType}
                onChange={(e) => setEditedType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-755 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-550"
              >
                {DbStore.getInspectionTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-bold text-slate-400 block mb-1">Комментарий к проверке</label>
              <textarea
                rows={2}
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
                placeholder="Дополнительные примечания..."
                className="w-full bg-slate-800 border border-slate-750 text-slate-100 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => {
                setIsEditingInspection(false);
                setEditedDate(inspection.date);
                setEditedType(inspection.inspectionType);
                setEditedInspector(inspection.inspector);
                setEditedComment(inspection.comment || '');
              }}
              className="bg-slate-800 hover:bg-slate-720 text-slate-300 text-xs font-bold px-4 py-2 rounded-lg transition"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSaveInspectionEdit}
              className="bg-red-650 hover:bg-red-550 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-md"
            >
              Сохранить изменения
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-md">
          <div className="space-y-4 w-full lg:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onBack}
                className="flex items-center space-x-1.5 text-slate-305 hover:text-white text-xs font-semibold bg-slate-800 hover:bg-slate-730 px-3 py-1.5 rounded-lg transition"
                id="btn-back-inspections"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Назад к проверкам</span>
              </button>

              <button
                onClick={() => setIsEditingInspection(true)}
                className="flex items-center space-x-1.5 text-slate-305 hover:text-white text-xs font-semibold bg-slate-800 hover:bg-slate-720 px-3 py-1.5 rounded-lg transition border border-slate-700"
                id="btn-edit-inspection-trigger"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Изменить параметры</span>
              </button>

              <button
                onClick={() => setShowPrintPreview(true)}
                className="flex items-center space-x-1.5 text-white text-xs font-bold bg-emerald-750 hover:bg-emerald-650 px-3 py-1.5 rounded-lg transition shadow-sm"
                id="btn-trigger-pdf-act"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                <span>Сформировать АКТ (PDF)</span>
              </button>

              <button
                onClick={handleDeleteInspectionClick}
                className="flex items-center space-x-1.5 text-red-400 hover:text-white hover:bg-red-700 hover:border-red-650 text-xs font-semibold bg-slate-800 px-3 py-1.5 rounded-lg transition border border-rose-950/70"
                id="btn-delete-inspection-trigger"
                title="Удалить эту проверку полностью"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500 hover:text-white" />
                <span>Удалить проверку</span>
              </button>
            </div>
            
            <div className="pt-1">
              <div className="flex items-center space-x-3">
                <span className="bg-red-650 text-white px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider">
                  № {inspection.number}
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">Карточка проверки</h2>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                {inspection.inspectionType} • {Array.from(new Set(inspectionRemarks.map(r => r.station).filter(Boolean))).join(', ') || 'Мультистанционная'}
              </p>
            </div>
          </div>

          {/* Info Grid Metadata */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs border-t lg:border-t-0 lg:border-l border-slate-750 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-auto font-mono text-slate-300">
            <div>
              <span className="text-slate-450 block font-sans text-[10px] uppercase">Дата проверки:</span>
              <span className="font-bold text-slate-100">{formatDateToRu(inspection.date)}</span>
            </div>
            <div>
              <span className="text-slate-450 block font-sans text-[10px] uppercase">Проверяющий:</span>
              <span className="font-bold text-slate-100 truncate inline-block max-w-[150px]">{inspection.inspector}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-450 block font-sans text-[10px] uppercase">Комментарий проверки:</span>
              <span className="italic text-slate-200">{inspection.comment || 'Комментарий не внесен'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Inside This Inspection Session */}
      <div className="flex border-b border-slate-200 space-x-2" id="inspection-tab-nav">
        <button
          onClick={() => { setActiveTab('list'); setIsAddingRemark(false); }}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition ${
            activeTab === 'list'
              ? 'border-slate-850 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-855'
          }`}
          id="tab-inspection-remarks"
        >
          Замечания проверки ({inspectionRemarks.length})
        </button>
        <button
          onClick={() => { setActiveTab('add'); setIsAddingRemark(true); }}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'add'
              ? 'border-slate-850 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-855'
          }`}
          id="tab-add-remark"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить замечание</span>
        </button>
      </div>

      {/* Screen Mode 1: List of remarks */}
      {activeTab === 'list' && (
        <div className="space-y-4" id="inspection-remarks-list">
          {inspectionRemarks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-slate-700 font-bold text-lg">Замечания в проверке отсутствуют</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                Все проверки объектов железнодорожной инфраструктуры должны сопровождаться фотофиксацией замечаний при обнаружении некорректностей.
              </p>
              <button
                onClick={() => { setActiveTab('add'); setIsAddingRemark(true); }}
                className="mt-4 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition inline-flex items-center space-x-1.5"
                id="btn-trigger-add-first-remark"
              >
                <Plus className="w-4 h-4" />
                <span>Зафиксировать первое замечание</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="session-remarks-grid">
              {inspectionRemarks.map((rem) => {
                const remPhotos = photos.filter(p => p.remarkId === rem.id);
                return (
                  <div
                    key={rem.id}
                    onClick={() => onSelectRemark(rem.id)}
                    className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-350 cursor-pointer transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] font-bold font-mono tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md uppercase">
                            {rem.category}
                          </span>
                          {rem.station && (
                            <span className="text-[10px] font-bold font-mono tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md">
                              🚂 {rem.station}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getStatusClass(rem.status)}`}>
                          {rem.status}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-md line-clamp-2 mb-2">
                        {rem.violationType}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                        {rem.description}
                      </p>

                      {/* Photo Thumbnail Row if any exist */}
                      {remPhotos.length > 0 && (
                        <div className="flex space-x-2 overflow-x-auto pb-2.5 mb-4" onClick={(e) => e.stopPropagation()}>
                          {remPhotos.map((p, pIdx) => (
                            <img
                              key={p.id}
                              src={p.filePath}
                              alt={`Миниатюра ${pIdx + 1}`}
                              className="w-16 h-12 object-cover rounded-md border border-slate-200 flex-shrink-0 cursor-zoom-in"
                              referrerPolicy="no-referrer"
                              onClick={() => onSelectRemark(rem.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs text-slate-400 font-mono">
                      <span>Срок: <strong className="text-slate-700">{formatDateToRu(rem.dueDate)}</strong></span>
                      <span>Отв: <strong className="text-slate-700 truncate max-w-32 inline-block align-bottom">{rem.responsible}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Screen Mode 2: Structured Add Remark Form based on 4-Block Specification */}
      {activeTab === 'add' && (
        <form onSubmit={handleSubmitRemark} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="structured-remark-form">
          <div className="bg-slate-50 border-b border-slate-150 px-6 py-4">
            <h3 className="font-bold text-slate-800">Регистрация замечания в текущую проверку</h3>
            <p className="text-xs text-slate-500">Заполните блоки в соответствии с регламентом РЖД</p>
          </div>

          {error && (
            <div className="mx-6 mt-6 bg-red-50 text-red-800 p-3 rounded-lg text-sm border border-red-100 font-medium" id="remark-form-error">
              {error}
            </div>
          )}

          <div className="p-6 space-y-8">
             {/* БЛОК 1. НАРУШЕНИЕ */}
            <div className="space-y-4" id="form-block-1">
              <div className="flex items-center space-x-2 text-slate-800 border-b border-slate-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold font-mono">1</span>
                <h4 className="font-bold text-sm uppercase tracking-wider">Блок 1. Фиксация нарушения</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Железнодорожная станция */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Железнодорожная станция *</label>
                  <select
                    value={remarkStation}
                    onChange={(e) => setRemarkStation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 font-semibold text-slate-800"
                  >
                    {DbStore.getStations().map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* Категория */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Категория замечания (органа контроля)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 font-semibold text-slate-800"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Описание замечания */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Описание замечания (необязательно)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите детальное состояние выявленного отступления от нормативных документов (необязательно при быстром сохранении)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>

            {/* БЛОК 2. ВАКАНТНЫЕ МАТЕРИАЛЫ С ПРЕВЬЮ */}
            <div className="space-y-6" id="form-block-2">
              <div className="flex items-center space-x-2 text-slate-800 border-b border-slate-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold font-mono">2</span>
                <h4 className="font-bold text-sm uppercase tracking-wider">Блок 2. Мультимедиа материалы (Камера, Скриншоты, Аудио)</h4>
              </div>

              {/* Grid deck of multimedia attachments */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* PART A: PHOTO CAMERA PORTAL */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1 mb-2">
                      <Camera className="w-4 h-4 text-[#b31f24]" />
                      <span>А: Фотосъемка с планшета</span>
                    </h5>
                    <p className="text-slate-500 text-xs mb-3">Сделайте снимок нарушения путевого шаблона встроенной камерой устройства</p>
                    
                    {isCameraActive ? (
                      <div className="relative bg-black rounded-lg overflow-hidden aspect-video border border-slate-300 mb-3 flex flex-col items-center justify-center">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-full object-cover transform scale-x-[-1]" 
                        />
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="bg-[#b31f24] hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1 shadow-lg"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Сделать кадр</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-semibold transition"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="w-full bg-[#b31f24] hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-sm mb-2"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Активировать камеру 📹</span>
                      </button>
                    )}

                    {cameraError && (
                      <p className="text-[10px] text-amber-700 font-medium mb-2">{cameraError}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={simulatePhotoCapture}
                    className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold py-1.5 px-3 rounded-lg text-[11px] transition flex items-center justify-center space-x-1"
                  >
                    <span>Имитировать кадр камеры ✨</span>
                  </button>
                </div>

                {/* PART B: SCREENSHOT CLIPBOARD PASTER */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1 mb-2">
                      <Image className="w-4 h-4 text-sky-600" />
                      <span>Б: Вставка скриншота</span>
                    </h5>
                    <p className="text-slate-500 text-xs mb-3">Нажмите в область ниже и импортируйте изображение из буфера обмена (Ctrl+V)</p>
                    
                    <div 
                      tabIndex={0}
                      onPaste={handleScreenshotPaste}
                      className="border-2 border-dashed border-sky-300/60 bg-white active:bg-blue-50/50 focus:bg-blue-50/45 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition h-28 outline-none mb-3"
                      title="Кликните сюда, затем зажмите Ctrl+V для вставки"
                    >
                      <Image className="w-6 h-6 text-sky-400 mb-1" />
                      <span className="text-[11px] font-bold text-slate-700">Вставить скриншот</span>
                      <span className="text-[9px] text-slate-400 font-mono">(Нажмите Ctrl+V)</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={simulateScreenshotPaste}
                    className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold py-1.5 px-3 rounded-lg text-[11px] transition flex items-center justify-center space-x-1"
                  >
                    <span>Сгенерировать скриншот из буфера 📊</span>
                  </button>
                </div>

                {/* PART C: AUDIO RECORDER MEMO */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1 mb-2">
                      <Mic className="w-4 h-4 text-emerald-600" />
                      <span>В: Аудиозапись замечания</span>
                    </h5>
                    <p className="text-slate-500 text-xs mb-3">Запишите голосовое пояснение к дефекту для экономии времени при заполнении</p>
                    
                    {isRecordingAudio ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex flex-col items-center justify-center space-y-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                          <span className="text-xs font-bold text-red-700">ИДЁТ ЗАПИСЬ...</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-slate-700">Duration: {audioDuration}s</span>
                        <button
                          type="button"
                          onClick={stopAudioRecording}
                          className="bg-slate-900 hover:bg-black text-white py-1 px-3 rounded-lg text-[11px] font-bold transition flex items-center space-x-1"
                        >
                          <Square className="w-3 h-3 text-red-500" />
                          <span>Остановить и Сохранить</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startAudioRecording}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-sm mb-2"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Начать запись аудио 🎙️</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const mockAudioBase64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA=="; 
                      setTempAudioPath(mockAudioBase64);
                    }}
                    className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold py-1.5 px-3 rounded-lg text-[11px] transition flex items-center justify-center space-x-1"
                  >
                    <span>Имитировать запись аудио 🎵</span>
                  </button>
                </div>
              </div>

              {/* Standalone File Input Fallback Selector */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-bold text-slate-700 block">Классический файловый импорт</span>
                  <span className="text-[10px] text-slate-400 block">Загрузить медиаматериалы из памяти планшета</span>
                </div>
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="remark-gallery-file-input"
                  />
                  <label
                    htmlFor="remark-gallery-file-input"
                    className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-350 cursor-pointer font-bold px-4 py-2.5 rounded-lg text-xs shadow-sm transition inline-block text-center"
                  >
                    Запустить системный проводник 📂
                  </label>
                </div>
              </div>

              {/* Materials summary decks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* A: Captured Photos Deck */}
                {tempPhotos.length > 0 && (
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-150">
                    <span className="text-xs font-bold text-slate-600 block">Прикрепленные снимки ({tempPhotos.length}):</span>
                    <div className="flex flex-wrap gap-2">
                      {tempPhotos.map((photoStr, index) => (
                        <div key={index} className="relative w-16 h-14 rounded overflow-hidden border border-slate-200 group shadow-sm">
                          <img
                            src={photoStr}
                            alt={`Загрузка ${index + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => removeTempPhoto(index)}
                            className="absolute top-0.5 right-0.5 bg-red-650 hover:bg-red-700 text-white rounded-full p-0.5 shadow transition"
                            title="Удалить снимок"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* B: Audio Record Deck */}
                {tempAudioPath && (
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-150 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-600 block">Голосовая заметка:</span>
                      <audio src={tempAudioPath} controls className="h-7 w-full mt-1" />
                    </div>
                    <button
                      type="button"
                      onClick={removeTempAudio}
                      className="text-red-650 hover:text-red-700 text-[10px] font-bold text-left flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3 inline" />
                      <span>Удалить аудиозапись</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* БЛОК 3 ИСКЛЮЧЕН СОГЛАСНО ТЗ */}

            {/* БЛОК 4. УСТРАНЕНИЕ */}
            <div className="space-y-4" id="form-block-4">
              <div className="flex items-center space-x-2 text-slate-800 border-b border-slate-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold font-mono">4</span>
                <h4 className="font-bold text-sm uppercase tracking-wider">Блок 4. Мероприятия и устранение</h4>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Мероприятия по устранению нарушения</label>
                <textarea
                  rows={2}
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="Опишите комплекс мер по приведению объекта к нормативным критериям..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ответственный исполнитель (необязательно)</label>
                  <input
                    type="text"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    placeholder="Пример: Савельев А.Д. (Дорожный мастер)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Срок устранения (необязательно)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3 border-t border-slate-150">
            <button
              type="button"
              onClick={() => { setActiveTab('list'); setIsAddingRemark(false); }}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-350 font-bold px-4 py-2.5 rounded-lg text-sm transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-5 py-2.5 rounded-lg text-sm transition shadow-sm"
              id="btn-save-new-remark"
            >
              Сохранить замечание
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
