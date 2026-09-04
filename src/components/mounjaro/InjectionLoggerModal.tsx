import React, { useState, useEffect } from 'react';
import {
  Syringe,
  Calendar,
  Clock,
  MapPin,
  Scale,
  SmilePlus,
  Droplets,
  Beef,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  InjectionRecord,
  MounjaroPen,
  InjectionSite,
  SymptomType,
  MounjaroSettings,
} from '../../types';
import {
  INJECTION_SITES,
  getNextRecommendedSite,
  SYMPTOM_DEFINITIONS,
} from '../../utils/mounjaroConstants';

interface InjectionLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: InjectionRecord) => void;
  onSavePen?: (pen: MounjaroPen) => void;
  pens: MounjaroPen[];
  activePenId: string;
  existingRecord?: InjectionRecord | null;
  lastInjection?: InjectionRecord | null;
  settings: MounjaroSettings;
  currentLatestWeight?: number;
  initialSite?: InjectionSite;
}

export const InjectionLoggerModal: React.FC<InjectionLoggerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSavePen,
  pens,
  activePenId,
  existingRecord,
  lastInjection,
  settings,
  currentLatestWeight,
  initialSite,
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [penId, setPenId] = useState('');
  const [doseMg, setDoseMg] = useState<number>(2.5);
  const [site, setSite] = useState<InjectionSite>('abdomen_lr');
  const [weightKg, setWeightKg] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [symptoms, setSymptoms] = useState<Partial<Record<SymptomType, number>>>({});
  const [waterMl, setWaterMl] = useState<number>(2000);
  const [proteinG, setProteinG] = useState<number>(80);

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      if (existingRecord) {
        setDate(existingRecord.date);
        setTime(existingRecord.time || '08:30');
        setPenId(existingRecord.penId);
        setDoseMg(existingRecord.doseMg);
        setSite(existingRecord.site);
        setWeightKg(existingRecord.weightKg ? String(existingRecord.weightKg) : '');
        setNotes(existingRecord.notes || '');
        setSymptoms(existingRecord.symptoms || {});
        setWaterMl(existingRecord.waterMl ?? 2000);
        setProteinG(existingRecord.proteinG ?? 80);
      } else {
        const now = new Date();
        const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const tStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setDate(dStr);
        setTime(tStr);

        // Pick active pen or first available
        setPenId(activePenId || (pens[0]?.id ?? ''));

        // Default dose: match last injection dose or 2.5mg
        setDoseMg(lastInjection?.doseMg || 2.5);

        // Site: recommended rotation site or initialSite
        if (initialSite) {
          setSite(initialSite);
        } else {
          setSite(getNextRecommendedSite(lastInjection?.site));
        }

        // Default weight from latest measurement
        if (currentLatestWeight) {
          setWeightKg(String(currentLatestWeight));
        } else {
          setWeightKg('');
        }

        setNotes('');
        setSymptoms({});
        setWaterMl(settings.targetWaterMl || 2000);
        setProteinG(settings.targetProteinG || 80);
      }
    }
  }, [isOpen, existingRecord, activePenId, pens, lastInjection, initialSite, currentLatestWeight, settings]);

  if (!isOpen) return null;

  const selectedPen = pens.find((p) => p.id === penId);
  const recommendedSite = getNextRecommendedSite(lastInjection?.site);

  const handleToggleSymptom = (key: SymptomType, severity: number) => {
    setSymptoms((prev) => {
      const copy = { ...prev };
      if (copy[key] === severity) {
        delete copy[key];
      } else {
        copy[key] = severity;
      }
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !penId || doseMg <= 0 || !site) return;

    const record: InjectionRecord = {
      id: existingRecord?.id || `inj-${Date.now()}`,
      date,
      time,
      penId,
      doseMg,
      site,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      notes: notes.trim(),
      symptoms,
      waterMl: Number(waterMl) || 0,
      proteinG: Number(proteinG) || 0,
    };

    onSave(record);
    onClose();
  };

  const commonDoses = [1.25, 2.5, 3.75, 5.0, 7.5, 10.0, 12.5, 15.0];

  // Helper to compute remaining mg in a pen
  const getPenRemaining = (targetPenId: string) => {
    const pen = pens.find((p) => p.id === targetPenId);
    if (!pen) return 0;
    const maxCap = settings.includeResidual
      ? pen.totalDoseMg + (pen.residualBufferMg || 0)
      : pen.totalDoseMg;
    // If editing existing record, don't count existing record's dose against remaining
    const existingDose = (existingRecord && existingRecord.penId === targetPenId) ? existingRecord.doseMg : 0;
    return maxCap;
  };

  // Quick select or auto-create pen with requested specification (2.5mg, 5mg, 15mg, etc.)
  const handleQuickSelectPen = (targetDose: number, defaultName?: string) => {
    // Check if an existing pen has this dose capacity or name
    const existing = pens.find(
      (p) => p.totalDoseMg === targetDose || p.name.includes(`${targetDose}mg`)
    );

    if (existing) {
      setPenId(existing.id);
      if (targetDose === 2.5) setDoseMg(2.5);
      else if (targetDose === 5.0 && (doseMg < 2.5 || doseMg === 2.5)) setDoseMg(5.0);
      else if (targetDose === 15.0 && doseMg < 15.0) setDoseMg(15.0);
      return;
    }

    // Auto-create pen if not yet in inventory
    const newPen: MounjaroPen = {
      id: `pen-mj-${targetDose}mg-${Date.now()}`,
      name: defaultName || `猛健樂 ${targetDose}mg/支`,
      purchaseDate: new Date().toISOString().slice(0, 10),
      priceTwd: targetDose === 2.5 ? 2500 : targetDose === 5.0 ? 5500 : targetDose === 15.0 ? 11500 : targetDose === 10.0 ? 8500 : 15000,
      totalDoseMg: targetDose,
      residualBufferMg: targetDose <= 2.5 ? 0.1 : 0.6,
      notes: `新增 ${targetDose}mg/支 規格藥筆`,
    };

    if (onSavePen) {
      onSavePen(newPen);
    }
    setPenId(newPen.id);
    if (targetDose === 2.5) setDoseMg(2.5);
    else if (targetDose === 5.0) setDoseMg(5.0);
    else if (targetDose === 15.0) setDoseMg(15.0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200 shadow-2xs">
              <Syringe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                {existingRecord ? '編輯施打紀錄' : '登記新注射施打紀錄'}
              </h2>
              <p className="text-xs text-zinc-500">
                記錄猛健樂劑量、部位輪替、當日體重、副作用與生活日誌
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Row 1: Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>施打日期 *</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>施打時間</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>
          </div>

          {/* Pen Selection Section (Enhanced with 2.5mg/支, 5mg/支, 15mg/支) */}
          <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Syringe className="w-3.5 h-3.5 text-purple-600" />
                <span>使用藥筆 *</span>
              </label>
              {selectedPen && (
                <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <span>規格:</span>
                  <strong className="text-purple-700 font-mono">{selectedPen.totalDoseMg}mg/支</strong>
                  <span>· 剩餘:</span>
                  <span className="font-mono text-zinc-800 font-semibold">{getPenRemaining(selectedPen.id).toFixed(1)} mg</span>
                </div>
              )}
            </div>

            <select
              required
              value={penId}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('__preset_')) {
                  const dose = parseFloat(val.replace('__preset_', ''));
                  const nameMap: Record<number, string> = {
                    2.5: '猛健樂 2.5mg/支 (單劑/起始)',
                    5.0: '猛健樂 5mg/支 (微調/標準)',
                    15.0: '猛健樂 15mg/支 (進階/頂規)',
                    10.0: '猛健樂 10mg/支 (標準劑型)',
                    20.0: '猛健樂 20mg/支 (高容量劑型)',
                  };
                  handleQuickSelectPen(dose, nameMap[dose]);
                } else {
                  setPenId(val);
                }
              }}
              className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-purple-500 outline-hidden"
            >
              <optgroup label="📋 在庫藥筆清單">
                {pens.map((p) => {
                  const remaining = getPenRemaining(p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} (規格 {p.totalDoseMg}mg · 剩餘約 {remaining.toFixed(1)}mg)
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="➕ 快速選取／新增藥筆規格">
                <option value="__preset_2.5">+ 猛健樂 2.5mg/支 (單劑/起始規格)</option>
                <option value="__preset_5.0">+ 猛健樂 5mg/支 (標準/微調規格)</option>
                <option value="__preset_15.0">+ 猛健樂 15mg/支 (進階/頂規規格)</option>
                <option value="__preset_10.0">+ 猛健樂 10mg/支 (常用 10mg 規格)</option>
                <option value="__preset_20.0">+ 猛健樂 20mg/支 (高容量 20mg 規格)</option>
              </optgroup>
            </select>

            {/* Quick Pills for 2.5mg/支, 5mg/支, 15mg/支 etc. */}
            <div className="pt-1 border-t border-zinc-200/60">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-zinc-500 font-medium">常見藥筆規格快捷選用：</span>
                <span className="text-[10px] text-zinc-400">點擊直接切換或建立藥筆</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: '2.5mg/支', dose: 2.5, name: '猛健樂 2.5mg/支 (單劑/起始)' },
                  { label: '5mg/支', dose: 5.0, name: '猛健樂 5mg/支 (微調/標準)' },
                  { label: '15mg/支', dose: 15.0, name: '猛健樂 15mg/支 (進階/頂規)' },
                  { label: '10mg/支', dose: 10.0, name: '猛健樂 10mg/支 (#1 已啟用)' },
                  { label: '20mg/支', dose: 20.0, name: '猛健樂 20mg/支 (#2 備用)' },
                ].map((preset) => {
                  const isCurrent =
                    selectedPen?.totalDoseMg === preset.dose ||
                    selectedPen?.name.includes(preset.label);
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleQuickSelectPen(preset.dose, preset.name)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-purple-700 text-white shadow-xs scale-102 ring-2 ring-purple-300'
                          : 'bg-white hover:bg-purple-50 text-zinc-700 hover:text-purple-700 border border-zinc-200 hover:border-purple-200'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {isCurrent && (
                        <span className="text-[10px] bg-white/25 px-1 py-0.2 rounded-sm font-semibold">
                          已選用
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Dose Selection */}
          <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <span>施打劑量 (mg) *</span>
                <span className="text-[12px] font-bold text-purple-700 font-mono bg-white px-2 py-0.5 rounded-md border border-purple-200">
                  {doseMg} mg
                </span>
              </label>
              <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                <span>所選藥筆:</span>
                <span className="font-semibold text-purple-800">{selectedPen?.name || '未選取'}</span>
                {selectedPen && (
                  <span className="text-zinc-400 font-mono">
                    (規格 {selectedPen.totalDoseMg}mg)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {commonDoses.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDoseMg(d)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      doseMg === d
                        ? 'bg-purple-600 text-white shadow-xs scale-102'
                        : 'bg-white border border-zinc-200 text-zinc-700 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    {d} mg
                  </button>
                ))}

                <div className="flex items-center gap-1.5 ml-auto bg-white px-2.5 py-1 rounded-xl border border-zinc-200 shadow-2xs">
                  <span className="text-xs font-semibold text-zinc-600">自訂劑量:</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="60"
                    value={doseMg}
                    onChange={(e) => setDoseMg(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-zinc-50 border border-zinc-300 rounded-md px-1.5 py-0.5 text-xs font-mono text-center outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-xs text-zinc-400">mg</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                <span>常用規格：微調 1.25/3.75mg • 起始 2.5mg • 維持 5.0mg • 進階 7.5~15mg</span>
                {selectedPen && (
                  <span className="text-purple-600">
                    扣除後藥筆約扣減 {doseMg} mg
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Visual Injection Site Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                <span>注射部位選擇（部位輪替防硬結）*</span>
              </label>
              {lastInjection?.site && (
                <span className="text-[11px] text-zinc-500">
                  上次部位：
                  <strong className="text-zinc-800">
                    {INJECTION_SITES.find((s) => s.key === lastInjection.site)?.label}
                  </strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INJECTION_SITES.map((s) => {
                const isSelected = site === s.key;
                const isRec = s.key === recommendedSite;
                const isLast = s.key === lastInjection?.site;

                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSite(s.key)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-300'
                        : isRec
                        ? 'bg-purple-50/80 border-purple-400 text-purple-900 ring-1 ring-purple-300'
                        : isLast
                        ? 'bg-zinc-100 border-zinc-300 text-zinc-600'
                        : 'bg-white border-zinc-200 text-zinc-800 hover:border-purple-200 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold">{s.label}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      ) : isRec ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-600 text-white">
                          首選
                        </span>
                      ) : isLast ? (
                        <span className="text-[9px] font-medium px-1 rounded bg-zinc-200 text-zinc-600">
                          上次
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={`text-[10px] mt-1 line-clamp-1 ${
                        isSelected ? 'text-purple-100' : 'text-zinc-400'
                      }`}
                    >
                      {s.region === 'abdomen'
                        ? '腹部象限'
                        : s.region === 'thigh'
                        ? '大腿外側'
                        : '手臂後外'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Weight & Habits Check-in */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Weight */}
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span>施打當日體重 (kg)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="如 86.0"
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
                <span className="absolute right-3 top-2 text-xs text-zinc-400">kg</span>
              </div>
            </div>

            {/* Water */}
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>當日飲水量 (ml)</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="100"
                  min="0"
                  max="8000"
                  value={waterMl}
                  onChange={(e) => setWaterMl(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setWaterMl((w) => w + 500)}
                  className="px-2 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold shrink-0"
                >
                  +500
                </button>
              </div>
            </div>

            {/* Protein */}
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1 flex items-center gap-1">
                <Beef className="w-3.5 h-3.5 text-amber-600" />
                <span>蛋白質攝取 (g)</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="5"
                  min="0"
                  max="300"
                  value={proteinG}
                  onChange={(e) => setProteinG(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setProteinG((p) => p + 20)}
                  className="px-2 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold shrink-0"
                >
                  +20g
                </button>
              </div>
            </div>
          </div>

          {/* Row 5: Side Effects / Symptoms Severity (1-5) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <SmilePlus className="w-3.5 h-3.5 text-purple-600" />
                <span>常見副作用打卡（1~5 級嚴重度，無症狀免選）</span>
              </label>
              <span className="text-[10px] text-zinc-400">1:極輕微 ~ 5:嚴重</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SYMPTOM_DEFINITIONS.map((sym) => {
                const currentSeverity = symptoms[sym.key] || 0;

                return (
                  <div
                    key={sym.key}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      currentSeverity > 0
                        ? 'bg-amber-50/40 border-amber-300'
                        : 'bg-zinc-50/50 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{sym.emoji}</span>
                      <div>
                        <span className="text-xs font-bold text-zinc-800">{sym.label}</span>
                        <span className="text-[10px] text-zinc-400 block line-clamp-1">
                          {sym.description}
                        </span>
                      </div>
                    </div>

                    {/* 1-5 severity selector */}
                    <div className="flex items-center gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleToggleSymptom(sym.key, lvl)}
                          className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                            currentSeverity === lvl
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 6: Notes */}
          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              <span>施打備註 / 心得日誌</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例：本週進食飽足感早現、注射痛感低、維持重訓與飲水充足..."
              className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden resize-none"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/70 text-xs">
          <span className="text-zinc-500">
            預計扣除藥筆：{selectedPen?.name} (-{doseMg} mg)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-300 rounded-xl font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              確認儲存紀錄
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
