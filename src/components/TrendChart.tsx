import React, { useState, useMemo, useRef } from 'react';
import {
  BodyRecord,
  MetricDefinition,
  ScaleSettings,
  DualAxisSettings,
  TimeRangeFilter,
  ChartDisplayMode,
  MultiAxisSettings,
  MetricKey,
  MultiAxisNormalization,
} from '../types';
import { METRIC_DEFINITIONS } from '../utils/constants';
import { MultiAxisMetricPicker, MULTI_AXIS_PRESETS } from './MultiAxisMetricPicker';
import {
  Sliders,
  Eye,
  TrendingUp,
  Layers,
  Sparkles,
  Plus,
  X,
  Percent,
  Activity,
  Check,
  ChevronDown,
} from 'lucide-react';

interface TrendChartProps {
  records: BodyRecord[];
  primaryMetric: MetricDefinition;
  onSelectPrimaryMetric: (metric: MetricDefinition) => void;
  scaleSettings: ScaleSettings;
  onUpdateScaleSettings: (settings: Partial<ScaleSettings>) => void;
  dualAxis: DualAxisSettings;
  onUpdateDualAxis: (settings: Partial<DualAxisSettings>) => void;
  chartMode?: ChartDisplayMode;
  onChangeChartMode?: (mode: ChartDisplayMode) => void;
  multiAxis?: MultiAxisSettings;
  onUpdateMultiAxis?: (settings: Partial<MultiAxisSettings>) => void;
  timeRange: TimeRangeFilter;
  onChangeTimeRange: (range: TimeRangeFilter) => void;
  selectedRecordId?: string;
  onSelectRecord: (record: BodyRecord) => void;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  records,
  primaryMetric,
  onSelectPrimaryMetric,
  scaleSettings,
  onUpdateScaleSettings,
  dualAxis,
  onUpdateDualAxis,
  chartMode = 'single',
  onChangeChartMode,
  multiAxis,
  onUpdateMultiAxis,
  timeRange,
  onChangeTimeRange,
  selectedRecordId,
  onSelectRecord,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showScalePanel, setShowScalePanel] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [hoveredMetricKey, setHoveredMetricKey] = useState<MetricKey | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine current active mode
  let currentMode: ChartDisplayMode = 'single';
  if (chartMode === 'multi' || chartMode === 'dual' || chartMode === 'single') {
    currentMode = chartMode;
  } else if (multiAxis?.enabled) {
    currentMode = 'multi';
  } else if (dualAxis.enabled) {
    currentMode = 'dual';
  }

  const handleModeChange = (mode: ChartDisplayMode) => {
    if (onChangeChartMode) {
      onChangeChartMode(mode);
    }
    if (mode === 'single') {
      onUpdateDualAxis({ enabled: false });
      onUpdateMultiAxis?.({ enabled: false });
    } else if (mode === 'dual') {
      onUpdateDualAxis({ enabled: true });
      onUpdateMultiAxis?.({ enabled: false });
    } else if (mode === 'multi') {
      onUpdateDualAxis({ enabled: false });
      onUpdateMultiAxis?.({ enabled: true });
    }
  };

  // Filter records by time range
  const filteredRecords = useMemo(() => {
    if (records.length === 0) return [];
    if (timeRange === 'all') return records;

    const latestTs = records[records.length - 1].timestamp;
    let cutoffMs = 0;
    if (timeRange === '7d') cutoffMs = 7 * 24 * 60 * 60 * 1000;
    else if (timeRange === '30d') cutoffMs = 30 * 24 * 60 * 60 * 1000;
    else if (timeRange === '90d') cutoffMs = 90 * 24 * 60 * 60 * 1000;

    const filtered = records.filter((r) => latestTs - r.timestamp <= cutoffMs);
    return filtered.length > 0 ? filtered : records;
  }, [records, timeRange]);

  const latestRecord = records[records.length - 1];

  // Multi-Axis Active Metrics
  const activeMultiMetricKeys: MetricKey[] = useMemo(() => {
    if (multiAxis?.metrics && multiAxis.metrics.length > 0) {
      return multiAxis.metrics;
    }
    return ['weight', 'bodyFatPct', 'skeletalMusclePct', 'visceralFat'];
  }, [multiAxis?.metrics]);

  const activeMultiMetricDefs = useMemo(() => {
    return activeMultiMetricKeys
      .map((k) => METRIC_DEFINITIONS[k])
      .filter(Boolean) as MetricDefinition[];
  }, [activeMultiMetricKeys]);

  const multiNormalization: MultiAxisNormalization = multiAxis?.normalization || 'independent';

  const handleToggleMultiMetric = (key: MetricKey) => {
    if (!onUpdateMultiAxis) return;
    if (activeMultiMetricKeys.includes(key)) {
      if (activeMultiMetricKeys.length <= 2) {
        alert('多軸模式至少需保留 2 項指標');
        return;
      }
      onUpdateMultiAxis({
        metrics: activeMultiMetricKeys.filter((k) => k !== key),
      });
    } else {
      if (activeMultiMetricKeys.length >= 6) {
        alert('多軸模式最多可同時選取 6 項指標，以確保圖表走勢清晰易讀');
        return;
      }
      onUpdateMultiAxis({
        metrics: [...activeMultiMetricKeys, key],
      });
    }
  };

  const handleApplyPreset = (keys: MetricKey[]) => {
    if (onUpdateMultiAxis) {
      onUpdateMultiAxis({ metrics: keys });
    }
    setIsPickerOpen(false);
  };

  const secondaryMetricDef = dualAxis.enabled ? METRIC_DEFINITIONS[dualAxis.secondaryMetric] : null;

  // Single & Dual Axis: Compute Primary Y-Axis Min & Max
  const { primaryMin, primaryMax, primaryTicks } = useMemo(() => {
    if (filteredRecords.length === 0) {
      return { primaryMin: 0, primaryMax: 100, primaryTicks: [0, 25, 50, 75, 100] };
    }

    const values = filteredRecords.map((r) => r[primaryMetric.key] as number);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const range = dataMax - dataMin || 1;

    let min = 0;
    let max = 100;

    if (scaleSettings.mode === 'snug') {
      const pad = range * (scaleSettings.paddingPercent / 100);
      min = Math.max(0, parseFloat((dataMin - pad).toFixed(1)));
      max = parseFloat((dataMax + pad).toFixed(1));
    } else if (scaleSettings.mode === 'zero') {
      min = 0;
      max = parseFloat((dataMax * 1.2).toFixed(1));
    } else if (scaleSettings.mode === 'custom') {
      min = scaleSettings.customMin !== undefined ? scaleSettings.customMin : dataMin;
      max = scaleSettings.customMax !== undefined ? scaleSettings.customMax : dataMax;
      if (min >= max) max = min + 1;
    }

    const stepCount = Math.max(2, scaleSettings.tickSteps);
    const stepSize = (max - min) / stepCount;
    const ticks: number[] = [];
    for (let i = 0; i <= stepCount; i++) {
      ticks.push(parseFloat((min + i * stepSize).toFixed(primaryMetric.decimals)));
    }

    return { primaryMin: min, primaryMax: max, primaryTicks: ticks };
  }, [filteredRecords, primaryMetric, scaleSettings]);

  // Dual Axis: Compute Secondary Y-Axis Min & Max
  const { secondaryMin, secondaryMax, secondaryTicks } = useMemo(() => {
    if (!secondaryMetricDef || filteredRecords.length === 0) {
      return { secondaryMin: 0, secondaryMax: 100, secondaryTicks: [] };
    }
    const values = filteredRecords.map((r) => r[secondaryMetricDef.key] as number);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const range = dataMax - dataMin || 1;
    const pad = range * 0.15;
    const min = Math.max(0, parseFloat((dataMin - pad).toFixed(1)));
    const max = parseFloat((dataMax + pad).toFixed(1));

    const stepCount = scaleSettings.tickSteps;
    const stepSize = (max - min) / stepCount;
    const ticks: number[] = [];
    for (let i = 0; i <= stepCount; i++) {
      ticks.push(parseFloat((min + i * stepSize).toFixed(secondaryMetricDef.decimals)));
    }
    return { secondaryMin: min, secondaryMax: max, secondaryTicks: ticks };
  }, [filteredRecords, secondaryMetricDef, scaleSettings.tickSteps]);

  // Multi-Axis: Compute Independent Metric Stats
  const multiIndependentStats = useMemo(() => {
    if (filteredRecords.length === 0) return {};
    const stats: Record<
      string,
      { min: number; max: number; range: number; latestVal: number; firstVal: number }
    > = {};

    for (const m of activeMultiMetricDefs) {
      const vals = filteredRecords.map((r) => r[m.key] as number);
      const dataMin = Math.min(...vals);
      const dataMax = Math.max(...vals);
      const range = dataMax - dataMin || 1;
      const pad = range * (scaleSettings.paddingPercent / 100);
      const min = Math.max(0, parseFloat((dataMin - pad).toFixed(2)));
      const max = parseFloat((dataMax + pad).toFixed(2));
      stats[m.key] = {
        min,
        max,
        range: max - min || 1,
        latestVal: vals[vals.length - 1],
        firstVal: vals[0],
      };
    }
    return stats;
  }, [filteredRecords, activeMultiMetricDefs, scaleSettings.paddingPercent]);

  // Multi-Axis: Compute Relative % Change from Baseline
  const multiRelativeStats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return { minPct: -5, maxPct: 5, ticks: [-4, -2, 0, 2, 4], baselineRecord: null };
    }
    const base = filteredRecords[0];
    let minPct = 0;
    let maxPct = 0;

    for (const m of activeMultiMetricDefs) {
      const baseVal = (base[m.key] as number) || 1;
      for (const r of filteredRecords) {
        const val = r[m.key] as number;
        const pct = ((val - baseVal) / baseVal) * 100;
        if (pct < minPct) minPct = pct;
        if (pct > maxPct) maxPct = pct;
      }
    }

    const bound = Math.max(Math.abs(minPct), Math.abs(maxPct), 1.5) * 1.25;
    const roundedBound = Math.ceil(bound * 2) / 2; // e.g. 2.5%, 4.0%
    const step = roundedBound / 2;
    const ticks = [
      -roundedBound,
      -step,
      0,
      step,
      roundedBound,
    ].map((t) => parseFloat(t.toFixed(1)));

    return {
      minPct: -roundedBound,
      maxPct: roundedBound,
      ticks,
      baselineRecord: base,
    };
  }, [filteredRecords, activeMultiMetricDefs]);

  // SVG Chart Dimensions
  const width = 800;
  const height = 360;
  const paddingLeft = currentMode === 'multi' && multiNormalization === 'relativeChange' ? 55 : 55;
  const paddingRight = currentMode === 'dual' ? 55 : 25;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Single/Dual zero baseline or points mapping
  const points = useMemo(() => {
    if (filteredRecords.length === 0) return [];
    const count = filteredRecords.length;

    return filteredRecords.map((rec, i) => {
      const x = count === 1 ? paddingLeft + chartWidth / 2 : paddingLeft + (i / (count - 1)) * chartWidth;

      // Primary Metric Y
      const pVal = rec[primaryMetric.key] as number;
      const pRatio = primaryMax === primaryMin ? 0.5 : (pVal - primaryMin) / (primaryMax - primaryMin);
      const clampedPRatio = Math.max(0, Math.min(1, pRatio));
      const py = paddingTop + chartHeight - clampedPRatio * chartHeight;

      // Secondary Metric Y (Dual)
      let sy = null;
      let sVal = null;
      if (secondaryMetricDef) {
        sVal = rec[secondaryMetricDef.key] as number;
        const sRatio = secondaryMax === secondaryMin ? 0.5 : (sVal - secondaryMin) / (secondaryMax - secondaryMin);
        const clampedSRatio = Math.max(0, Math.min(1, sRatio));
        sy = paddingTop + chartHeight - clampedSRatio * chartHeight;
      }

      // Multi-Axis Y coordinates
      const multiY: Record<string, number> = {};
      const multiVal: Record<string, number> = {};
      const multiPct: Record<string, number> = {};

      for (const m of activeMultiMetricDefs) {
        const val = rec[m.key] as number;
        multiVal[m.key] = val;

        if (multiNormalization === 'relativeChange') {
          const baseVal = (multiRelativeStats.baselineRecord?.[m.key] as number) || 1;
          const pct = ((val - baseVal) / baseVal) * 100;
          multiPct[m.key] = pct;
          const ratio = (pct - multiRelativeStats.minPct) / (multiRelativeStats.maxPct - multiRelativeStats.minPct || 1);
          const clamped = Math.max(0, Math.min(1, ratio));
          multiY[m.key] = paddingTop + chartHeight - clamped * chartHeight;
        } else {
          // Independent scale
          const stat = multiIndependentStats[m.key];
          if (stat) {
            const ratio = (val - stat.min) / (stat.range || 1);
            const clamped = Math.max(0, Math.min(1, ratio));
            multiY[m.key] = paddingTop + chartHeight - clamped * chartHeight;
          } else {
            multiY[m.key] = paddingTop + chartHeight / 2;
          }
        }
      }

      return {
        index: i,
        record: rec,
        x,
        py,
        pVal,
        sy,
        sVal,
        multiY,
        multiVal,
        multiPct,
      };
    });
  }, [
    filteredRecords,
    primaryMetric,
    primaryMin,
    primaryMax,
    secondaryMetricDef,
    secondaryMin,
    secondaryMax,
    activeMultiMetricDefs,
    multiNormalization,
    multiIndependentStats,
    multiRelativeStats,
    chartWidth,
    chartHeight,
    paddingLeft,
    paddingTop,
  ]);

  // Helper for generating smooth or linear path string
  const generatePathD = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    if (scaleSettings.curveType === 'linear') {
      return pts.reduce(
        (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
        ''
      );
    }

    // Smooth Bezier Curve
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const mx = (current.x + next.x) / 2;
      d += ` C ${mx.toFixed(1)} ${current.y.toFixed(1)}, ${mx.toFixed(1)} ${next.y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
    }
    return d;
  };

  // Primary Path (Single / Dual)
  const primaryPathD = useMemo(() => {
    if (points.length === 0) return '';
    return generatePathD(points.map((p) => ({ x: p.x, y: p.py })));
  }, [points, scaleSettings.curveType]);

  // Secondary Path (Dual)
  const secondaryPathD = useMemo(() => {
    if (!secondaryMetricDef || points.length === 0) return '';
    const validPts = points.filter((p) => p.sy !== null).map((p) => ({ x: p.x, y: p.sy as number }));
    return generatePathD(validPts);
  }, [points, secondaryMetricDef, scaleSettings.curveType]);

  // Primary Area Fill (Single only)
  const primaryAreaD = useMemo(() => {
    if (currentMode !== 'single' || !primaryPathD || points.length === 0) return '';
    const baseY = paddingTop + chartHeight;
    const firstX = points[0].x.toFixed(1);
    const lastX = points[points.length - 1].x.toFixed(1);
    return `${primaryPathD} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [primaryPathD, points, currentMode, paddingTop, chartHeight]);

  // Multi-Axis Paths
  const multiPaths = useMemo(() => {
    if (currentMode !== 'multi' || points.length === 0) return {};
    const paths: Record<string, string> = {};

    for (const m of activeMultiMetricDefs) {
      const pts = points.map((p) => ({ x: p.x, y: p.multiY[m.key] }));
      paths[m.key] = generatePathD(pts);
    }
    return paths;
  }, [currentMode, points, activeMultiMetricDefs, scaleSettings.curveType]);

  // Relative 0% Baseline Y
  const relativeZeroY = useMemo(() => {
    if (currentMode !== 'multi' || multiNormalization !== 'relativeChange') return null;
    const ratio = (0 - multiRelativeStats.minPct) / (multiRelativeStats.maxPct - multiRelativeStats.minPct || 1);
    const clamped = Math.max(0, Math.min(1, ratio));
    return paddingTop + chartHeight - clamped * chartHeight;
  }, [currentMode, multiNormalization, multiRelativeStats, paddingTop, chartHeight]);

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden transition-all">
      {/* Top Header & Toolbar */}
      <div className="px-5 py-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              currentMode === 'multi'
                ? 'bg-purple-50 text-purple-600 border-purple-200'
                : currentMode === 'dual'
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}
          >
            {currentMode === 'multi' ? (
              <Sparkles className="w-5 h-5" />
            ) : currentMode === 'dual' ? (
              <Layers className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                {currentMode === 'multi'
                  ? '多軸綜合走勢圖'
                  : currentMode === 'dual'
                  ? `${primaryMetric.label} vs ${secondaryMetricDef?.label || ''}`
                  : primaryMetric.label}
              </h2>

              {currentMode === 'single' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                  單位：{primaryMetric.unit || '無'}
                </span>
              )}

              {currentMode === 'dual' && secondaryMetricDef && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  雙軸對比：{primaryMetric.label} + {secondaryMetricDef.label}
                </span>
              )}

              {currentMode === 'multi' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                  <span>多軸模式</span>
                  <span className="font-bold">({activeMultiMetricKeys.length} 項指標同步比對)</span>
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
              {currentMode === 'multi'
                ? multiNormalization === 'relativeChange'
                  ? '相對基準日變化率模式：以第一筆量測為 0% 基準，直觀比對體脂、肌肉與重量的相對消長速度'
                  : '獨立動態 Y 軸模式：各指標獨立適配垂直全幅高度，不同單位數據同屏清晰對比'
                : currentMode === 'dual'
                ? '左側與右側雙 Y 軸獨立刻度，精確比對兩組不同單位之健康數值'
                : primaryMetric.description}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Mode Switcher: Single vs Dual vs Multi-Axis */}
          <div className="inline-flex rounded-xl bg-zinc-100 p-0.5 text-xs font-medium text-zinc-600 border border-zinc-200/60">
            <button
              type="button"
              id="chart-mode-single-btn"
              onClick={() => handleModeChange('single')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currentMode === 'single'
                  ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              單軸模式
            </button>
            <button
              type="button"
              id="chart-mode-dual-btn"
              onClick={() => handleModeChange('dual')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                currentMode === 'dual'
                  ? 'bg-white text-amber-700 font-semibold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Layers className="w-3 h-3 text-amber-500" />
              <span>雙軸對比</span>
            </button>
            <button
              type="button"
              id="chart-mode-multi-btn"
              onClick={() => handleModeChange('multi')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                currentMode === 'multi'
                  ? 'bg-purple-600 text-white font-semibold shadow-2xs'
                  : 'text-purple-700 hover:text-purple-900 font-medium'
              }`}
            >
              <Sparkles className={`w-3 h-3 ${currentMode === 'multi' ? 'text-amber-300' : 'text-purple-500'}`} />
              <span>多軸功能</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                  currentMode === 'multi' ? 'bg-purple-800 text-purple-200' : 'bg-purple-100 text-purple-700'
                }`}
              >
                {activeMultiMetricKeys.length}軸
              </span>
            </button>
          </div>

          {/* Time range selector */}
          <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 text-xs font-medium text-zinc-600">
            {(
              [
                { id: 'all', label: '全部' },
                { id: '90d', label: '近90天' },
                { id: '30d', label: '近30天' },
                { id: '7d', label: '近7天' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                id={`time-filter-${t.id}`}
                onClick={() => onChangeTimeRange(t.id)}
                className={`px-2 py-1 rounded-md transition-all ${
                  timeRange === t.id ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'hover:text-zinc-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Scale Adjustment Drawer Button */}
          <button
            type="button"
            id="toggle-scale-settings-btn"
            onClick={() => setShowScalePanel(!showScalePanel)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
              showScalePanel
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>刻度設定</span>
          </button>
        </div>
      </div>

      {/* Multi-Axis Dedicated Sub-Toolbar & Metric Chips */}
      {currentMode === 'multi' && (
        <div className="bg-purple-50/40 border-b border-purple-100 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Normalization switch & preset pills */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="inline-flex rounded-lg bg-white p-0.5 border border-purple-200 shadow-2xs">
              <button
                type="button"
                id="multi-axis-norm-independent"
                onClick={() => onUpdateMultiAxis?.({ normalization: 'independent' })}
                className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                  multiNormalization === 'independent'
                    ? 'bg-purple-600 text-white font-semibold shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="各指標以自身數據上下限全幅展開，適合觀察絕對數值波動"
              >
                各軸獨立最適量程
              </button>
              <button
                type="button"
                id="multi-axis-norm-relative"
                onClick={() => onUpdateMultiAxis?.({ normalization: 'relativeChange' })}
                className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 ${
                  multiNormalization === 'relativeChange'
                    ? 'bg-purple-600 text-white font-semibold shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="以第一筆紀錄為 0% 基準，比對各指標相對變化百分比（減重品質最佳觀察法）"
              >
                <Percent className="w-3 h-3" />
                <span>相對基準變化率 (%)</span>
              </button>
            </div>

            {/* Quick Presets Dropdown/Pills */}
            <div className="hidden lg:flex items-center gap-1">
              <span className="text-zinc-400 text-[11px] ml-1">常用組合:</span>
              {MULTI_AXIS_PRESETS.slice(0, 3).map((p) => {
                const isActive =
                  p.metrics.length === activeMultiMetricKeys.length &&
                  p.metrics.every((k) => activeMultiMetricKeys.includes(k));
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p.metrics)}
                    className={`px-2 py-0.5 rounded-full text-[11px] border transition-all ${
                      isActive
                        ? 'bg-purple-200/80 text-purple-900 border-purple-300 font-bold'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-purple-50'
                    }`}
                  >
                    <span>{p.icon}</span> {p.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Metrics Chips & Add Metric Button */}
          <div className="flex items-center flex-wrap gap-1.5">
            {activeMultiMetricDefs.map((def) => {
              const val = latestRecord ? (latestRecord[def.key] as number) : null;
              const isHovered = hoveredMetricKey === def.key;

              return (
                <div
                  key={def.key}
                  onMouseEnter={() => setHoveredMetricKey(def.key)}
                  onMouseLeave={() => setHoveredMetricKey(null)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer select-none ${
                    isHovered
                      ? 'bg-white border-purple-400 ring-2 ring-purple-300/60 shadow-xs'
                      : 'bg-white border-zinc-200/90 text-zinc-700 hover:border-zinc-300'
                  }`}
                  style={{
                    borderLeftColor: def.color,
                    borderLeftWidth: '3px',
                  }}
                  title={`游標懸停此處可聚焦高亮 ${def.label} 走勢`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: def.color }}
                  />
                  <span className="font-semibold text-zinc-800">{def.label}</span>
                  {val !== null && (
                    <span className="font-mono text-zinc-500 text-[11px]">
                      {val.toFixed(def.decimals)} {def.unit}
                    </span>
                  )}
                  {activeMultiMetricKeys.length > 2 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMultiMetric(def.key);
                      }}
                      className="text-zinc-400 hover:text-rose-600 ml-0.5 p-0.5 rounded transition-colors"
                      title="移除此指標"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Open Selector Modal */}
            <button
              type="button"
              id="open-multi-metric-picker-btn"
              onClick={() => setIsPickerOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-white border border-dashed border-purple-300 hover:border-purple-500 text-purple-700 text-xs font-semibold flex items-center gap-1 shadow-2xs hover:bg-purple-50 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增/管理指標</span>
            </button>
          </div>
        </div>
      )}

      {/* Expandable Scale Control Panel */}
      {showScalePanel && (
        <div className="bg-zinc-50/95 border-b border-zinc-200 px-5 py-3 text-xs text-zinc-700 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Range & Custom Limits */}
            <div>
              <div className="font-semibold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                <span>刻度上下限與邊距</span>
                <span className="text-[10px] text-zinc-400 font-normal">（可微調圖表 Y 軸）</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-zinc-500 whitespace-nowrap">模式：</label>
                <select
                  value={scaleSettings.mode}
                  onChange={(e) => onUpdateScaleSettings({ mode: e.target.value as any })}
                  className="bg-white border border-zinc-200 rounded px-2 py-1 text-xs"
                >
                  <option value="snug">緊湊聚焦 (動態放大)</option>
                  <option value="zero">全景模式 (從 0 開始)</option>
                  <option value="custom">自訂指定上下限</option>
                </select>
              </div>

              {scaleSettings.mode === 'custom' ? (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500">Min:</span>
                    <input
                      type="number"
                      value={scaleSettings.customMin ?? primaryMin}
                      onChange={(e) => onUpdateScaleSettings({ customMin: parseFloat(e.target.value) || 0 })}
                      className="w-16 bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500">Max:</span>
                    <input
                      type="number"
                      value={scaleSettings.customMax ?? primaryMax}
                      onChange={(e) => onUpdateScaleSettings({ customMax: parseFloat(e.target.value) || 100 })}
                      className="w-16 bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-zinc-500">上下留白緩衝：</span>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={scaleSettings.paddingPercent}
                    onChange={(e) => onUpdateScaleSettings({ paddingPercent: parseInt(e.target.value, 10) })}
                    className="w-24 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-zinc-600 font-mono text-[11px]">{scaleSettings.paddingPercent}%</span>
                </div>
              )}
            </div>

            {/* Grid Density & Curve Style */}
            <div>
              <div className="font-semibold text-zinc-800 mb-1.5">刻度線密度與外觀</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">格線分段：</span>
                  <div className="inline-flex rounded bg-zinc-200/60 p-0.5 text-[11px]">
                    {[3, 5, 8].map((steps) => (
                      <button
                        key={steps}
                        type="button"
                        onClick={() => onUpdateScaleSettings({ tickSteps: steps })}
                        className={`px-2 py-0.5 rounded ${
                          scaleSettings.tickSteps === steps
                            ? 'bg-white font-semibold text-zinc-900 shadow-2xs'
                            : 'text-zinc-600'
                        }`}
                      >
                        {steps}段
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scaleSettings.curveType === 'smooth'}
                      onChange={(e) => onUpdateScaleSettings({ curveType: e.target.checked ? 'smooth' : 'linear' })}
                      className="rounded border-zinc-300 text-blue-600 focus:ring-0"
                    />
                    <span>平滑曲線</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scaleSettings.showPoints}
                      onChange={(e) => onUpdateScaleSettings({ showPoints: e.target.checked })}
                      className="rounded border-zinc-300 text-blue-600 focus:ring-0"
                    />
                    <span>標註數據節點</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Multi-Axis & Dual Axis Options */}
            <div>
              <div className="font-semibold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>軸向對比控制</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">當前模式：</span>
                  <span className="font-bold text-zinc-900">
                    {currentMode === 'multi'
                      ? '多軸綜合對比'
                      : currentMode === 'dual'
                      ? '雙軸左右對比'
                      : '單一軸向聚焦'}
                  </span>
                </div>

                {currentMode === 'dual' && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-zinc-500">副指標：</span>
                    <select
                      value={dualAxis.secondaryMetric}
                      onChange={(e) => onUpdateDualAxis({ secondaryMetric: e.target.value as any })}
                      className="bg-white border border-zinc-200 rounded px-2 py-1 text-xs max-w-[150px]"
                    >
                      {Object.values(METRIC_DEFINITIONS).map((m) => (
                        <option key={m.key} value={m.key} disabled={m.key === primaryMetric.key}>
                          {m.label} ({m.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {currentMode === 'multi' && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="px-2.5 py-1 rounded bg-purple-600 text-white font-medium text-[11px] hover:bg-purple-700"
                    >
                      自訂多軸項目 ({activeMultiMetricKeys.length} 項)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main SVG Chart Canvas */}
      <div ref={containerRef} className="p-4 relative select-none">
        {filteredRecords.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-400 text-sm">
            <Eye className="w-8 h-8 mb-2 stroke-1" />
            <p>所選時間範圍內無數據記錄</p>
          </div>
        ) : (
          <div className="relative w-full aspect-[21/9] min-h-[300px]">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
              onMouseLeave={() => {
                setHoveredIndex(null);
                setHoveredMetricKey(null);
              }}
            >
              <defs>
                <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryMetric.color} stopOpacity="0.22" />
                  <stop offset="90%" stopColor={primaryMetric.color} stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Grid Lines & Ticks */}
              {currentMode === 'multi' && multiNormalization === 'relativeChange' ? (
                // Relative % Change Grid Lines & Ticks
                multiRelativeStats.ticks.map((val, idx) => {
                  const ratio =
                    (val - multiRelativeStats.minPct) /
                    (multiRelativeStats.maxPct - multiRelativeStats.minPct || 1);
                  const y = paddingTop + chartHeight - ratio * chartHeight;
                  const isZero = Math.abs(val) < 0.05;

                  return (
                    <g key={`rel-grid-${idx}`}>
                      {scaleSettings.showGrid && (
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={width - paddingRight}
                          y2={y}
                          stroke={isZero ? '#94a3b8' : '#e4e4e7'}
                          strokeDasharray={isZero ? '4 4' : '3 3'}
                          strokeWidth={isZero ? '1.5' : '1'}
                        />
                      )}
                      {/* Left Axis Tick Label */}
                      <text
                        x={paddingLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        fill={isZero ? '#0f172a' : '#71717a'}
                        fontWeight={isZero ? '700' : '400'}
                        fontSize="10"
                        fontFamily="sans-serif"
                      >
                        {val > 0 ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`}
                      </text>
                      {isZero && (
                        <text
                          x={width - paddingRight + 8}
                          y={y + 3}
                          textAnchor="start"
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="sans-serif"
                        >
                          基準 0%
                        </text>
                      )}
                    </g>
                  );
                })
              ) : (
                // Standard Single/Dual/Independent Grid Lines & Left Ticks
                primaryTicks.map((val, idx) => {
                  const ratio = (val - primaryMin) / (primaryMax - primaryMin || 1);
                  const y = paddingTop + chartHeight - ratio * chartHeight;
                  return (
                    <g key={`grid-${idx}`}>
                      {scaleSettings.showGrid && (
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={width - paddingRight}
                          y2={y}
                          stroke="#e4e4e7"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                      )}
                      {/* Left Axis Tick Label */}
                      <text
                        x={paddingLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        fill="#71717a"
                        fontSize="10"
                        fontFamily="sans-serif"
                      >
                        {currentMode === 'multi'
                          ? `${Math.round((1 - idx / (primaryTicks.length - 1 || 1)) * 100)}%`
                          : val.toFixed(primaryMetric.decimals)}
                      </text>
                    </g>
                  );
                })
              )}

              {/* Secondary Right Ticks if Dual Axis enabled */}
              {currentMode === 'dual' &&
                secondaryMetricDef &&
                secondaryTicks.map((val, idx) => {
                  const ratio = (val - secondaryMin) / (secondaryMax - secondaryMin || 1);
                  const y = paddingTop + chartHeight - ratio * chartHeight;
                  return (
                    <text
                      key={`s-grid-${idx}`}
                      x={width - paddingRight + 8}
                      y={y + 4}
                      textAnchor="start"
                      fill="#d97706"
                      fontSize="10"
                      fontFamily="sans-serif"
                    >
                      {val.toFixed(secondaryMetricDef.decimals)}
                    </text>
                  );
                })}

              {/* Single Mode: Area Fill */}
              {currentMode === 'single' && primaryAreaD && (
                <path d={primaryAreaD} fill="url(#primaryAreaGrad)" />
              )}

              {/* Single / Dual Curves */}
              {currentMode !== 'multi' && (
                <>
                  {primaryPathD && (
                    <path
                      d={primaryPathD}
                      fill="none"
                      stroke={primaryMetric.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {secondaryPathD && secondaryMetricDef && (
                    <path
                      d={secondaryPathD}
                      fill="none"
                      stroke={secondaryMetricDef.color}
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </>
              )}

              {/* Multi-Axis Curves */}
              {currentMode === 'multi' &&
                activeMultiMetricDefs.map((def) => {
                  const pathD = multiPaths[def.key];
                  if (!pathD) return null;

                  const isDimmed = hoveredMetricKey !== null && hoveredMetricKey !== def.key;
                  const isHighlighted = hoveredMetricKey === def.key;

                  return (
                    <path
                      key={`multi-path-${def.key}`}
                      d={pathD}
                      fill="none"
                      stroke={def.color}
                      strokeWidth={isHighlighted ? 3.5 : 2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={isDimmed ? 0.18 : 0.95}
                      className="transition-all duration-150"
                    />
                  );
                })}

              {/* Data points & hover interactive columns */}
              {points.map((p, idx) => {
                const isHovered = hoveredIndex === idx;
                const isSelected = selectedRecordId === p.record.id;

                return (
                  <g key={`pt-${idx}`}>
                    {/* Vertical guideline on hover */}
                    {isHovered && (
                      <line
                        x1={p.x}
                        y1={paddingTop}
                        x2={p.x}
                        y2={paddingTop + chartHeight}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Single / Dual circles */}
                    {currentMode !== 'multi' && (
                      <>
                        {/* Secondary metric circle (Dual) */}
                        {p.sy !== null && (
                          <circle
                            cx={p.x}
                            cy={p.sy}
                            r={isHovered ? 5 : 3.5}
                            fill="#ffffff"
                            stroke={secondaryMetricDef?.color || '#f59e0b'}
                            strokeWidth="2"
                            className="transition-all duration-100"
                          />
                        )}

                        {/* Primary metric circle */}
                        {(scaleSettings.showPoints || isHovered || isSelected || points.length <= 10) && (
                          <circle
                            cx={p.x}
                            cy={p.py}
                            r={isHovered ? 6.5 : isSelected ? 5.5 : 4}
                            fill={isSelected ? '#1e293b' : '#ffffff'}
                            stroke={primaryMetric.color}
                            strokeWidth={isHovered || isSelected ? 3 : 2}
                            className="transition-all duration-100 cursor-pointer shadow-xs"
                          />
                        )}
                      </>
                    )}

                    {/* Multi-Axis circles */}
                    {currentMode === 'multi' &&
                      activeMultiMetricDefs.map((def) => {
                        const y = p.multiY[def.key];
                        if (y === undefined) return null;

                        const isFocused = hoveredMetricKey === def.key;
                        const isDimmed = hoveredMetricKey !== null && hoveredMetricKey !== def.key;

                        if (!scaleSettings.showPoints && !isHovered && !isFocused && points.length > 15) {
                          return null;
                        }

                        return (
                          <circle
                            key={`m-dot-${def.key}-${idx}`}
                            cx={p.x}
                            cy={y}
                            r={isFocused || isHovered ? 5 : 3.5}
                            fill={isHovered ? def.color : '#ffffff'}
                            stroke={def.color}
                            strokeWidth="2"
                            opacity={isDimmed ? 0.2 : 1}
                            className="transition-all duration-100"
                          />
                        );
                      })}

                    {/* X-Axis Date Tick */}
                    <text
                      x={p.x}
                      y={height - 14}
                      textAnchor="middle"
                      fill={isHovered ? '#0f172a' : '#71717a'}
                      fontWeight={isHovered ? '600' : '400'}
                      fontSize="10"
                      fontFamily="sans-serif"
                    >
                      {p.record.date.split(' ')[0].replace(/^\d{4}\//, '')}
                    </text>
                    <text
                      x={p.x}
                      y={height - 2}
                      textAnchor="middle"
                      fill="#a1a1aa"
                      fontSize="9"
                      fontFamily="sans-serif"
                    >
                      {p.record.date.split(' ')[1] || ''}
                    </text>

                    {/* Wide Invisible touch/hover trigger rect */}
                    <rect
                      x={p.x - chartWidth / (points.length * 2 || 1)}
                      y={paddingTop}
                      width={chartWidth / (points.length || 1)}
                      height={chartHeight + 35}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onClick={() => onSelectRecord(p.record)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Floating Tooltip HUD Card */}
            {activePoint && (
              <div
                className="absolute z-20 pointer-events-none bg-zinc-900/95 text-white text-xs rounded-xl py-2.5 px-3.5 shadow-xl backdrop-blur-md border border-zinc-700/60 transition-all duration-75 min-w-[210px] max-w-[280px]"
                style={{
                  left: `${(activePoint.x / width) * 100}%`,
                  top: `${Math.min(200, Math.max(10, (activePoint.py / height) * 100 - 25))}%`,
                  transform: activePoint.x > width * 0.65 ? 'translate(-105%, -40%)' : 'translate(10px, -40%)',
                }}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-200">{activePoint.record.date}</span>
                  <span className="text-[10px] bg-zinc-800 px-1.5 py-0.2 rounded text-zinc-300">
                    {activePoint.record.modelName}
                  </span>
                </div>

                {/* Single / Dual Tooltip Rows */}
                {currentMode !== 'multi' ? (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryMetric.color }} />
                        <span className="text-zinc-300">{primaryMetric.label}:</span>
                      </div>
                      <span className="font-bold text-white text-sm">
                        {activePoint.pVal.toFixed(primaryMetric.decimals)} {primaryMetric.unit}
                      </span>
                    </div>

                    {secondaryMetricDef && activePoint.sVal !== null && (
                      <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-800/80">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: secondaryMetricDef.color }} />
                          <span className="text-amber-200">{secondaryMetricDef.label}:</span>
                        </div>
                        <span className="font-bold text-amber-100 text-sm">
                          {activePoint.sVal.toFixed(secondaryMetricDef.decimals)} {secondaryMetricDef.unit}
                        </span>
                      </div>
                    )}

                    {/* Single mode diff vs previous */}
                    {activePoint.index > 0 && (
                      <div className="pt-1.5 border-t border-zinc-800 text-[11px] flex items-center justify-between text-zinc-400">
                        <span>較前次量測：</span>
                        {(() => {
                          const prev = points[activePoint.index - 1];
                          const diff = activePoint.pVal - prev.pVal;
                          const isGood =
                            primaryMetric.goodDirection === 'neutral'
                              ? true
                              : primaryMetric.goodDirection === 'lower'
                              ? diff <= 0
                              : diff >= 0;
                          return (
                            <span
                              className={`font-medium ${
                                Math.abs(diff) < 0.01
                                  ? 'text-zinc-400'
                                  : isGood
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {diff > 0 ? `+${diff.toFixed(primaryMetric.decimals)}` : diff.toFixed(primaryMetric.decimals)}{' '}
                              {primaryMetric.unit}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  // Multi-Axis Comprehensive Rows
                  <div className="mt-2 space-y-1.5">
                    {activeMultiMetricDefs.map((def) => {
                      const val = activePoint.multiVal[def.key];
                      const prevVal =
                        activePoint.index > 0
                          ? (points[activePoint.index - 1].multiVal[def.key] as number)
                          : null;
                      const diff = prevVal !== null ? val - prevVal : null;
                      const relPct = activePoint.multiPct[def.key];

                      const isGood =
                        diff === null || def.goodDirection === 'neutral'
                          ? true
                          : def.goodDirection === 'lower'
                          ? diff <= 0
                          : diff >= 0;

                      return (
                        <div
                          key={def.key}
                          className="flex items-center justify-between gap-2 text-xs py-0.5"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: def.color }}
                            />
                            <span className="text-zinc-300 truncate">{def.shortLabel || def.label}:</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 font-mono">
                            <span className="font-bold text-white">
                              {val.toFixed(def.decimals)}
                              <span className="text-[10px] text-zinc-400 font-normal ml-0.5">{def.unit}</span>
                            </span>

                            {/* Diff from previous point */}
                            {diff !== null && Math.abs(diff) >= 0.01 && (
                              <span
                                className={`text-[10px] font-semibold ${
                                  isGood ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {diff > 0 ? `+${diff.toFixed(def.decimals)}` : diff.toFixed(def.decimals)}
                              </span>
                            )}

                            {/* Relative % badge if in relative mode */}
                            {multiNormalization === 'relativeChange' && relPct !== undefined && (
                              <span
                                className={`text-[9px] px-1 rounded ${
                                  relPct >= 0 ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-800 text-zinc-300'
                                }`}
                                title="相對首日量測總累計變化幅度"
                              >
                                {relPct > 0 ? `+${relPct.toFixed(1)}%` : `${relPct.toFixed(1)}%`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-2 pt-1 border-t border-zinc-800 text-[10px] text-zinc-400 text-center italic">
                  點擊節點可切換當前量測檢視點
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metric Quick Selector Tabs below Chart (in Single Mode) */}
      {currentMode === 'single' && (
        <div className="px-5 py-3 bg-zinc-50/70 border-t border-zinc-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <span className="text-zinc-400 font-medium whitespace-nowrap mr-1">快捷切換指標:</span>
          {(['weight', 'bodyFatPct', 'skeletalMusclePct', 'visceralFat', 'bmi', 'basalMetabolism'] as const).map(
            (key) => {
              const def = METRIC_DEFINITIONS[key];
              const isSelected = primaryMetric.key === key;
              return (
                <button
                  key={key}
                  id={`quick-metric-${key}`}
                  type="button"
                  onClick={() => onSelectPrimaryMetric(def)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-zinc-900 text-white shadow-2xs font-semibold'
                      : 'bg-white text-zinc-700 border border-zinc-200/80 hover:bg-zinc-100/80'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? '#ffffff' : def.color }}
                  />
                  <span>{def.label}</span>
                </button>
              );
            }
          )}
        </div>
      )}

      {/* Multi-Axis Mode Range Summary Strip */}
      {currentMode === 'multi' && (
        <div className="px-5 py-2.5 bg-zinc-50/70 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center flex-wrap gap-2 text-zinc-600">
            <span className="text-zinc-400 font-medium whitespace-nowrap">各軸數據量程：</span>
            {activeMultiMetricDefs.map((def) => {
              const stat = multiIndependentStats[def.key];
              if (!stat) return null;
              return (
                <div
                  key={def.key}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-zinc-200/70 text-[11px]"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: def.color }} />
                  <span className="font-medium text-zinc-800">{def.shortLabel || def.label}:</span>
                  <span className="font-mono text-zinc-500">
                    {stat.min} ~ {stat.max} {def.unit}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition-colors"
          >
            <span>調整對比項目</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Metric Selector Modal */}
      <MultiAxisMetricPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        activeMetrics={activeMultiMetricKeys}
        onToggleMetric={handleToggleMultiMetric}
        onApplyPreset={handleApplyPreset}
        latestRecord={latestRecord}
      />
    </div>
  );
};
