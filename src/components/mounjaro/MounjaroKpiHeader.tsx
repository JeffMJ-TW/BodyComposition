import React from 'react';
import {
  CalendarClock,
  Syringe,
  Scale,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Plus,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
} from 'lucide-react';
import { MounjaroPen, InjectionRecord, MounjaroSettings, MounjaroRoiMetrics } from '../../types';
import {
  TIRZEPATIDE_PK,
  getPenNominalDose,
  calculateKwikPenClicks,
} from '../../utils/mounjaroConstants';

interface MounjaroKpiHeaderProps {
  pens: MounjaroPen[];
  injections: InjectionRecord[];
  activePen?: MounjaroPen;
  settings: MounjaroSettings;
  onUpdateSettings: (settings: Partial<MounjaroSettings>) => void;
  roi: MounjaroRoiMetrics;
  onOpenNewInjection: () => void;
  onOpenPenManager: () => void;
}

export const MounjaroKpiHeader: React.FC<MounjaroKpiHeaderProps> = ({
  pens,
  injections,
  activePen,
  settings,
  onUpdateSettings,
  roi,
  onOpenNewInjection,
  onOpenPenManager,
}) => {
  // 1. Next injection date & countdown
  const lastInjection = injections.length > 0
    ? [...injections].sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime())[0]
    : null;

  const nextDoseInfo = (() => {
    if (!lastInjection) {
      return {
        dateStr: '尚未開始',
        daysLeft: 0,
        statusText: '隨時可登記初次施打',
        isDue: false,
        isOverdue: false,
      };
    }

    const lastTime = new Date(`${lastInjection.date}T${lastInjection.time || '00:00'}`).getTime();
    const intervalMs = (settings.doseIntervalDays || 7) * 86400000;
    const nextTime = lastTime + intervalMs;
    const nextDate = new Date(nextTime);
    const nowTime = Date.now();
    const diffDays = Math.ceil((nextTime - nowTime) / 86400000);

    const dateStr = `${nextDate.getFullYear()}/${String(nextDate.getMonth() + 1).padStart(2, '0')}/${String(nextDate.getDate()).padStart(2, '0')}`;
    const weekday = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][nextDate.getDay()];

    if (diffDays > 0) {
      return {
        dateStr: `${dateStr} (${weekday})`,
        daysLeft: diffDays,
        statusText: `還有 ${diffDays} 天施打`,
        isDue: false,
        isOverdue: false,
      };
    } else if (diffDays === 0) {
      return {
        dateStr: `${dateStr} (${weekday})`,
        daysLeft: 0,
        statusText: '今日是預計施打日！',
        isDue: true,
        isOverdue: false,
      };
    } else {
      return {
        dateStr: `${dateStr} (${weekday})`,
        daysLeft: diffDays,
        statusText: `已逾期 ${Math.abs(diffDays)} 天`,
        isDue: true,
        isOverdue: true,
      };
    }
  })();

  // 2. Active Pen remaining dose & expiration
  const penStats = (() => {
    if (!activePen) {
      return {
        name: '未選取或無庫存藥筆',
        nominalDose: 5.0,
        remainingMg: 0,
        maxCapacityMg: 0,
        remainingMl: 0,
        totalVolumeMl: 3.0,
        typicalDose: 2.5,
        percent: 0,
        dosesLeftEstimate: 0,
        clicksForTypicalDose: 0,
        isExpired: false,
        daysOpened: 0,
      };
    }

    const nominalDose = getPenNominalDose(activePen);
    const usedInPen = injections
      .filter((inj) => inj.penId === activePen.id)
      .reduce((sum, inj) => sum + inj.doseMg, 0);

    // Standard Taiwan Kwikpen buffer is approximately 1 nominal dose (~0.6ml)
    const residualMg = activePen.residualBufferMg > 0
      ? activePen.residualBufferMg
      : nominalDose;

    const maxCap = settings.includeResidual
      ? activePen.totalDoseMg + residualMg
      : activePen.totalDoseMg;

    const totalVolumeMl = settings.includeResidual ? 3.0 : 2.4;
    const remaining = Math.max(0, maxCap - usedInPen);
    const percent = Math.min(100, Math.max(0, Math.round((remaining / maxCap) * 100)));
    const remainingMl = maxCap > 0 ? Number(((remaining / maxCap) * totalVolumeMl).toFixed(2)) : 0;

    // Estimate available doses based on last injected dose
    const typicalDose = lastInjection?.doseMg || 2.5;
    const dosesLeft = typicalDose > 0 ? Math.floor(remaining / typicalDose) : 0;
    const clicksForTypicalDose = calculateKwikPenClicks(nominalDose, typicalDose);

    // Check 28-day expiration from firstUsedDate
    let daysOpened = 0;
    let isExpired = false;
    if (activePen.firstUsedDate) {
      const openTime = new Date(activePen.firstUsedDate).getTime();
      daysOpened = Math.floor((Date.now() - openTime) / 86400000);
      isExpired = daysOpened > TIRZEPATIDE_PK.EXPIRATION_AFTER_OPEN_DAYS;
    }

    return {
      name: activePen.name,
      nominalDose,
      typicalDose,
      remainingMg: Number(remaining.toFixed(2)),
      maxCapacityMg: Number(maxCap.toFixed(2)),
      remainingMl,
      totalVolumeMl,
      percent,
      dosesLeftEstimate: dosesLeft,
      clicksForTypicalDose,
      isExpired,
      daysOpened,
    };
  })();

  return (
    <div className="space-y-3">
      {/* 28-day expiration alert if active pen is expired */}
      {penStats.isExpired && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>藥筆效期警示：</strong>
              目前藥筆「{penStats.name}」已開封使用 <strong>{penStats.daysOpened} 天</strong>（超過仿單建議常溫/冷藏 28 天安全期限），請注意藥物活性或評估更換新筆。
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenPenManager}
            className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-50 rounded-lg text-amber-900 font-semibold shrink-0 cursor-pointer shadow-2xs"
          >
            管理藥筆庫存
          </button>
        </div>
      )}

      {/* 4 Core KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: 下次施打日倒數 */}
        <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs hover:border-purple-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-purple-600" />
                <span>下次注射倒數</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  nextDoseInfo.isOverdue
                    ? 'bg-rose-100 text-rose-700'
                    : nextDoseInfo.isDue
                    ? 'bg-amber-100 text-amber-700 animate-pulse'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                {nextDoseInfo.statusText}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight font-mono">
                {nextDoseInfo.daysLeft > 0 ? (
                  <>
                    {nextDoseInfo.daysLeft} <span className="text-sm font-semibold text-zinc-500">天後</span>
                  </>
                ) : nextDoseInfo.daysLeft === 0 ? (
                  <span className="text-purple-700 text-xl font-bold">今日預計注射</span>
                ) : (
                  <span className="text-rose-600 text-xl font-bold">逾期 {Math.abs(nextDoseInfo.daysLeft)} 天</span>
                )}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 truncate">{nextDoseInfo.dateStr}</p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">間隔週期: 每 7 天</span>
            <button
              type="button"
              onClick={onOpenNewInjection}
              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>登記施打</span>
            </button>
          </div>
        </div>

        {/* KPI 2: 目前藥筆剩餘量 */}
        <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                <Syringe className="w-4 h-4 text-blue-600" />
                <span>目前藥筆剩餘量</span>
              </span>
              {/* Residual Toggle (GLP-1 TW Standard) */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ includeResidual: !settings.includeResidual })}
                title={
                  settings.includeResidual
                    ? `目前包含殘劑計算 (估計約多 1 次 ${penStats.nominalDose}mg / 0.6ml 劑量)`
                    : `目前僅計算標示規格量 (${penStats.nominalDose * 4}mg / 2.4ml)`
                }
                className="text-[10px] font-semibold flex items-center gap-1 text-zinc-500 hover:text-blue-600 transition-colors"
              >
                <span>{settings.includeResidual ? '含殘劑' : '僅標示'}</span>
                {settings.includeResidual ? (
                  <ToggleRight className="w-4 h-4 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-zinc-300" />
                )}
              </button>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight font-mono">
                {penStats.remainingMg}
                <span className="text-sm font-semibold text-zinc-500 ml-1">mg</span>
              </span>
              <span className="text-xs text-zinc-500">
                (約 {penStats.remainingMl} ml)
              </span>
              <span className="text-[11px] font-medium text-zinc-400 ml-auto">
                / {penStats.maxCapacityMg}mg (約 {penStats.totalVolumeMl}ml)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-zinc-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  penStats.percent > 40
                    ? 'bg-blue-600'
                    : penStats.percent > 15
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${penStats.percent}%` }}
              />
            </div>

            {/* Clicks and doses estimate pills */}
            <div className="flex items-center justify-between mt-2 pt-1.5 text-[11px] text-zinc-600 border-t border-zinc-100/80">
              <span className="bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                旋鈕: {penStats.clicksForTypicalDose} 格 ({penStats.typicalDose}mg)
              </span>
              <span className="text-zinc-500 font-medium">
                估計可再施打 <strong className="text-blue-700 font-bold font-mono">{penStats.dosesLeftEstimate}</strong> 次
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500 text-[11px] truncate max-w-[110px]" title={penStats.name}>
              {penStats.name}
            </span>
            <button
              type="button"
              onClick={onOpenPenManager}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              庫存與殘劑 ({pens.length}支)
            </button>
          </div>
        </div>

        {/* KPI 3: 當前體重變化 */}
        <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>當前體重變化</span>
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                用藥至今 {roi.daysSinceFirstDose} 天
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl sm:text-3xl font-black tracking-tight font-mono flex items-center gap-1 ${
                  roi.weightDeltaKg < 0
                    ? 'text-emerald-600'
                    : roi.weightDeltaKg > 0
                    ? 'text-rose-600'
                    : 'text-zinc-800'
                }`}
              >
                {roi.weightDeltaKg < 0 ? (
                  <ArrowDownRight className="w-5 h-5" />
                ) : roi.weightDeltaKg > 0 ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : null}
                {roi.weightDeltaKg > 0 ? `+${roi.weightDeltaKg}` : roi.weightDeltaKg}
                <span className="text-sm font-semibold text-zinc-500">kg</span>
              </span>
            </div>

            <p className="text-xs text-zinc-500 mt-1">
              起始 {roi.baselineWeightKg} kg → 目前 {roi.currentWeightKg} kg
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>累計已打 {roi.totalInjectedMg} mg</span>
            <span className="text-emerald-700 font-medium">
              {roi.weightDeltaKg < 0 ? `減重率 ${(Math.abs(roi.weightDeltaKg) / roi.baselineWeightKg * 100).toFixed(1)}%` : '持平觀測'}
            </span>
          </div>
        </div>

        {/* KPI 4: 瘦 1 公斤花費 (ROI) */}
        <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs hover:border-amber-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>減重經濟效益 (ROI)</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                瘦 1 kg 花費
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              {roi.costPerKgLostTwd !== null && roi.costPerKgLostTwd > 0 ? (
                <>
                  <span className="text-xs font-bold text-zinc-400">NT$</span>
                  <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight font-mono">
                    {Math.round(roi.costPerKgLostTwd).toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-zinc-500">/ kg</span>
                </>
              ) : (
                <span className="text-base font-bold text-zinc-500 mt-1">
                  資料累積中
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-500 mt-1">
              每週平均花費: <strong className="text-zinc-800 font-mono">NT$ {Math.round(roi.weeklyAvgCostTwd).toLocaleString()}</strong>
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>單劑成本 NT$ {roi.costPerMgTwd ? Math.round(roi.costPerMgTwd) : 0}/mg</span>
            <span className="text-amber-700 font-medium">總花費 NT$ {roi.totalSpentTwd.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
