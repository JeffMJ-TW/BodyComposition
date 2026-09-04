import React, { useState } from 'react';
import {
  History,
  Calendar,
  Clock,
  MapPin,
  Syringe,
  Scale,
  SmilePlus,
  Trash2,
  Edit2,
  Plus,
  Droplets,
  Beef,
  Sparkles,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { InjectionRecord, MounjaroPen } from '../../types';
import {
  INJECTION_SITES,
  SYMPTOM_DEFINITIONS,
  exportMounjaroInjectionsToCsv,
} from '../../utils/mounjaroConstants';

interface InjectionHistoryListProps {
  injections: InjectionRecord[];
  pens: MounjaroPen[];
  onOpenNewInjection: () => void;
  onEditInjection: (record: InjectionRecord) => void;
  onDeleteInjection: (id: string) => void;
}

export const InjectionHistoryList: React.FC<InjectionHistoryListProps> = ({
  injections,
  pens,
  onOpenNewInjection,
  onEditInjection,
  onDeleteInjection,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const handleExportCsv = () => {
    const ok = exportMounjaroInjectionsToCsv(injections, pens);
    if (ok) {
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }
  };

  const sorted = [...injections].sort(
    (a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime()
  );

  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200 shadow-2xs">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
              <span>注射施打歷程記錄</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono">
                共 {injections.length} 劑次
              </span>
            </h3>
            <p className="text-xs text-zinc-500">
              包含日期時間、部位輪替軌跡、劑量動態、當日體重與副作用日誌
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="export-mounjaro-csv-btn"
            onClick={handleExportCsv}
            disabled={injections.length === 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer border ${
              exportSuccess
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
            title="匯出所有施打紀錄為 CSV 檔案 (相容 Excel)"
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>已匯出 CSV</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-zinc-600" />
                <span>匯出 CSV 檔案</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenNewInjection}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>登記新注射</span>
          </button>
        </div>
      </div>

      {/* History Items */}
      {sorted.length === 0 ? (
        <div className="py-8 text-center text-zinc-400 text-xs">
          尚無施打紀錄，點擊右上角「登記新注射」建立第一筆紀錄。
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((inj, idx) => {
            const pen = pens.find((p) => p.id === inj.penId);
            const siteDef = INJECTION_SITES.find((s) => s.key === inj.site);
            const isLatest = idx === 0;

            const symptomKeys = inj.symptoms ? (Object.keys(inj.symptoms) as (keyof typeof inj.symptoms)[]) : [];

            return (
              <div
                key={inj.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isLatest
                    ? 'border-purple-300 bg-purple-50/20 shadow-2xs'
                    : 'border-zinc-200/90 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-zinc-900 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{inj.date}</span>
                      {inj.time && <span className="text-zinc-400 font-normal">({inj.time})</span>}
                    </span>

                    {isLatest && (
                      <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full">
                        最新劑次
                      </span>
                    )}

                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800 text-xs font-bold font-mono">
                      {inj.doseMg} mg
                    </span>

                    <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-purple-600" />
                      <span>{siteDef?.label || inj.site}</span>
                    </span>

                    {pen && (
                      <span className="text-[11px] text-zinc-400 hidden sm:inline truncate max-w-[140px]">
                        藥筆: {pen.name}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {inj.weightKg && (
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Scale className="w-3 h-3 text-emerald-600" />
                        <span>{inj.weightKg} kg</span>
                      </span>
                    )}
                    {confirmDeleteId === inj.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl text-xs animate-in fade-in">
                        <span className="text-rose-700 font-bold text-[11px]">確定刪除？</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteInjection(inj.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md cursor-pointer text-[11px] shadow-2xs active:scale-95 transition-all"
                        >
                          確定
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-medium rounded-md cursor-pointer text-[11px] transition-all"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => onEditInjection(inj)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                          title="編輯紀錄"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(inj.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="刪除紀錄"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub details: Symptoms, Water, Protein & Notes */}
                <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-zinc-100 text-zinc-600">
                  {/* Water / Protein chips */}
                  {inj.waterMl !== undefined && inj.waterMl > 0 && (
                    <span className="text-[11px] text-blue-700 flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">
                      <Droplets className="w-3 h-3" />
                      <span>{inj.waterMl}ml</span>
                    </span>
                  )}

                  {inj.proteinG !== undefined && inj.proteinG > 0 && (
                    <span className="text-[11px] text-amber-800 flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded">
                      <Beef className="w-3 h-3" />
                      <span>{inj.proteinG}g 蛋白質</span>
                    </span>
                  )}

                  {/* Symptoms tags */}
                  {symptomKeys.map((key) => {
                    const sym = SYMPTOM_DEFINITIONS.find((s) => s.key === key);
                    const lvl = inj.symptoms?.[key];
                    if (!sym || !lvl) return null;

                    return (
                      <span
                        key={key}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-1"
                      >
                        <span>{sym.emoji}</span>
                        <span>{sym.label} ({lvl}級)</span>
                      </span>
                    );
                  })}

                  {/* Notes text */}
                  {inj.notes && (
                    <span className="text-[11px] text-zinc-500 italic truncate max-w-full">
                      備註: 「{inj.notes}」
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
