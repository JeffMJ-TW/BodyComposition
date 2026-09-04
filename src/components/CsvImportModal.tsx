import React, { useState, useRef } from 'react';
import { parseBodyCsv } from '../utils/csvParser';
import { BodyRecord } from '../types';
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRecords: (newRecords: BodyRecord[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onImportRecords }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<BodyRecord[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessText = (text: string) => {
    setErrorMsg(null);
    if (!text.trim()) {
      setParsedPreview([]);
      return;
    }
    const { records, errors } = parseBodyCsv(text);
    if (errors.length > 0) {
      setErrorMsg(errors.join(', '));
      setParsedPreview([]);
    } else if (records.length === 0) {
      setErrorMsg('未偵測到有效數值資料，請確認格式');
      setParsedPreview([]);
    } else {
      setParsedPreview(records);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.type.includes('text') && !file.type.includes('csv')) {
      setErrorMsg('請選擇 .csv 格式的檔案');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      setCsvText(content);
      handleProcessText(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    onImportRecords(parsedPreview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">匯入身體數據 CSV 檔案</h3>
              <p className="text-xs text-zinc-500">支援歐姆龍 (Omron HBF-702T 等) 及標準格式</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3 border-b border-zinc-100 flex gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 border-b-2 transition-all ${
              activeTab === 'upload' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            拖曳上傳檔案
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 border-b-2 transition-all ${
              activeTab === 'paste' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            直接貼上 CSV 內容
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-800">
                點擊選擇檔案，或將 CSV 檔案拖曳至此
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                支援 .csv 檔案，包含測量日期、體重、體脂肪、骨骼肌等欄位
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                貼上 CSV 純文字內容：
              </label>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  handleProcessText(e.target.value);
                }}
                placeholder={`"測量日期","時區","體重(kg)","體脂肪(%)"...\n"2026/08/31 13:36","Asia/Taipei","87.50","28.0"...`}
                className="w-full text-xs font-mono p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          )}

          {/* Error display */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview of successfully parsed records */}
          {parsedPreview.length > 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-semibold mb-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>已成功解析 {parsedPreview.length} 筆量測紀錄！</span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 font-mono text-[11px] text-emerald-800">
                {parsedPreview.slice(0, 5).map((r, idx) => (
                  <div key={idx} className="flex justify-between py-0.5 border-b border-emerald-100/70">
                    <span>{r.date}</span>
                    <span>
                      {r.weight}kg | 體脂 {r.bodyFatPct}% | 肌肉 {r.skeletalMusclePct}%
                    </span>
                  </div>
                ))}
                {parsedPreview.length > 5 && (
                  <div className="text-center text-emerald-600 pt-1">
                    ...其餘 {parsedPreview.length - 5} 筆已準備就緒
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            取消
          </button>

          <button
            type="button"
            id="confirm-import-btn"
            disabled={parsedPreview.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>確認匯入並更新數據 ({parsedPreview.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
