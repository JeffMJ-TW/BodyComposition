import React, { useState } from 'react';
import {
  Calculator,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Syringe,
  Plus,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { MounjaroPen } from '../../types';
import {
  STANDARD_PEN_NOMINAL_DOSES,
  calculateKwikPenClicks,
  calculatePenDoseEstimates,
  getPenNominalDose,
} from '../../utils/mounjaroConstants';

interface MounjaroResidualCalculatorProps {
  activePen?: MounjaroPen;
  pens?: MounjaroPen[];
}

export const MounjaroResidualCalculator: React.FC<MounjaroResidualCalculatorProps> = ({
  activePen,
  pens = [],
}) => {
  // Part 1: Clicks & Dose Estimates State (Image 1)
  const defaultNominal = activePen ? getPenNominalDose(activePen) : 5.0;
  const [selectedNominalDose, setSelectedNominalDose] = useState<number>(defaultNominal);
  const [targetDoseMg, setTargetDoseMg] = useState<number>(2.5);

  // Part 2: Interactive Remaining Dose & Residual Calculator (Image 2)
  const [calcPenDose, setCalcPenDose] = useState<number>(defaultNominal);
  const [includeResidual, setIncludeResidual] = useState<boolean>(true);
  const [customAddDose, setCustomAddDose] = useState<string>('');
  const [simulatedInjectedTotalMg, setSimulatedInjectedTotalMg] = useState<number>(0);
  const [simulatedHistory, setSimulatedHistory] = useState<number[]>([]);

  // Calculations for Part 1
  const estimates = calculatePenDoseEstimates(selectedNominalDose, targetDoseMg);

  // Calculations for Part 2
  // Total nominal is 4 standard doses = 4 * calcPenDose (2.4 ml)
  // Residual buffer is approx 1 nominal dose = 1 * calcPenDose (0.6 ml)
  // Total volume with residual is 5 * calcPenDose (3.0 ml)
  const baseStandardMg = calcPenDose * 4;
  const residualMg = calcPenDose;
  const totalCapacityMg = includeResidual ? baseStandardMg + residualMg : baseStandardMg;
  const totalVolumeMl = includeResidual ? 3.0 : 2.4;

  const currentRemainingMg = Math.max(0, totalCapacityMg - simulatedInjectedTotalMg);
  const currentRemainingMl = totalCapacityMg > 0
    ? Number(((currentRemainingMg / totalCapacityMg) * totalVolumeMl).toFixed(2))
    : 0;
  const remainingPercent = totalCapacityMg > 0
    ? Math.max(0, Math.min(100, Math.round((currentRemainingMg / totalCapacityMg) * 100)))
    : 0;

  // Handler to add injection amount in remaining calculator
  const handleAddDose = (dose: number) => {
    if (dose <= 0) return;
    setSimulatedInjectedTotalMg((prev) => prev + dose);
    setSimulatedHistory((prev) => [...prev, dose]);
  };

  const handleAddCustomDose = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customAddDose);
    if (!isNaN(parsed) && parsed > 0) {
      handleAddDose(parsed);
      setCustomAddDose('');
    }
  };

  const handleResetSim = () => {
    setSimulatedInjectedTotalMg(0);
    setSimulatedHistory([]);
  };

  // Sync with active pen in user's inventory
  const handleSyncWithActivePen = () => {
    if (!activePen) return;
    const nominal = getPenNominalDose(activePen);
    setSelectedNominalDose(nominal);
    setCalcPenDose(nominal);
    handleResetSim();
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center border border-teal-200 shadow-2xs">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-zinc-900 tracking-tight flex items-center gap-2">
              <span>猛健樂轉動格數與殘劑計算機</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                GLP-1 Taiwan 標準規範
              </span>
            </h3>
            <p className="text-xs text-zinc-500">
              支援購買劑型換算、筆身旋鈕轉動格數（Clicks）、原廠殘劑緩衝量估算與剩餘劑量連動
            </p>
          </div>
        </div>

        {activePen && (
          <button
            type="button"
            onClick={handleSyncWithActivePen}
            className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <Syringe className="w-3.5 h-3.5 text-teal-600" />
            <span>帶入目前使用藥筆 ({activePen.name})</span>
          </button>
        )}
      </div>

      {/* Main 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: 轉動筆身格數與全新筆可施打次數 (IMAGE 1) */}
        {/* ======================================================== */}
        <div className="bg-[#f0f9f8]/60 rounded-2xl p-5 border border-teal-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>轉動格數試算 (KwikPen Clicks)</span>
          </div>

          {/* Select purchased pen nominal dose */}
          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1.5">
              請選擇您購買的劑型 (mg)
            </label>
            <select
              value={selectedNominalDose}
              onChange={(e) => setSelectedNominalDose(parseFloat(e.target.value))}
              className="w-full bg-white border border-teal-300 rounded-xl px-3.5 py-2 text-sm font-semibold text-zinc-800 focus:ring-2 focus:ring-teal-500 outline-hidden shadow-2xs"
            >
              {STANDARD_PEN_NOMINAL_DOSES.map((d) => (
                <option key={d} value={d}>
                  {d} mg
                </option>
              ))}
            </select>
          </div>

          {/* Input desired injection dose */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-700">
                每次想使用的劑量 (mg)
              </label>
              <span className="text-[11px] text-teal-700 font-mono">
                每格約 {(selectedNominalDose / 60).toFixed(3)} mg
              </span>
            </div>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max={selectedNominalDose * 2}
              value={targetDoseMg || ''}
              onChange={(e) => setTargetDoseMg(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-teal-300 rounded-xl px-3.5 py-2 text-sm font-bold font-mono text-zinc-900 focus:ring-2 focus:ring-teal-500 outline-hidden shadow-2xs"
              placeholder="例如 2.5"
            />

            {/* Quick Dose Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[1.25, 2.5, 3.75, 5.0, 7.5, 10.0].map((quickDose) => (
                <button
                  key={quickDose}
                  type="button"
                  onClick={() => setTargetDoseMg(quickDose)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    targetDoseMg === quickDose
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white hover:bg-teal-50 text-zinc-700 border border-teal-200'
                  }`}
                >
                  {quickDose} mg
                </button>
              ))}
            </div>
          </div>

          {/* Result Box 1: 請轉動筆身 XX 格 (Exact Green Dashed Box from Image 1) */}
          <div className="border-2 border-dashed border-emerald-400 bg-emerald-50/70 rounded-2xl p-4 text-center space-y-1 shadow-2xs">
            <div className="text-xs font-bold text-emerald-800 tracking-wide">
              請轉動筆身
            </div>
            <div className="text-4xl sm:text-5xl font-black text-emerald-600 font-mono tracking-tight py-1">
              {estimates.clicks}{' '}
              <span className="text-xl sm:text-2xl font-bold text-emerald-700">格</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              （標準一劑 60 格為 {selectedNominalDose} mg，轉至 {estimates.clicks} 格即為 {targetDoseMg} mg）
            </div>
          </div>

          {/* Result Box 2: 一支全新的 X mg 筆 估計可施打次數 (Exact Yellow Dashed Box from Image 1) */}
          <div className="border-2 border-dashed border-amber-300 bg-amber-50/60 rounded-2xl p-4 space-y-2 text-zinc-800 text-xs">
            <div className="font-bold text-amber-900 text-sm flex items-center justify-between">
              <span>一支全新的 {selectedNominalDose} mg 筆</span>
              <span className="text-[11px] font-normal text-amber-800">
                (標示 4 劑 = {selectedNominalDose * 4}mg)
              </span>
            </div>
            <div className="space-y-1.5 text-zinc-700 leading-relaxed">
              <div className="flex items-baseline gap-1.5">
                <span>• 估計可施打</span>
                <strong className="text-base font-black text-amber-800 font-mono">
                  {estimates.standardDoses}
                </strong>
                <span>次 {targetDoseMg} mg</span>
              </div>
              <div className="flex items-baseline gap-1.5 text-amber-900">
                <span>• 若考量殘劑（約 +一次 {selectedNominalDose} mg 的量），估計可施打</span>
                <strong className="text-base font-black text-amber-700 font-mono">
                  {estimates.withResidualDoses}
                </strong>
                <span>次 {targetDoseMg} mg</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: 算一算還剩多少？殘劑動態扣除 (IMAGE 2) */}
        {/* ======================================================== */}
        <div className="bg-[#fff9f2]/70 rounded-2xl p-5 border border-orange-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-950 font-bold text-sm">
              <span className="text-base">🔍</span>
              <span>算一算還剩多少？</span>
            </div>
            <button
              type="button"
              onClick={handleResetSim}
              className="text-xs font-semibold text-orange-700 hover:text-orange-900 flex items-center gap-1 cursor-pointer"
              title="重置模擬施打進度"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置計算</span>
            </button>
          </div>

          {/* Select pen nominal dose for remaining calculator */}
          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1.5">
              請選擇筆身劑型 (mg)
            </label>
            <select
              value={calcPenDose}
              onChange={(e) => {
                setCalcPenDose(parseFloat(e.target.value));
                handleResetSim();
              }}
              className="w-full bg-white border border-orange-300 rounded-xl px-3.5 py-2 text-sm font-semibold text-zinc-800 focus:ring-2 focus:ring-orange-500 outline-hidden shadow-2xs"
            >
              {STANDARD_PEN_NOMINAL_DOSES.map((d) => (
                <option key={d} value={d}>
                  {d} mg
                </option>
              ))}
            </select>
          </div>

          {/* Residual toggle checkbox (Exact from Image 2) */}
          <label className="flex items-center gap-2.5 p-2 bg-white/80 rounded-xl border border-orange-200 text-xs font-semibold text-zinc-800 cursor-pointer select-none hover:bg-orange-50 transition-colors">
            <input
              type="checkbox"
              checked={includeResidual}
              onChange={(e) => setIncludeResidual(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-zinc-300 cursor-pointer accent-orange-600"
            />
            <span>
              包含殘劑計算 (估計約多 1 次 {calcPenDose} mg 劑量)
            </span>
          </label>

          {/* Display Card: 總劑量 & 剩餘量 (Exact from Image 2) */}
          <div className="bg-[#fff4e6]/70 rounded-2xl p-4 border border-orange-200/80 space-y-2.5 shadow-2xs">
            <div className="text-xs text-zinc-700 font-medium">
              總劑量：<strong className="text-zinc-900 font-mono text-sm">{totalCapacityMg} mg</strong>{' '}
              <span className="text-zinc-500 font-normal">（約 {totalVolumeMl} ml）</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-200 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  remainingPercent > 40
                    ? 'bg-gradient-to-r from-orange-400 to-amber-500'
                    : remainingPercent > 15
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${remainingPercent}%` }}
              />
            </div>

            <div className="text-xs text-zinc-700 font-medium flex items-center justify-between">
              <span>
                剩餘量：
                <strong className="text-orange-900 font-mono text-sm">
                  {currentRemainingMg.toFixed(1)} mg
                </strong>{' '}
                <span className="text-zinc-500 font-normal">
                  （約 {currentRemainingMl} ml）
                </span>
              </span>
              <span className="text-[11px] font-bold text-orange-700 font-mono">
                {remainingPercent}%
              </span>
            </div>

            {simulatedHistory.length > 0 && (
              <div className="pt-2 border-t border-orange-200/60 text-[11px] text-zinc-600 flex flex-wrap items-center gap-1">
                <span className="text-zinc-400">已模擬扣除：</span>
                {simulatedHistory.map((d, i) => (
                  <span
                    key={i}
                    className="bg-white/80 border border-orange-200 text-orange-800 px-1.5 py-0.2 rounded-md font-mono"
                  >
                    -{d}mg
                  </span>
                ))}
                <span className="font-bold text-orange-900 ml-1">
                  (共 {simulatedInjectedTotalMg} mg)
                </span>
              </div>
            )}
          </div>

          {/* Quick Buttons: 點擊加以此施打劑量 (Exact from Image 2) */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-zinc-700">
              點擊加以此施打劑量：
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[2.5, 5.0, 7.5, 10.0, 12.5, 15.0].map((dose) => (
                <button
                  key={dose}
                  type="button"
                  onClick={() => handleAddDose(dose)}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-orange-100/70 active:scale-95 border border-orange-300 text-orange-950 font-bold font-mono text-sm transition-all shadow-2xs cursor-pointer text-center"
                >
                  +{dose}
                </button>
              ))}
            </div>
          </div>

          {/* Custom dose input (Exact from Image 2) */}
          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1.5">
              或輸入自訂劑量 (mg)：
            </label>
            <form onSubmit={handleAddCustomDose} className="flex gap-2">
              <input
                type="number"
                step="0.05"
                min="0.1"
                placeholder="例如 1.2"
                value={customAddDose}
                onChange={(e) => setCustomAddDose(e.target.value)}
                className="flex-1 bg-white border border-orange-300 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-orange-500 outline-hidden shadow-2xs"
              />
              <button
                type="submit"
                disabled={!customAddDose || parseFloat(customAddDose) <= 0}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 active:scale-95"
              >
                加入
              </button>
            </form>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetSim}
            className="w-full py-2 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
            <span>重置計算</span>
          </button>
        </div>
      </div>

      {/* Warning Notice (Exact text from Image 2) */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-300/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed shadow-2xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-950">官方安全警語：</span>
          官方建議開封後保存期為一個月（28天）。如果超過一個月，請自行評估風險並妥善低溫冷藏保存藥劑。一旦發現藥劑外觀有混濁、變色或沉澱物等異狀，為了安全起見，請立即停止使用。
        </div>
      </div>
    </div>
  );
};
