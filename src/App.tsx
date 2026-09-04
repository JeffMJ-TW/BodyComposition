import React, { useState, useEffect, useMemo } from 'react';
import {
  BodyRecord,
  MetricDefinition,
  ScaleSettings,
  DualAxisSettings,
  TimeRangeFilter,
  AIAnalysisData,
  UserHealthGoal,
  ChartDisplayMode,
  MultiAxisSettings,
} from './types';
import { INITIAL_RECORDS, METRIC_DEFINITIONS } from './utils/constants';
import { mergeBodyRecords } from './utils/csvParser';
import { MetricOverviewCards } from './components/MetricOverviewCards';
import { TrendChart } from './components/TrendChart';
import { SegmentalAnalysis } from './components/SegmentalAnalysis';
import { WeightLossQualityCard } from './components/WeightLossQualityCard';
import { HealthGoalsCard } from './components/HealthGoalsCard';
import { AiHealthAdvisor } from './components/AiHealthAdvisor';
import { HistoryTable } from './components/HistoryTable';
import { CsvImportModal } from './components/CsvImportModal';
import { QuickAddModal } from './components/QuickAddModal';
import { DraggableSection } from './components/DraggableSection';
import { MounjaroHub } from './components/mounjaro/MounjaroHub';
import {
  MounjaroPen,
  InjectionRecord,
  MounjaroSettings,
  MounjaroRoiMetrics,
} from './types';
import {
  INITIAL_MOUNJARO_PENS,
  INITIAL_INJECTIONS,
  DEFAULT_MOUNJARO_SETTINGS,
} from './utils/mounjaroConstants';
import {
  UploadCloud,
  PlusCircle,
  Activity,
  Sparkles,
  RotateCcw,
  Calendar,
  LayoutList,
  Eye,
  EyeOff,
  BarChart3,
  TrendingUp,
  Target,
  HeartHandshake,
  History,
  Syringe,
  Boxes,
  Scale as ScaleIcon,
} from 'lucide-react';

const STORAGE_KEYS = {
  RECORDS: 'body_measurement_records_v1',
  AI_ENABLED: 'body_measurement_ai_enabled_v1',
  AI_CACHED: 'body_measurement_ai_cached_v1',
  AI_TIME: 'body_measurement_ai_time_v1',
  GOALS: 'body_measurement_goals_v1',
  SCALE: 'body_measurement_scale_v1',
  CHART_MODE: 'body_measurement_chart_mode_v1',
  MULTI_AXIS: 'body_measurement_multi_axis_v1',
  SECTION_ORDER: 'body_measurement_section_order_v1',
  SECTION_COLLAPSED: 'body_measurement_section_collapsed_v1',
  MOUNJARO_PENS: 'body_measurement_mounjaro_pens_v1',
  MOUNJARO_INJECTIONS: 'body_measurement_mounjaro_injections_v1',
  MOUNJARO_ACTIVE_PEN: 'body_measurement_mounjaro_active_pen_v1',
  MOUNJARO_SETTINGS: 'body_measurement_mounjaro_settings_v1',
  ACTIVE_VIEW: 'body_measurement_app_view_v1',
};

export type SectionId =
  | 'mounjaro'
  | 'metrics'
  | 'chart'
  | 'analysis'
  | 'goals'
  | 'advice'
  | 'history';

const DEFAULT_SECTION_ORDER: SectionId[] = [
  'mounjaro',
  'metrics',
  'chart',
  'analysis',
  'goals',
  'advice',
  'history',
];

export default function App() {
  // 1. Records State
  const [records, setRecords] = useState<BodyRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load records from localStorage', e);
    }
    return INITIAL_RECORDS;
  });

  // Selected active record
  const [selectedRecordId, setSelectedRecordId] = useState<string>(() => {
    return records.length > 0 ? records[records.length - 1].id : '';
  });

  // Primary chart metric
  const [primaryMetric, setPrimaryMetric] = useState<MetricDefinition>(METRIC_DEFINITIONS.weight);

  // Scale Settings
  const [scaleSettings, setScaleSettings] = useState<ScaleSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCALE);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      mode: 'snug',
      customMin: 80,
      customMax: 90,
      paddingPercent: 12,
      tickSteps: 5,
      showGrid: true,
      showPoints: true,
      curveType: 'smooth',
    };
  });

  // Dual Axis Settings
  const [dualAxis, setDualAxis] = useState<DualAxisSettings>({
    enabled: false,
    primaryMetric: 'weight',
    secondaryMetric: 'bodyFatPct',
  });

  // Chart Mode: 'single' | 'dual' | 'multi'
  const [chartMode, setChartMode] = useState<ChartDisplayMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHART_MODE);
      if (saved === 'single' || saved === 'dual' || saved === 'multi') return saved;
    } catch (e) {}
    return 'single';
  });

  // Multi Axis Settings
  const [multiAxis, setMultiAxis] = useState<MultiAxisSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MULTI_AXIS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: false,
      metrics: ['weight', 'bodyFatPct', 'skeletalMusclePct', 'visceralFat'],
      normalization: 'independent',
      highlightedMetric: null,
    };
  });

  // Time Range Filter
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all');

  // AI Toggle & Cached Advice
  const [isAiEnabled, setIsAiEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AI_ENABLED);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return false; // Default OFF to conserve quota as requested
  });

  const [cachedAnalysis, setCachedAnalysis] = useState<AIAnalysisData | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AI_CACHED);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [lastAnalysisTime, setLastAnalysisTime] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.AI_TIME) || null;
  });

  // Health Goals
  const [goals, setGoals] = useState<UserHealthGoal>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { targetWeight: 78.0, targetBodyFatPct: 20.0, targetVisceralFat: 8.0 };
  });

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch (e) {}
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AI_ENABLED, JSON.stringify(isAiEnabled));
    } catch (e) {}
  }, [isAiEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCALE, JSON.stringify(scaleSettings));
    } catch (e) {}
  }, [scaleSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {}
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHART_MODE, chartMode);
    } catch (e) {}
  }, [chartMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MULTI_AXIS, JSON.stringify(multiAxis));
    } catch (e) {}
  }, [multiAxis]);

  // Section Order State & Persistence
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SECTION_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_SECTION_ORDER.length) {
          const allValid = DEFAULT_SECTION_ORDER.every((id) => parsed.includes(id));
          if (allValid) return parsed;
        }
      }
    } catch (e) {}
    return DEFAULT_SECTION_ORDER;
  });

  // Section Collapsed State & Persistence
  const [collapsedSections, setCollapsedSections] = useState<Record<SectionId, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SECTION_COLLAPSED);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      mounjaro: false,
      metrics: false,
      chart: false,
      analysis: false,
      goals: false,
      advice: false,
      history: false,
    };
  });

  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SECTION_ORDER, JSON.stringify(sectionOrder));
    } catch (e) {}
  }, [sectionOrder]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SECTION_COLLAPSED, JSON.stringify(collapsedSections));
    } catch (e) {}
  }, [collapsedSections]);

  // Section Layout Handlers
  const handleToggleCollapse = (id: SectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCollapseAll = () => {
    setCollapsedSections({
      mounjaro: true,
      metrics: true,
      chart: true,
      analysis: true,
      goals: true,
      advice: true,
      history: true,
    });
  };

  const handleExpandAll = () => {
    setCollapsedSections({
      mounjaro: false,
      metrics: false,
      chart: false,
      analysis: false,
      goals: false,
      advice: false,
      history: false,
    });
  };

  const handleMoveSection = (id: SectionId, direction: 'up' | 'down') => {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const newOrder = [...prev];
      const temp = newOrder[idx];
      newOrder[idx] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;
      return newOrder;
    });
  };

  const handleReorder = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setSectionOrder((prev) => {
      const sourceIdx = prev.indexOf(sourceId as SectionId);
      const targetIdx = prev.indexOf(targetId as SectionId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const newOrder = [...prev];
      const [removed] = newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, removed);
      return newOrder;
    });
  };

  const handleResetLayout = () => {
    setSectionOrder(DEFAULT_SECTION_ORDER);
    setCollapsedSections({
      mounjaro: false,
      metrics: false,
      chart: false,
      analysis: false,
      goals: false,
      advice: false,
      history: false,
    });
  };

  // Active record resolution
  const activeRecord = records.find((r) => r.id === selectedRecordId) || records[records.length - 1] || INITIAL_RECORDS[0];
  const activeIndex = records.findIndex((r) => r.id === activeRecord.id);
  const previousRecord = activeIndex > 0 ? records[activeIndex - 1] : records.length > 1 ? records[records.length - 2] : null;
  const baselineRecord = records[0];

  // Actions
  const handleImportRecords = (incoming: BodyRecord[]) => {
    const { merged, addedCount, updatedCount } = mergeBodyRecords(records, incoming);
    setRecords(merged);
    if (merged.length > 0) {
      setSelectedRecordId(merged[merged.length - 1].id);
    }
    alert(`CSV 匯入成功！\n新增紀錄：${addedCount} 筆\n更新紀錄：${updatedCount} 筆\n目前總紀錄：${merged.length} 筆`);
  };

  const handleAddRecord = (record: BodyRecord) => {
    const updated = [...records, record].sort((a, b) => a.timestamp - b.timestamp);
    setRecords(updated);
    setSelectedRecordId(record.id);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    if (updated.length === 0) {
      alert('請至少保留一筆紀錄');
      return;
    }
    setRecords(updated);
    if (selectedRecordId === id) {
      setSelectedRecordId(updated[updated.length - 1].id);
    }
  };

  const handleResetSampleData = () => {
    if (confirm('確定要還原至初始範例資料嗎？（將重設為您提供的3筆標準量測紀錄）')) {
      setRecords(INITIAL_RECORDS);
      setSelectedRecordId(INITIAL_RECORDS[INITIAL_RECORDS.length - 1].id);
      localStorage.removeItem(STORAGE_KEYS.AI_CACHED);
      setCachedAnalysis(null);
    }
  };

  const handleSaveAnalysis = (analysis: AIAnalysisData) => {
    setCachedAnalysis(analysis);
    const nowStr = new Date().toLocaleString('zh-TW', { hour12: false });
    setLastAnalysisTime(nowStr);
    localStorage.setItem(STORAGE_KEYS.AI_CACHED, JSON.stringify(analysis));
    localStorage.setItem(STORAGE_KEYS.AI_TIME, nowStr);
  };

  // --- Mounjaro (Tirzepatide) State ---
  const [pens, setPens] = useState<MounjaroPen[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOUNJARO_PENS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure standard dose options requested by user (2.5mg/支, 5mg/支, 15mg/支) are available
          const has2_5 = parsed.some((p: MounjaroPen) => p.totalDoseMg === 2.5 || p.name.includes('2.5mg'));
          const has5 = parsed.some((p: MounjaroPen) => p.totalDoseMg === 5.0 || p.name.includes('5mg'));
          const has15 = parsed.some((p: MounjaroPen) => p.totalDoseMg === 15.0 || p.name.includes('15mg'));
          if (!has2_5 || !has5 || !has15) {
            const merged = [...parsed];
            if (!has2_5) {
              merged.push({
                id: 'pen-mj-2.5mg-start',
                name: '猛健樂 2.5mg/支 (單劑/起始)',
                purchaseDate: '2026-08-01',
                priceTwd: 2500,
                totalDoseMg: 2.5,
                residualBufferMg: 0.1,
                notes: '2.5mg/支 原廠單劑起始筆',
              });
            }
            if (!has5) {
              merged.push({
                id: 'pen-mj-5mg-00',
                name: '猛健樂 5mg/支 (微調/雙週)',
                purchaseDate: '2026-08-05',
                priceTwd: 5500,
                totalDoseMg: 5.0,
                residualBufferMg: 0.6,
                notes: '5mg/支 標準維持與微調劑量',
              });
            }
            if (!has15) {
              merged.push({
                id: 'pen-mj-15mg-top',
                name: '猛健樂 15mg/支 (進階/頂規)',
                purchaseDate: '2026-08-20',
                priceTwd: 11500,
                totalDoseMg: 15.0,
                residualBufferMg: 0.6,
                notes: '15mg/支 頂規高劑量藥筆',
              });
            }
            return merged;
          }
          return parsed;
        }
      }
    } catch (e) {}
    return INITIAL_MOUNJARO_PENS;
  });

  const [injections, setInjections] = useState<InjectionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOUNJARO_INJECTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_INJECTIONS;
  });

  const [activePenId, setActivePenId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOUNJARO_ACTIVE_PEN);
      if (saved) return saved;
    } catch (e) {}
    return INITIAL_MOUNJARO_PENS[0]?.id || '';
  });

  const [mounjaroSettings, setMounjaroSettings] = useState<MounjaroSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOUNJARO_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MOUNJARO_SETTINGS;
  });

  const [appView, setAppView] = useState<'mounjaro' | 'omron' | 'all'>('mounjaro');

  // Persistence Effects for Mounjaro
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOUNJARO_PENS, JSON.stringify(pens));
    } catch (e) {}
  }, [pens]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOUNJARO_INJECTIONS, JSON.stringify(injections));
    } catch (e) {}
  }, [injections]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOUNJARO_ACTIVE_PEN, activePenId);
    } catch (e) {}
  }, [activePenId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOUNJARO_SETTINGS, JSON.stringify(mounjaroSettings));
    } catch (e) {}
  }, [mounjaroSettings]);

  // Mounjaro ROI Calculation
  const roiMetrics = useMemo<MounjaroRoiMetrics>(() => {
    const totalInjectedMg = injections.reduce((sum, inj) => sum + inj.doseMg, 0);

    const usedPenIds = new Set(injections.map((inj) => inj.penId));
    const totalSpentTwd = pens
      .filter((pen) => usedPenIds.has(pen.id) || pen.id === activePenId)
      .reduce((sum, pen) => sum + pen.priceTwd, 0);

    const costPerMgTwd = totalInjectedMg > 0 ? totalSpentTwd / totalInjectedMg : 0;

    const sortedInjections = [...injections].sort(
      (a, b) =>
        new Date(`${a.date}T${a.time || '00:00'}`).getTime() -
        new Date(`${b.date}T${b.time || '00:00'}`).getTime()
    );

    const baselineWeightKg =
      sortedInjections[0]?.weightKg || records[0]?.weight || 87.5;

    const currentWeightKg =
      activeRecord?.weight ||
      sortedInjections[sortedInjections.length - 1]?.weightKg ||
      baselineWeightKg;

    const weightDeltaKg = Number((currentWeightKg - baselineWeightKg).toFixed(1));
    const kgLost = baselineWeightKg - currentWeightKg;

    const costPerKgLostTwd = kgLost > 0 ? totalSpentTwd / kgLost : null;

    const firstDoseTime = sortedInjections[0]
      ? new Date(`${sortedInjections[0].date}T${sortedInjections[0].time || '00:00'}`).getTime()
      : Date.now();
    const daysSinceFirstDose = Math.max(1, Math.round((Date.now() - firstDoseTime) / 86400000));

    const weeklyAvgCostTwd = (totalSpentTwd / daysSinceFirstDose) * 7;

    return {
      totalSpentTwd,
      totalInjectedMg: Number(totalInjectedMg.toFixed(1)),
      costPerMgTwd: Number(costPerMgTwd.toFixed(1)),
      weeklyAvgCostTwd: Number(weeklyAvgCostTwd.toFixed(0)),
      baselineWeightKg,
      currentWeightKg,
      weightDeltaKg,
      costPerKgLostTwd,
      daysSinceFirstDose,
    };
  }, [pens, injections, activePenId, records, activeRecord]);

  // Handlers for Mounjaro
  const handleSavePen = (pen: MounjaroPen) => {
    setPens((prev) => {
      const idx = prev.findIndex((p) => p.id === pen.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = pen;
        return next;
      }
      return [...prev, pen];
    });
  };

  const handleDeletePen = (id: string) => {
    if (pens.length <= 1) {
      alert('請至少保留一支藥筆記錄');
      return;
    }
    setPens((prev) => prev.filter((p) => p.id !== id));
    if (activePenId === id) {
      const remaining = pens.filter((p) => p.id !== id);
      if (remaining[0]) setActivePenId(remaining[0].id);
    }
  };

  const handleSaveInjection = (record: InjectionRecord) => {
    setInjections((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id);
      let next: InjectionRecord[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = record;
      } else {
        next = [...prev, record];
      }
      return next.sort(
        (a, b) =>
          new Date(`${a.date}T${a.time || '00:00'}`).getTime() -
          new Date(`${b.date}T${b.time || '00:00'}`).getTime()
      );
    });

    setPens((prev) =>
      prev.map((p) => {
        if (p.id === record.penId && !p.firstUsedDate) {
          return { ...p, firstUsedDate: record.date };
        }
        return p;
      })
    );

    if (record.weightKg) {
      const dateFormatted = record.date.replace(/-/g, '/');
      const existing = records.find((r) => r.date.startsWith(dateFormatted));
      if (!existing) {
        const newRecord: BodyRecord = {
          id: `rec-inj-${record.id}`,
          date: `${dateFormatted} ${record.time || '08:30'}`,
          timestamp: new Date(`${record.date}T${record.time || '08:30'}`).getTime(),
          timezone: 'Asia/Taipei',
          weight: record.weightKg,
          bodyFatPct: activeRecord?.bodyFatPct || 24.5,
          bodyFatKg: Number(((activeRecord?.bodyFatPct || 24.5) * record.weightKg / 100).toFixed(1)),
          visceralFat: activeRecord?.visceralFat || 7.0,
          basalMetabolism: activeRecord?.basalMetabolism || 1650,
          skeletalMusclePct: activeRecord?.skeletalMusclePct || 33.2,
          skeletalMuscleKg: Number(((activeRecord?.skeletalMusclePct || 33.2) * record.weightKg / 100).toFixed(1)),
          skeletalMuscleArmsPct: activeRecord?.skeletalMuscleArmsPct || 42.0,
          skeletalMuscleTrunkPct: activeRecord?.skeletalMuscleTrunkPct || 28.5,
          skeletalMuscleLegsPct: activeRecord?.skeletalMuscleLegsPct || 49.0,
          subcutaneousFatPct: activeRecord?.subcutaneousFatPct || 19.5,
          subcutaneousFatArmsPct: activeRecord?.subcutaneousFatArmsPct || 20.0,
          subcutaneousFatTrunkPct: activeRecord?.subcutaneousFatTrunkPct || 17.5,
          subcutaneousFatLegsPct: activeRecord?.subcutaneousFatLegsPct || 22.0,
          bmi: Number((record.weightKg / (1.75 * 1.75)).toFixed(1)),
          bodyAge: activeRecord?.bodyAge || 34,
          modelName: 'Mounjaro / Tirzepatide Sync',
          note: `猛健樂施打 ${record.doseMg}mg 體重同步`,
        };
        setRecords((prev) => [...prev, newRecord].sort((a, b) => a.timestamp - b.timestamp));
        setSelectedRecordId(newRecord.id);
      }
    }
  };

  const handleDeleteInjection = (id: string) => {
    setInjections((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateMounjaroSettings = (partial: Partial<MounjaroSettings>) => {
    setMounjaroSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div className="min-h-screen bg-zinc-100/60 text-zinc-900 flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-zinc-900 tracking-tight">
                  身體數值量測分析儀
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {activeRecord.modelName || 'Omron HBF-702T'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 hidden sm:block">
                人體組成雙頻四肢分析 • 刻度可調趨勢圖 • 減重品質評估 • 省流量 AI 建議
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="header-import-csv-btn"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>匯入 CSV 檔案</span>
            </button>

            <button
              type="button"
              id="header-quick-add-btn"
              onClick={() => setIsQuickAddModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">手動新增</span>
            </button>

            <button
              type="button"
              title="還原為原始範例資料"
              onClick={handleResetSampleData}
              className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* View Switcher Tabs: Mounjaro / Omron / All-in-One */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl gap-1">
            <button
              type="button"
              id="view-tab-mounjaro"
              onClick={() => setAppView('mounjaro')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                appView === 'mounjaro'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <Syringe className="w-3.5 h-3.5" />
              <span>猛健樂注射追蹤</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  appView === 'mounjaro' ? 'bg-purple-800 text-white' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {injections.length} 劑
              </span>
            </button>

            <button
              type="button"
              id="view-tab-omron"
              onClick={() => setAppView('omron')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                appView === 'omron'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>身體組成深入分析 (歐姆龍)</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  appView === 'omron' ? 'bg-blue-800 text-white' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {records.length} 筆
              </span>
            </button>

            <button
              type="button"
              id="view-tab-all"
              onClick={() => setAppView('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                appView === 'all'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>綜合全覽 (自由拖曳排版)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {appView === 'mounjaro' ? (
              <span className="flex items-center gap-1 text-purple-700 font-semibold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                <Syringe className="w-3.5 h-3.5" />
                <span>殘劑管理、部位輪替與體內 PK 藥動學模型已連動</span>
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>檢視量測點：<strong className="text-zinc-800 font-mono">{activeRecord.date}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* When in dedicated Mounjaro view, show full MounjaroHub directly */}
        {appView === 'mounjaro' ? (
          <MounjaroHub
            pens={pens}
            injections={injections}
            activePenId={activePenId}
            onSelectActivePen={setActivePenId}
            onSavePen={handleSavePen}
            onDeletePen={handleDeletePen}
            onSaveInjection={handleSaveInjection}
            onDeleteInjection={handleDeleteInjection}
            settings={mounjaroSettings}
            onUpdateSettings={handleUpdateMounjaroSettings}
            roi={roiMetrics}
            currentLatestWeight={activeRecord.weight}
          />
        ) : (
          <>
            {/* Latest Reading Indicator Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white rounded-xl border border-zinc-200/80 shadow-2xs text-xs">
              <div className="flex items-center gap-2 text-zinc-600">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>當前檢視量測點：</span>
                <span className="font-bold text-zinc-900 font-mono text-sm">{activeRecord.date}</span>
                <span className="text-zinc-400 font-mono">({activeRecord.timezone})</span>
              </div>

              <div className="flex items-center gap-3 text-zinc-500">
                <span>
                  總筆數：<strong className="text-zinc-900">{records.length}</strong> 筆
                </span>
                <span>•</span>
                <span>
                  AI 模式狀態：
                  <strong className={isAiEnabled ? 'text-purple-600' : 'text-zinc-700'}>
                    {isAiEnabled ? '已啟用 (有消耗)' : '已關閉 (省流量)'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Layout Customizer Toolbar: Drag Hint, Collapse/Expand All & Reset Order */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white rounded-xl border border-zinc-200/80 shadow-2xs text-xs">
              <div className="flex items-center gap-2 text-zinc-600">
                <LayoutList className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-bold text-zinc-900">大項版面自由排版：</span>
                <span className="text-zinc-500 hidden md:inline">
                  可按住左側圖示 <strong className="text-zinc-700">⠿</strong> 隨意拖曳調整上下順序，或點擊 <strong className="text-zinc-700">↑↓</strong> 與收折按鈕客製畫面
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  id="layout-collapse-all-btn"
                  onClick={handleCollapseAll}
                  className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                  <span>全部收折</span>
                </button>

                <button
                  type="button"
                  id="layout-expand-all-btn"
                  onClick={handleExpandAll}
                  className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-zinc-500" />
                  <span>全部展開</span>
                </button>

                <button
                  type="button"
                  id="layout-reset-order-btn"
                  onClick={handleResetLayout}
                  title="還原為系統預設排列順序與全展開狀態"
                  className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>重設排版順序</span>
                </button>
              </div>
            </div>

            {/* Dynamic Draggable & Collapsible Sections */}
            <div className="space-y-4">
              {(appView === 'omron' ? sectionOrder.filter((id) => id !== 'mounjaro') : sectionOrder).map((sectionId, idx) => {
                const meta = (() => {
                  switch (sectionId) {
                    case 'mounjaro':
                      return {
                        title: '猛健樂（Mounjaro / Tirzepatide）注射與用藥追蹤',
                        subtitle: '藥筆庫存與殘劑管理 · 部位輪替指引 · PK 濃度走勢 · 減重 ROI',
                        icon: <Syringe className="w-4 h-4" />,
                        iconBgColor: 'bg-purple-100 text-purple-700 border-purple-200',
                        summaryPreview: (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold text-purple-800">
                              已施打 {injections.length} 劑
                            </span>
                            <span className="text-zinc-300">·</span>
                            <span className="text-zinc-700">
                              總劑量 {roiMetrics.totalInjectedMg} mg
                            </span>
                            <span className="text-zinc-300">·</span>
                            <span className="text-emerald-700 font-semibold">
                              減重 {roiMetrics.weightDeltaKg > 0 ? `+${roiMetrics.weightDeltaKg}` : `${roiMetrics.weightDeltaKg}`} kg
                            </span>
                            {roiMetrics.costPerKgLostTwd !== null && (
                              <>
                                <span className="text-zinc-300">·</span>
                                <span className="text-amber-800 font-bold font-mono">
                                  NT$ {Math.round(roiMetrics.costPerKgLostTwd).toLocaleString()} /kg
                                </span>
                              </>
                            )}
                          </div>
                        ),
                        content: (
                          <MounjaroHub
                            pens={pens}
                            injections={injections}
                            activePenId={activePenId}
                            onSelectActivePen={setActivePenId}
                            onSavePen={handleSavePen}
                            onDeletePen={handleDeletePen}
                            onSaveInjection={handleSaveInjection}
                            onDeleteInjection={handleDeleteInjection}
                            settings={mounjaroSettings}
                            onUpdateSettings={handleUpdateMounjaroSettings}
                            roi={roiMetrics}
                            currentLatestWeight={activeRecord.weight}
                          />
                        ),
                      };
                case 'metrics':
                  return {
                    title: '核心量測指標總覽',
                    subtitle: '最新體態關鍵指數、評定等級與較前次增減',
                    icon: <BarChart3 className="w-4 h-4" />,
                    iconBgColor: 'bg-blue-50 text-blue-600 border-blue-200',
                    summaryPreview: (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-zinc-800">體重 {activeRecord.weight} kg</span>
                        <span className="text-zinc-300">·</span>
                        <span className="text-orange-600 font-medium">體脂 {activeRecord.bodyFatPct}%</span>
                        <span className="text-zinc-300">·</span>
                        <span className="text-emerald-600 font-medium">骨骼肌 {activeRecord.skeletalMusclePct}%</span>
                        <span className="text-zinc-300">·</span>
                        <span className="text-rose-600 font-medium">內臟 {activeRecord.visceralFat} 級</span>
                      </div>
                    ),
                    content: (
                      <MetricOverviewCards
                        currentRecord={activeRecord}
                        previousRecord={previousRecord}
                        selectedMetricKey={primaryMetric.key}
                        onSelectMetric={(m) => setPrimaryMetric(m)}
                      />
                    ),
                  };
                case 'chart':
                  return {
                    title: '身體數值走勢趨勢圖表',
                    subtitle: '單軸縮放 / 雙軸對比 / 多軸綜合關聯分析',
                    icon: <TrendingUp className="w-4 h-4" />,
                    iconBgColor: 'bg-purple-50 text-purple-600 border-purple-200',
                    summaryPreview: (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                          {chartMode === 'multi'
                            ? `多軸模式 (${multiAxis.metrics.length}項)`
                            : chartMode === 'dual'
                            ? '雙軸對比'
                            : primaryMetric.label}
                        </span>
                        <span>·</span>
                        <span>共 {records.length} 筆歷史量測點</span>
                      </div>
                    ),
                    content: (
                      <TrendChart
                        records={records}
                        primaryMetric={primaryMetric}
                        onSelectPrimaryMetric={setPrimaryMetric}
                        scaleSettings={scaleSettings}
                        onUpdateScaleSettings={(partial) => setScaleSettings((prev) => ({ ...prev, ...partial }))}
                        dualAxis={dualAxis}
                        onUpdateDualAxis={(partial) => setDualAxis((prev) => ({ ...prev, ...partial }))}
                        chartMode={chartMode}
                        onChangeChartMode={setChartMode}
                        multiAxis={multiAxis}
                        onUpdateMultiAxis={(partial) => setMultiAxis((prev) => ({ ...prev, ...partial }))}
                        timeRange={timeRange}
                        onChangeTimeRange={setTimeRange}
                        selectedRecordId={activeRecord.id}
                        onSelectRecord={(r) => setSelectedRecordId(r.id)}
                      />
                    ),
                  };
                case 'analysis':
                  return {
                    title: '部位肌肉脂肪與減重品質深度分析',
                    subtitle: '四肢與軀幹分佈 · 減脂/流失肌肉品質判定',
                    icon: <Activity className="w-4 h-4" />,
                    iconBgColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                    summaryPreview: (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 font-medium">四肢肌肉對稱</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold">減脂消長判定</span>
                      </div>
                    ),
                    content: (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <SegmentalAnalysis record={activeRecord} />
                        <WeightLossQualityCard
                          currentRecord={activeRecord}
                          baselineRecord={baselineRecord}
                        />
                      </div>
                    ),
                  };
                case 'goals':
                  return {
                    title: '個人健康目標追蹤',
                    subtitle: '設定體重、體脂與內臟脂肪目標與達成進度',
                    icon: <Target className="w-4 h-4" />,
                    iconBgColor: 'bg-amber-50 text-amber-600 border-amber-200',
                    summaryPreview: (
                      <div className="flex items-center gap-2 text-xs text-zinc-600">
                        <span>目標體重: <strong className="text-zinc-900">{goals.targetWeight || 78} kg</strong></span>
                        <span>·</span>
                        <span>目標體脂: <strong className="text-orange-600">{goals.targetBodyFatPct || 20}%</strong></span>
                      </div>
                    ),
                    content: (
                      <HealthGoalsCard
                        currentRecord={activeRecord}
                        goals={goals}
                        onUpdateGoals={setGoals}
                      />
                    ),
                  };
                case 'advice':
                  return {
                    title: '健康生活指引與建議',
                    subtitle: isAiEnabled ? 'AI 智能深度指引 (已啟用)' : '臨床醫學演算法指引 (省流量模式)',
                    icon: <HeartHandshake className="w-4 h-4" />,
                    iconBgColor: 'bg-rose-50 text-rose-600 border-rose-200',
                    summaryPreview: (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className={`px-2 py-0.5 rounded font-medium ${isAiEnabled ? 'bg-purple-100 text-purple-800' : 'bg-zinc-100 text-zinc-700'}`}>
                          {isAiEnabled ? 'AI 深度指引 (已啟用)' : '臨床生活指引 (省流量模式)'}
                        </span>
                      </div>
                    ),
                    content: (
                      <AiHealthAdvisor
                        records={records}
                        isAiEnabled={isAiEnabled}
                        onToggleAiEnabled={setIsAiEnabled}
                        cachedAnalysis={cachedAnalysis}
                        onSaveAnalysis={handleSaveAnalysis}
                        lastAnalysisTime={lastAnalysisTime}
                      />
                    ),
                  };
                case 'history':
                  return {
                    title: '量測紀錄歷史清單',
                    subtitle: `全量量測數據明細 (共 ${records.length} 筆) · 支援新增、刪除與 CSV 匯出`,
                    icon: <History className="w-4 h-4" />,
                    iconBgColor: 'bg-zinc-100 text-zinc-700 border-zinc-300',
                    summaryPreview: (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                        <span>總量測筆數: <strong className="text-zinc-900">{records.length} 筆</strong></span>
                        <span>·</span>
                        <span>最新時間: {activeRecord.date}</span>
                      </div>
                    ),
                    content: (
                      <HistoryTable
                        records={records}
                        onDeleteRecord={handleDeleteRecord}
                        selectedRecordId={activeRecord.id}
                        onSelectRecord={(r) => setSelectedRecordId(r.id)}
                        onOpenQuickAdd={() => setIsQuickAddModalOpen(true)}
                        onOpenImport={() => setIsImportModalOpen(true)}
                      />
                    ),
                  };
              }
            })();

            return (
              <DraggableSection
                key={sectionId}
                id={sectionId}
                index={idx}
                total={sectionOrder.length}
                title={meta.title}
                subtitle={meta.subtitle}
                icon={meta.icon}
                iconBgColor={meta.iconBgColor}
                summaryPreview={meta.summaryPreview}
                isCollapsed={collapsedSections[sectionId] ?? false}
                onToggleCollapse={() => handleToggleCollapse(sectionId)}
                onMoveUp={() => handleMoveSection(sectionId, 'up')}
                onMoveDown={() => handleMoveSection(sectionId, 'down')}
                onDragStart={(id) => setDraggingSectionId(id)}
                onDragOver={(e, id) => {
                  if (draggingSectionId && draggingSectionId !== id) {
                    setDragOverSectionId(id);
                  }
                }}
                onDragLeave={() => setDragOverSectionId(null)}
                onDrop={(targetId) => {
                  if (draggingSectionId) {
                    handleReorder(draggingSectionId, targetId);
                  }
                  setDraggingSectionId(null);
                  setDragOverSectionId(null);
                }}
                onDragEnd={() => {
                  setDraggingSectionId(null);
                  setDragOverSectionId(null);
                }}
                isDragging={draggingSectionId === sectionId}
                isDragOver={dragOverSectionId === sectionId}
              >
                {meta.content}
              </DraggableSection>
            );
          })}
        </div>
        </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 py-6 border-t border-zinc-200 bg-white text-center text-xs text-zinc-400">
        <p>身體數值量測分析儀 • 守護您的健康與體態組成 • 支援多款人體分析儀 CSV 匯入更新</p>
      </footer>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportRecords={handleImportRecords}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onAddRecord={handleAddRecord}
        lastRecord={activeRecord}
      />
    </div>
  );
}
