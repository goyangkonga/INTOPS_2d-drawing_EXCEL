/**
 * Drawing Dimension Extractor
 * GitHub Pages 정적 배포용 — 서버 불필요, Gemini API 직접 호출
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Table as TableIcon,
  Trash2,
  Plus,
  Settings,
  X,
  Key,
  ChevronDown,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dimension {
  label: string;
  value: number | string;
  unit: string;
  tolerance: string;
  max: number | string;
  min: number | string;
  note: string;
}

type Status = 'idle' | 'processing' | 'done' | 'error';

// ─── Button ───────────────────────────────────────────────────────────────────

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
  }
>(({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shadow-sm',
    outline: 'border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700',
    ghost: 'hover:bg-zinc-100 text-zinc-600',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
Button.displayName = 'Button';

// ─── Badge ────────────────────────────────────────────────────────────────────

const Badge = ({ children, color = 'zinc' }: { children: React.ReactNode; color?: string }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
      color === 'zinc' && 'bg-zinc-100 text-zinc-600',
      color === 'blue' && 'bg-blue-100 text-blue-700',
      color === 'green' && 'bg-green-100 text-green-700',
    )}
  >
    {children}
  </span>
);

// ─── Settings Modal ───────────────────────────────────────────────────────────

function SettingsModal({
  open,
  onClose,
  apiKey,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  onSave: (key: string) => void;
}) {
  const [draft, setDraft] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setDraft(apiKey);
  }, [apiKey, open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-zinc-500" />
                <h3 className="font-semibold text-sm">설정 / Configuration</h3>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-900 transition-colors rounded-md p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* API Key field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3 h-3" />
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="AIza..."
                    className="w-full pr-20 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none
                               transition-all text-sm font-mono"
                  />
                  <button
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-700"
                  >
                    {showKey ? '숨기기' : '표시'}
                  </button>
                </div>
                <div className="flex gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    API 키는 브라우저 localStorage에만 저장되며, 외부 서버로 전송되지 않습니다.
                    <br />
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Google AI Studio에서 무료 키 발급 →
                    </a>
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => onSave(draft.trim())}
                disabled={!draft.trim()}
              >
                <CheckCircle2 className="w-4 h-4" />
                저장하기
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Drag & Drop Upload Zone ──────────────────────────────────────────────────

function UploadZone({
  file,
  onFile,
  onClear,
}: {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped?.type === 'application/pdf') onFile(dropped);
    },
    [onFile],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type === 'application/pdf') onFile(selected);
    e.target.value = '';
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-3 min-h-[160px]',
        !file && 'cursor-pointer',
        dragging
          ? 'border-blue-400 bg-blue-50'
          : file
            ? 'border-green-400 bg-green-50'
            : 'border-zinc-200 hover:border-blue-300 hover:bg-blue-50/40',
      )}
    >
      <input ref={inputRef} type="file" accept=".pdf" onChange={handleChange} className="hidden" />

      <div
        className={cn(
          'p-3 rounded-full',
          file ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400',
        )}
      >
        <FileText className="w-6 h-6" />
      </div>

      {file ? (
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-zinc-800 break-all max-w-[220px]">{file.name}</p>
          <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="text-xs text-red-500 hover:underline mt-1"
          >
            파일 변경
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-700">
            PDF 도면 업로드
          </p>
          <p className="text-xs text-zinc-400 mt-1">드래그 앤 드롭 또는 클릭</p>
        </div>
      )}
    </div>
  );
}

// ─── Result Table ─────────────────────────────────────────────────────────────

function ResultTable({
  dimensions,
  onUpdate,
  onRemove,
  onAdd,
  isProcessing,
}: {
  dimensions: Dimension[];
  onUpdate: (i: number, field: keyof Dimension, value: string | number) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
  isProcessing: boolean;
}) {
  const cols: { key: keyof Dimension; label: string; cls?: string }[] = [
    { key: 'label', label: '항목명 (Label)' },
    { key: 'value', label: '기준값 (Value)', cls: 'font-mono' },
    { key: 'unit', label: '단위 (Unit)', cls: 'font-mono' },
    { key: 'tolerance', label: '공차 (Tolerance)', cls: 'font-mono text-zinc-500' },
    { key: 'max', label: 'Max', cls: 'font-mono text-green-700' },
    { key: 'min', label: 'Min', cls: 'font-mono text-blue-700' },
    { key: 'note', label: '비고 (Note)', cls: 'text-zinc-500' },
  ];

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col min-h-[480px]">
      {/* Table header bar */}
      <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-semibold">치수 목록</h2>
          {dimensions.length > 0 && (
            <Badge color="blue">{dimensions.length}개</Badge>
          )}
        </div>
        {dimensions.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4" />
            행 추가
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {dimensions.length > 0 ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                {cols.map((c) => (
                  <th
                    key={c.key}
                    className="px-4 py-2.5 font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {c.label}
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              <AnimatePresence initial={false}>
                {dimensions.map((dim, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="hover:bg-zinc-50/60 transition-colors group"
                  >
                    {cols.map((c) => (
                      <td key={c.key} className="px-4 py-2">
                        <input
                          type="text"
                          value={String(dim[c.key])}
                          onChange={(e) => onUpdate(idx, c.key, e.target.value)}
                          className={cn(
                            'w-full bg-transparent border-none focus:ring-0 outline-none p-0 text-xs min-w-[60px]',
                            c.cls,
                          )}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <button
                        onClick={() => onRemove(idx)}
                        className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-12 text-center">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 animate-spin text-zinc-200" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-700">도면 분석 중...</p>
                  <p className="text-xs text-zinc-400">도면 복잡도에 따라 10~30초 소요될 수 있습니다.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-zinc-50 p-4 rounded-full inline-block">
                  <TableIcon className="w-8 h-8 text-zinc-200" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-700">아직 분석 결과가 없습니다</p>
                  <p className="text-xs max-w-[240px]">
                    PDF 도면을 업로드하고 API 키를 설정한 후<br />「치수 추출 시작」을 클릭하세요.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer tip */}
      {dimensions.length > 0 && (
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-[10px] text-zinc-400">테이블 값을 직접 클릭하여 수정할 수 있습니다.</p>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] font-semibold text-zinc-500">분석 완료</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Load saved API key
  useEffect(() => {
    const saved = localStorage.getItem('GEMINI_API_KEY') ?? '';
    setApiKey(saved);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('GEMINI_API_KEY', key);
    setShowSettings(false);
  };

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });

  const processDrawing = async () => {
    if (!file) return;

    if (!apiKey) {
      setError('Gemini API 키가 설정되어 있지 않습니다. 우측 상단 ⚙ 설정에서 입력해 주세요.');
      setShowSettings(true);
      return;
    }

    setStatus('processing');
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = await fileToBase64(file);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-05-20',
        contents: [
          {
            parts: [
              {
                text: `You are an expert mechanical engineer specialized in reading 2D technical drawings.
Analyze the attached PDF drawing carefully.
Extract EVERY dimension annotation visible in the drawing.

For each dimension, return:
- label: Descriptive name (e.g. "전체 길이", "구멍 직경 A", "폭"). Use the drawing's own labels if present.
- value: The nominal numerical value (number).
- unit: The unit of measurement (e.g. "mm", "inch", "°"). Default to "mm" if not specified.
- tolerance: Tolerance string as written (e.g. "±0.05", "+0.1/-0.0", "H7"). Empty string if none.
- max: Calculated maximum value. If no tolerance, same as value.
- min: Calculated minimum value. If no tolerance, same as value.
- note: Any additional annotation or surface finish note related to this dimension. Empty string if none.

Return STRICTLY a JSON array. No markdown, no explanation. Only the JSON array.`,
              },
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                tolerance: { type: Type.STRING },
                max: { type: Type.NUMBER },
                min: { type: Type.NUMBER },
                note: { type: Type.STRING },
              },
              required: ['label', 'value', 'unit', 'tolerance', 'max', 'min', 'note'],
            },
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error('AI 응답이 비어 있습니다.');

      // Strip possible ```json fences
      const clean = text.replace(/```(?:json)?/gi, '').trim();
      const parsed: Dimension[] = JSON.parse(clean);
      setDimensions(parsed);
      setStatus('done');
    } catch (err: any) {
      console.error(err);
      let msg = err?.message ?? '알 수 없는 오류가 발생했습니다.';
      if (msg.includes('API_KEY') || msg.includes('403') || msg.includes('401')) {
        msg = 'API 키가 유효하지 않거나 권한이 없습니다. 설정에서 키를 확인해 주세요.';
      } else if (msg.includes('quota') || msg.includes('429')) {
        msg = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
      }
      setError(msg);
      setStatus('error');
    }
  };

  const exportToExcel = () => {
    if (dimensions.length === 0) return;

    // Korean headers
    const rows = dimensions.map((d) => ({
      '항목명 (Label)': d.label,
      '기준값 (Value)': d.value,
      '단위 (Unit)': d.unit,
      '공차 (Tolerance)': d.tolerance,
      'Max': d.max,
      'Min': d.min,
      '비고 (Note)': d.note,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 24 }, { wch: 14 }, { wch: 10 },
      { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '치수 목록');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `치수_${file?.name.replace('.pdf', '') ?? 'drawing'}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateDimension = (i: number, field: keyof Dimension, value: string | number) => {
    setDimensions((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const removeDimension = (i: number) =>
    setDimensions((prev) => prev.filter((_, idx) => idx !== i));

  const addDimension = () =>
    setDimensions((prev) => [
      ...prev,
      { label: '새 항목', value: 0, unit: 'mm', tolerance: '', max: 0, min: 0, note: '' },
    ]);

  const handleClearFile = () => {
    setFile(null);
    setDimensions([]);
    setError(null);
    setStatus('idle');
  };

  const hasKey = !!apiKey;
  const isProcessing = status === 'processing';

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 font-sans">
      {/* ── Header ── */}
      <header className="border-b border-zinc-200 bg-white px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none">도면 치수 추출기</h1>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">
                Drawing Dimension Extractor · Powered by Gemini AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dimensions.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <Download className="w-4 h-4" />
                Excel 다운로드
              </Button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                hasKey
                  ? 'text-green-600 bg-green-50 hover:bg-green-100'
                  : 'text-red-500 bg-red-50 hover:bg-red-100',
              )}
              title="API 키 설정"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── API Key Warning banner ── */}
      <AnimatePresence>
        {!hasKey && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 border-b border-amber-200 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-xs">
                Gemini API 키가 설정되지 않았습니다.{' '}
                <button
                  onClick={() => setShowSettings(true)}
                  className="font-semibold underline"
                >
                  지금 설정하기 →
                </button>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Upload & Controls */}
          <div className="lg:col-span-4 space-y-5">

            {/* Upload card */}
            <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-500" />
                도면 업로드
              </h2>

              <UploadZone file={file} onFile={setFile} onClear={handleClearFile} />

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-2 text-red-600"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Extract button */}
              {file && (
                <Button
                  className="w-full"
                  onClick={processDrawing}
                  isLoading={isProcessing}
                  disabled={isProcessing}
                >
                  {isProcessing ? '분석 중...' : '치수 추출 시작'}
                </Button>
              )}
            </div>

            {/* How it works */}
            <div className="bg-zinc-900 text-zinc-400 p-5 rounded-xl shadow-lg">
              <h3 className="text-white text-sm font-semibold mb-4">사용 방법</h3>
              <ol className="space-y-3.5 text-xs">
                {[
                  ['01', '우측 상단 ⚙에서 Gemini API 키 입력'],
                  ['02', '2D PDF 도면 파일 업로드'],
                  ['03', '「치수 추출 시작」 클릭'],
                  ['04', '결과 확인 및 직접 수정 가능'],
                  ['05', '「Excel 다운로드」로 저장'],
                ].map(([n, t]) => (
                  <li key={n} className="flex gap-3">
                    <span className="text-zinc-600 font-mono shrink-0">{n}</span>
                    <p>{t}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Excel download (mobile duplicate) */}
            {dimensions.length > 0 && (
              <Button className="w-full lg:hidden" onClick={exportToExcel}>
                <Download className="w-4 h-4" />
                Excel 파일 다운로드 ({dimensions.length}개 항목)
              </Button>
            )}
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-8">
            <ResultTable
              dimensions={dimensions}
              onUpdate={updateDimension}
              onRemove={removeDimension}
              onAdd={addDimension}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="max-w-7xl mx-auto px-6 py-6 border-t border-zinc-200 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-400">
            © 2026 Drawing Dimension Extractor · Gemini AI 기반 자동 치수 분석
          </p>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-700 transition-colors"
            >
              API 키 발급
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-700 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      {/* ── Settings Modal ── */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        apiKey={apiKey}
        onSave={saveApiKey}
      />
    </div>
  );
}
