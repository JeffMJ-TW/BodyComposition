import React, { useState } from 'react';
import {
  Syringe,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Archive,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Info,
  X,
} from 'lucide-react';
import { MounjaroPen, InjectionRecord, MounjaroSettings } from '../../types';
import { TIRZEPATIDE_PK, STANDARD_PEN_PRESETS } from '../../utils/mounjaroConstants';

interface PenInventoryManagerProps {
  pens: MounjaroPen[];
  injections: InjectionRecord[];
  activePenId: string;
  onSelectActivePen: (id: string) => void;
  onSavePen: (pen: MounjaroPen) => void;
  onDeletePen: (id: string) => void;
  settings: MounjaroSettings;
  onUpdateSettings: (settings: Partial<MounjaroSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const PenInventoryManager: React.FC<PenInventoryManagerProps> = ({
  pens,
  injections,
  activePenId,
  onSelectActivePen,
  onSavePen,
  onDeletePen,
  settings,
  onUpdateSettings,
  isOpen,
  onClose,
}) => {
  const [editingPen, setEditingPen] = useState<Partial<MounjaroPen> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDeletePenId, setConfirmDeletePenId] = useState<string | null>(null);
  const [presetCategory, setPresetCategory] = useState<'multi' | 'single' | 'all'>('multi');

  if (!isOpen) return null;

  // Calculate detailed usage stats for each pen
  const penListStats = pens.map((pen) => {
    const penInjections = injections.filter((inj) => inj.penId === pen.id);
    const totalUsedMg = penInjections.reduce((sum, inj) => sum + inj.doseMg, 0);

    const nominalMg = pen.totalDoseMg;
    const residualMg = pen.residualBufferMg || 0;
    const totalWithResidualMg = nominalMg + residualMg;

    const currentCap = settings.includeResidual ? totalWithResidualMg : nominalMg;
    const remainingMg = Math.max(0, currentCap - totalUsedMg);
    const remainingNominalOnly = Math.max(0, nominalMg - totalUsedMg);

    // Days opened check
    let daysOpened = 0;
    let isExpired = false;
    if (pen.firstUsedDate) {
      const openTime = new Date(pen.firstUsedDate).getTime();
      daysOpened = Math.floor((Date.now() - openTime) / 86400000);
      isExpired = daysOpened > TIRZEPATIDE_PK.EXPIRATION_AFTER_OPEN_DAYS;
    }

    // Cost per mg for this specific pen
    const costPerMg = pen.priceTwd / pen.totalDoseMg;

    return {
      ...pen,
      injectionsCount: penInjections.length,
      totalUsedMg: Number(totalUsedMg.toFixed(2)),
      remainingMg: Number(remainingMg.toFixed(2)),
      remainingNominalOnly: Number(remainingNominalOnly.toFixed(2)),
      currentCap: Number(currentCap.toFixed(2)),
      percent: Math.min(100, Math.max(0, Math.round((remainingMg / currentCap) * 100))),
      daysOpened,
      isExpired,
      costPerMg: Math.round(costPerMg),
    };
  });

  const handleOpenAddForm = () => {
    setEditingPen({
      id: `pen-mj-${Date.now()}`,
      name: `猛健樂 10mg 原廠藥筆 #${pens.length + 1}`,
      purchaseDate: new Date().toISOString().slice(0, 10),
      priceTwd: 8500,
      totalDoseMg: 10.0,
      residualBufferMg: 0.6,
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (pen: MounjaroPen) => {
    setEditingPen({ ...pen });
    setIsFormOpen(true);
  };

  const handleSubmitPen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPen || !editingPen.name || !editingPen.totalDoseMg) return;

    onSavePen({
      id: editingPen.id || `pen-mj-${Date.now()}`,
      name: editingPen.name.trim(),
      purchaseDate: editingPen.purchaseDate || new Date().toISOString().slice(0, 10),
      priceTwd: Number(editingPen.priceTwd) || 0,
      totalDoseMg: Number(editingPen.totalDoseMg) || 10,
      residualBufferMg: Number(editingPen.residualBufferMg ?? 0.6),
      firstUsedDate: editingPen.firstUsedDate,
      notes: editingPen.notes?.trim(),
      isArchived: editingPen.isArchived || false,
    });

    setIsFormOpen(false);
    setEditingPen(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 shadow-2xs">
              <Syringe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                猛健樂藥筆庫存與殘劑管理
              </h2>
              <p className="text-xs text-zinc-500">
                管理各支藥筆容量、購買金額、殘劑緩衝量與 28 天開瓶效期
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Global Residual Switch & Info Banner */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5 flex-1 min-w-[240px]">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-900">
                  原廠殘劑緩衝量（預設 +0.6 mg）：
                </span>
                <p className="text-blue-700 mt-0.5 leading-relaxed">
                  原廠藥筆為確保每次旋轉排氣精確度，瓶內實際藥液通常多於標示總量約 0.6mg。開關此設定可即時切換「標示量」或「含緩衝量」估算剩餘次數。
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onUpdateSettings({ includeResidual: !settings.includeResidual })}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                settings.includeResidual
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
              }`}
            >
              {settings.includeResidual ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  <span>已計入殘劑 (含+0.6mg)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  <span>不計入殘劑 (僅標示量)</span>
                </>
              )}
            </button>
          </div>

          {/* Action Row: Add Pen Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700">
              庫存藥筆清單（共 {pens.length} 支）
            </span>
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>新增藥筆</span>
            </button>
          </div>

          {/* Pens Card List */}
          <div className="space-y-3">
            {penListStats.map((pen) => {
              const isActive = pen.id === activePenId;

              return (
                <div
                  key={pen.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'border-purple-500 bg-purple-50/20 shadow-xs ring-1 ring-purple-400'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-zinc-900">{pen.name}</h4>
                      {isActive && (
                        <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full">
                          使用中
                        </span>
                      )}
                      {pen.isExpired && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>已開封逾 28 天</span>
                        </span>
                      )}
                      {!pen.firstUsedDate && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          全新未開封
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => onSelectActivePen(pen.id)}
                          className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                        >
                          設為使用中
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(pen)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                        title="編輯藥筆"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {pens.length > 1 && (
                        confirmDeletePenId === pen.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg text-xs animate-in fade-in">
                            <span className="text-rose-700 font-bold text-[11px]">刪除？</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeletePen(pen.id);
                                setConfirmDeletePenId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md cursor-pointer text-[10px] shadow-2xs"
                            >
                              確定
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePenId(null)}
                              className="px-1.5 py-0.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-medium rounded-md cursor-pointer text-[10px]"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePenId(pen.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="刪除藥筆"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Remaining Bar */}
                  <div className="space-y-1.5 my-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 font-medium">
                        剩餘容量：
                        <strong className="text-zinc-900 font-mono text-sm ml-1">
                          {pen.remainingMg} mg
                        </strong>
                        <span className="text-zinc-400 ml-1">/ {pen.currentCap} mg</span>
                      </span>
                      <span className="font-mono font-bold text-zinc-700">
                        {pen.percent}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pen.percent > 40
                            ? 'bg-blue-600'
                            : pen.percent > 15
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${pen.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-100 text-xs text-zinc-600">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">購入價格</span>
                      <span className="font-mono font-semibold">
                        NT$ {pen.priceTwd.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-400 block font-mono">
                        (NT$ {pen.costPerMg}/mg)
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block text-[10px]">原廠殘劑緩衝</span>
                      <span className="font-mono font-semibold">
                        +{pen.residualBufferMg} mg
                      </span>
                      <span className="text-[10px] text-zinc-400 block">
                        {settings.includeResidual ? '（已計入）' : '（未計入）'}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block text-[10px]">已施打次數</span>
                      <span className="font-mono font-semibold text-purple-700">
                        {pen.injectionsCount} 次 (累計 {pen.totalUsedMg} mg)
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block text-[10px]">開瓶天數 (限28天)</span>
                      {pen.firstUsedDate ? (
                        <span
                          className={`font-semibold ${
                            pen.isExpired ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          已使用 {pen.daysOpened} 天
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-medium">尚未開瓶</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add / Edit Pen Inline Form Drawer */}
          {isFormOpen && editingPen && (
            <form
              onSubmit={handleSubmitPen}
              className="p-4 bg-zinc-50 border border-purple-200 rounded-2xl space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <h4 className="text-sm font-bold text-zinc-900">
                  {editingPen.id && pens.some((p) => p.id === editingPen.id)
                    ? '編輯藥筆資料'
                    : '新增藥筆'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingPen(null);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-800"
                >
                  取消
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">
                    藥筆名稱或備註標籤 *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPen.name || ''}
                    onChange={(e) => setEditingPen({ ...editingPen, name: e.target.value })}
                    placeholder="例：猛健樂 10mg/支 (#1)"
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">
                    購買日期
                  </label>
                  <input
                    type="date"
                    value={editingPen.purchaseDate || ''}
                    onChange={(e) =>
                      setEditingPen({ ...editingPen, purchaseDate: e.target.value })
                    }
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">
                    購買金額 (NTD) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    value={editingPen.priceTwd || ''}
                    onChange={(e) =>
                      setEditingPen({
                        ...editingPen,
                        priceTwd: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="8500"
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>

                {/* Dose and Pen Strength Selection */}
                <div className="space-y-2 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-zinc-800 text-xs flex items-center gap-1.5">
                      <span>規格總劑量 (mg) *</span>
                      <span className="font-mono text-purple-700 font-bold bg-white px-2 py-0.5 rounded-md border border-purple-200">
                        {editingPen.totalDoseMg || 10} mg
                      </span>
                    </label>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPresetCategory('multi')}
                        className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                          presetCategory === 'multi'
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        多劑型 KwikPen
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetCategory('single')}
                        className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                          presetCategory === 'single'
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        單劑型 Auto-injector
                      </button>
                    </div>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {STANDARD_PEN_PRESETS.filter(
                      (p) => presetCategory === 'all' || p.type === presetCategory
                    ).map((p) => {
                      const isSelected = editingPen.totalDoseMg === p.totalDoseMg;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setEditingPen((prev) => ({
                              ...prev,
                              totalDoseMg: p.totalDoseMg,
                              residualBufferMg: p.residualBufferMg,
                              priceTwd: prev?.priceTwd ? prev.priceTwd : p.defaultPrice,
                              name:
                                !prev?.name || prev.name.startsWith('猛健樂')
                                  ? `猛健樂 ${p.badge} (#${pens.length + 1})`
                                  : prev.name,
                            }));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-xs scale-102'
                              : 'bg-white border border-zinc-200 text-zinc-700 hover:border-purple-300 hover:bg-purple-50/50'
                          }`}
                        >
                          <span>{p.badge}</span>
                          <span className={`text-[10px] opacity-75 ${isSelected ? 'text-purple-100' : 'text-zinc-400'}`}>
                            ({p.totalDoseMg}mg)
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual Input / Adjustment */}
                  <div className="flex items-center gap-2 pt-1 border-t border-purple-100/60">
                    <span className="text-[11px] text-zinc-500 shrink-0">自訂劑量:</span>
                    <input
                      type="number"
                      required
                      min={0.5}
                      max={120}
                      step={0.5}
                      value={editingPen.totalDoseMg ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditingPen((prev) => ({
                          ...prev,
                          totalDoseMg: val,
                        }));
                      }}
                      placeholder="自訂規格 mg"
                      className="w-28 bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                    <span className="text-[11px] text-zinc-400">mg</span>
                    <span className="text-[10px] text-zinc-500 ml-auto hidden sm:inline">
                      支援 5mg, 10mg, 15mg, 20mg 等全系列
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">
                    原廠殘劑緩衝量 (mg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={editingPen.residualBufferMg ?? 0.6}
                    onChange={(e) =>
                      setEditingPen({
                        ...editingPen,
                        residualBufferMg: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.6"
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">
                    首次開瓶使用日期 (28 天效期基準)
                  </label>
                  <input
                    type="date"
                    value={editingPen.firstUsedDate || ''}
                    onChange={(e) =>
                      setEditingPen({ ...editingPen, firstUsedDate: e.target.value })
                    }
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingPen(null);
                  }}
                  className="px-3 py-1.5 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  儲存藥筆
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/70 text-xs">
          <span className="text-zinc-500">
            原廠規格建議保存：冷藏 2°C ~ 8°C；已開封可在 30°C 以下常溫保存至多 28 天。
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
