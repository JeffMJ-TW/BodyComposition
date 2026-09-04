import React, { useState, useEffect, useMemo } from 'react';
import {
  Syringe,
  Boxes,
  Plus,
  Droplets,
  Beef,
  Sparkles,
  RefreshCw,
  TrendingDown,
  Activity,
  History,
  LayoutList,
  Eye,
  EyeOff,
  RotateCcw,
  Calculator,
  Download,
  CheckCircle2,
} from 'lucide-react';
import {
  MounjaroPen,
  InjectionRecord,
  MounjaroSettings,
  MounjaroRoiMetrics,
  InjectionSite,
  SymptomType,
} from '../../types';
import {
  INJECTION_SITES,
  getNextRecommendedSite,
  calculatePharmacokineticsCurve,
  exportMounjaroInjectionsToCsv,
} from '../../utils/mounjaroConstants';
import { DraggableSection } from '../DraggableSection';
import { MounjaroKpiHeader } from './MounjaroKpiHeader';
import { PenInventoryManager } from './PenInventoryManager';
import { InjectionLoggerModal } from './InjectionLoggerModal';
import { SiteRotationCard } from './SiteRotationCard';
import { PkConcentrationChart } from './PkConcentrationChart';
import { SideEffectAndLifestyleCard } from './SideEffectAndLifestyleCard';
import { InjectionHistoryList } from './InjectionHistoryList';
import { MounjaroResidualCalculator } from './MounjaroResidualCalculator';

export type MounjaroSectionId = 'kpi' | 'calculator' | 'site' | 'pk' | 'lifestyle' | 'history';

const DEFAULT_MOUNJARO_ORDER: MounjaroSectionId[] = [
  'kpi',
  'calculator',
  'site',
  'pk',
  'lifestyle',
  'history',
];

const STORAGE_KEY_ORDER = 'omron_mounjaro_section_order_v2';
const STORAGE_KEY_COLLAPSED = 'omron_mounjaro_section_collapsed_v2';

interface MounjaroHubProps {
  pens: MounjaroPen[];
  injections: InjectionRecord[];
  activePenId: string;
  onSelectActivePen: (id: string) => void;
  onSavePen: (pen: MounjaroPen) => void;
  onDeletePen: (id: string) => void;
  onSaveInjection: (record: InjectionRecord) => void;
  onDeleteInjection: (id: string) => void;
  settings: MounjaroSettings;
  onUpdateSettings: (settings: Partial<MounjaroSettings>) => void;
  roi: MounjaroRoiMetrics;
  currentLatestWeight?: number;
}

export const MounjaroHub: React.FC<MounjaroHubProps> = ({
  pens,
  injections,
  activePenId,
  onSelectActivePen,
  onSavePen,
  onDeletePen,
  onSaveInjection,
  onDeleteInjection,
  settings,
  onUpdateSettings,
  roi,
  currentLatestWeight,
}) => {
  const [isPenManagerOpen, setIsPenManagerOpen] = useState(false);
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InjectionRecord | null>(null);
  const [targetSiteForLogger, setTargetSiteForLogger] = useState<InjectionSite | undefined>(undefined);

  // Section Order State & Persistence
  const [sectionOrder, setSectionOrder] = useState<MounjaroSectionId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_MOUNJARO_ORDER.length) {
          const allValid = DEFAULT_MOUNJARO_ORDER.every((id) => parsed.includes(id));
          if (allValid) return parsed;
        }
      }
    } catch (e) {}
    return DEFAULT_MOUNJARO_ORDER;
  });

  // Section Collapsed State & Persistence
  const [collapsedSections, setCollapsedSections] = useState<Record<MounjaroSectionId, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COLLAPSED);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      kpi: false,
      calculator: false,
      site: false,
      pk: false,
      lifestyle: false,
      history: false,
    };
  });

  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const handleExportCsv = () => {
    const ok = exportMounjaroInjectionsToCsv(injections, pens);
    if (ok) {
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }
  };

  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(sectionOrder));
    } catch (e) {}
  }, [sectionOrder]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COLLAPSED, JSON.stringify(collapsedSections));
    } catch (e) {}
  }, [collapsedSections]);

  const activePen = pens.find((p) => p.id === activePenId) || pens[0];

  const sortedInjections = useMemo(() => {
    return [...injections].sort(
      (a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime()
    );
  }, [injections]);

  const latestInjection = sortedInjections[0] || null;

  // PK modeling calculations for previews
  const pkResult = useMemo(() => {
    return calculatePharmacokineticsCurve(injections, 12);
  }, [injections]);

  // Active pen capacity & remaining calculation
  const activePenMetrics = useMemo(() => {
    if (!activePen) return { remainingMg: 0, percent: 0 };
    const usedMg = injections
      .filter((inj) => inj.penId === activePen.id)
      .reduce((sum, r) => sum + r.doseMg, 0);
    const baseRemaining = activePen.totalDoseMg - usedMg;
    const withBuffer = baseRemaining + (settings.includeResidual ? activePen.residualBufferMg : 0);
    const remainingMg = Math.max(0, Number(withBuffer.toFixed(2)));
    const totalCapacity = activePen.totalDoseMg + (settings.includeResidual ? activePen.residualBufferMg : 0);
    const percent = totalCapacity > 0 ? Math.min(100, Math.max(0, Math.round((remainingMg / totalCapacity) * 100))) : 0;
    return { remainingMg, percent };
  }, [activePen, injections, settings.includeResidual]);

  // Site rotation recommendation for previews
  const lastSite = latestInjection?.site;
  const recommendedSite = getNextRecommendedSite(lastSite);
  const lastSiteDef = INJECTION_SITES.find((s) => s.key === lastSite);
  const recommendedSiteDef = INJECTION_SITES.find((s) => s.key === recommendedSite);

  // Reorder and collapse handlers
  const handleToggleCollapse = (id: MounjaroSectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCollapseAll = () => {
    setCollapsedSections({
      kpi: true,
      site: true,
      pk: true,
      lifestyle: true,
      history: true,
    });
  };

  const handleExpandAll = () => {
    setCollapsedSections({
      kpi: false,
      site: false,
      pk: false,
      lifestyle: false,
      history: false,
    });
  };

  const handleMoveSection = (id: MounjaroSectionId, direction: 'up' | 'down') => {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleReorder = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setSectionOrder((prev) => {
      const sourceIdx = prev.indexOf(sourceId as MounjaroSectionId);
      const targetIdx = prev.indexOf(targetId as MounjaroSectionId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;
      const next = [...prev];
      const [removed] = next.splice(sourceIdx, 1);
      next.splice(targetIdx, 0, removed);
      return next;
    });
  };

  const handleResetLayout = () => {
    setSectionOrder(DEFAULT_MOUNJARO_ORDER);
    setCollapsedSections({
      kpi: false,
      calculator: false,
      site: false,
      pk: false,
      lifestyle: false,
      history: false,
    });
  };

  const handleOpenNewInjectionWithSite = (site: InjectionSite) => {
    setTargetSiteForLogger(site);
    setEditingRecord(null);
    setIsLoggerOpen(true);
  };

  const handleOpenNewInjection = () => {
    setTargetSiteForLogger(undefined);
    setEditingRecord(null);
    setIsLoggerOpen(true);
  };

  const handleEditInjection = (rec: InjectionRecord) => {
    setTargetSiteForLogger(undefined);
    setEditingRecord(rec);
    setIsLoggerOpen(true);
  };

  // Quick habits update for latest injection (or create new for today if empty)
  const handleUpdateDailyHabits = (waterMl: number, proteinG: number) => {
    if (latestInjection) {
      onSaveInjection({
        ...latestInjection,
        waterMl,
        proteinG,
      });
    } else {
      const now = new Date();
      onSaveInjection({
        id: `inj-${Date.now()}`,
        date: now.toISOString().slice(0, 10),
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        penId: activePen?.id || '',
        doseMg: 2.5,
        site: 'abdomen_lr',
        waterMl,
        proteinG,
      });
    }
  };

  const handleUpdateSymptoms = (symptoms: Partial<Record<SymptomType, number>>) => {
    if (latestInjection) {
      onSaveInjection({
        ...latestInjection,
        symptoms,
      });
    }
  };

  const activeSymptomsCount = latestInjection?.symptoms
    ? Object.values(latestInjection.symptoms).filter((v) => typeof v === 'number' && v > 0).length
    : 0;

  return (
    <div className="space-y-4">
      {/* Sub-sections Layout Customizer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white rounded-xl border border-zinc-200/80 shadow-2xs text-xs">
        <div className="flex items-center gap-2 text-zinc-600">
          <LayoutList className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="font-bold text-zinc-900">猛健樂追蹤模組自由排版：</span>
          <span className="text-zinc-500 hidden md:inline">
            可按住左側 <strong className="text-zinc-700">⠿</strong> 隨意拖曳調整上下順序，或點擊 <strong className="text-zinc-700">↑↓</strong> 與收折自訂畫面
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            id="mj-export-csv-btn"
            onClick={handleExportCsv}
            disabled={injections.length === 0}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95 ${
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
                <span>匯出 CSV</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="mj-collapse-all-btn"
            onClick={handleCollapseAll}
            className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
            <span>全部收折</span>
          </button>

          <button
            type="button"
            id="mj-expand-all-btn"
            onClick={handleExpandAll}
            className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-500" />
            <span>全部展開</span>
          </button>

          <button
            type="button"
            id="mj-reset-order-btn"
            onClick={handleResetLayout}
            title="還原為猛健樂預設排列順序與全展開狀態"
            className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>重設項目順序</span>
          </button>
        </div>
      </div>

      {/* Dynamic Draggable & Collapsible Mounjaro Sub-sections */}
      <div className="space-y-4">
        {sectionOrder.map((sectionId, idx) => {
          const meta = (() => {
            switch (sectionId) {
              case 'kpi':
                return {
                  title: '藥品殘劑與 4 大核心指標總覽',
                  subtitle: '下次施打倒數 · 藥筆剩餘量扣額 · 體內估算濃度 · 減重 ROI',
                  icon: <Boxes className="w-4 h-4" />,
                  iconBgColor: 'bg-purple-100 text-purple-700 border-purple-200',
                  summaryPreview: (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-600">
                      <span className="font-semibold text-purple-800">
                        使用中：{activePen?.name || '未選取'}
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-zinc-700">
                        剩餘 <strong className="font-mono text-zinc-900">{activePenMetrics.remainingMg} mg</strong> ({activePenMetrics.percent}%)
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-blue-600 font-medium">
                        體內濃度 ~<strong className="font-mono">{pkResult.currentConcentration.toFixed(2)} mg</strong>
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span>
                        總花費 <strong className="font-mono text-zinc-900">NT$ {roi.totalSpentTwd.toLocaleString()}</strong>
                      </span>
                    </div>
                  ),
                  content: (
                    <MounjaroKpiHeader
                      pens={pens}
                      injections={injections}
                      activePen={activePen}
                      settings={settings}
                      onUpdateSettings={onUpdateSettings}
                      roi={roi}
                      onOpenNewInjection={handleOpenNewInjection}
                      onOpenPenManager={() => setIsPenManagerOpen(true)}
                    />
                  ),
                };
              case 'calculator':
                return {
                  title: '轉動格數與殘劑劑量計算機 (算一算還剩多少？)',
                  subtitle: '筆身刻度格數換算 (Clicks) · 殘劑剩餘模擬扣除 · 仿單效期安全規範',
                  icon: <Calculator className="w-4 h-4" />,
                  iconBgColor: 'bg-teal-100 text-teal-700 border-teal-200',
                  summaryPreview: (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-600">
                      <span className="font-semibold text-teal-800">
                        GLP-1 Taiwan 標準規範
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-zinc-700">
                        60格/標示劑量 · 包含殘劑約多 1 次劑量 (~3ml)
                      </span>
                    </div>
                  ),
                  content: (
                    <MounjaroResidualCalculator
                      activePen={activePen}
                      pens={pens}
                    />
                  ),
                };
              case 'site':
                return {
                  title: '注射部位智慧輪替地圖與身體圖譜',
                  subtitle: '腹部四象限、雙腿與雙臂外側輪替指引，降低皮下硬結與脂肪增生',
                  icon: <Syringe className="w-4 h-4" />,
                  iconBgColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                  summaryPreview: (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-zinc-500">前次部位：</span>
                      <strong className="text-zinc-800 font-medium">{lastSiteDef?.label || '尚未開始'}</strong>
                      <span className="text-zinc-300">·</span>
                      <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        👉 建議下次部位：{recommendedSiteDef?.label || '腹部右下'}
                      </span>
                    </div>
                  ),
                  content: (
                    <SiteRotationCard
                      injections={injections}
                      onOpenNewInjectionWithSite={handleOpenNewInjectionWithSite}
                    />
                  ),
                };
              case 'pk':
                return {
                  title: '體內藥物濃度走勢 (PK 藥動學模型)',
                  subtitle: 'Bateman 吸收與一級消除方程式 · 半衰期 5 天 · 穩定態模擬與達峰標記',
                  icon: <Activity className="w-4 h-4" />,
                  iconBgColor: 'bg-blue-100 text-blue-700 border-blue-200',
                  summaryPreview: (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-600">
                      <span>當前體內估計濃度：<strong className="text-blue-700 font-mono">{pkResult.currentConcentration.toFixed(2)} mg</strong></span>
                      <span className="text-zinc-300">·</span>
                      <span>峰值：<strong className="text-zinc-800 font-mono">{pkResult.peakConcentration.toFixed(2)} mg</strong></span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-zinc-500 font-mono">半衰期 ~5天 (一級消除)</span>
                    </div>
                  ),
                  content: (
                    <PkConcentrationChart injections={injections} />
                  ),
                };
              case 'lifestyle':
                return {
                  title: '副作用評估與水分／蛋白質攝取日誌',
                  subtitle: '6 大胃腸道反應評分追蹤 · 每日 2000ml 水分與 80g 蛋白質達成度',
                  icon: <Droplets className="w-4 h-4" />,
                  iconBgColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                  summaryPreview: (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-600">
                      <span>今日飲水：<strong className="text-cyan-700 font-mono">{latestInjection?.waterMl ?? settings.targetWaterMl} ml</strong> / 目標 {settings.targetWaterMl}ml</span>
                      <span className="text-zinc-300">·</span>
                      <span>蛋白質：<strong className="text-amber-700 font-mono">{latestInjection?.proteinG ?? settings.targetProteinG} g</strong> / 目標 {settings.targetProteinG}g</span>
                      <span className="text-zinc-300">·</span>
                      <span className={activeSymptomsCount > 0 ? 'text-amber-600 font-medium' : 'text-emerald-700'}>
                        {activeSymptomsCount > 0 ? `有 ${activeSymptomsCount} 項輕微症狀` : '無顯著不適反應'}
                      </span>
                    </div>
                  ),
                  content: (
                    <SideEffectAndLifestyleCard
                      latestRecord={latestInjection}
                      settings={settings}
                      onUpdateDailyHabits={handleUpdateDailyHabits}
                      onUpdateSymptoms={handleUpdateSymptoms}
                    />
                  ),
                };
              case 'history':
                return {
                  title: '歷史施打紀錄與殘劑扣減清單',
                  subtitle: `劑次歷程 · 部位軌跡 · 體重連動 (共 ${injections.length} 筆) · 支援直接編輯與安全刪除`,
                  icon: <History className="w-4 h-4" />,
                  iconBgColor: 'bg-amber-100 text-amber-700 border-amber-200',
                  summaryPreview: (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-600">
                      <span>累計紀錄：<strong className="text-zinc-900 font-mono">{injections.length} 劑次</strong></span>
                      <span className="text-zinc-300">·</span>
                      <span>最近施打：<strong className="text-purple-700 font-mono">{latestInjection ? `${latestInjection.date} (${latestInjection.doseMg}mg)` : '尚未施打'}</strong></span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-zinc-500">已扣抵原廠殘劑緩衝</span>
                    </div>
                  ),
                  content: (
                    <InjectionHistoryList
                      injections={injections}
                      pens={pens}
                      onOpenNewInjection={handleOpenNewInjection}
                      onEditInjection={handleEditInjection}
                      onDeleteInjection={onDeleteInjection}
                    />
                  ),
                };
            }
          })();

          return (
            <DraggableSection
              key={`mj-${sectionId}`}
              id={`mj-${sectionId}`}
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
              onDragStart={() => setDraggingSectionId(sectionId)}
              onDragOver={(e) => {
                if (draggingSectionId && draggingSectionId !== sectionId) {
                  setDragOverSectionId(sectionId);
                }
              }}
              onDragLeave={() => setDragOverSectionId(null)}
              onDrop={() => {
                if (draggingSectionId) {
                  handleReorder(draggingSectionId, sectionId);
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

      {/* Pen Inventory & Residual Manager Modal */}
      <PenInventoryManager
        pens={pens}
        injections={injections}
        activePenId={activePenId}
        onSelectActivePen={onSelectActivePen}
        onSavePen={onSavePen}
        onDeletePen={onDeletePen}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        isOpen={isPenManagerOpen}
        onClose={() => setIsPenManagerOpen(false)}
      />

      {/* Injection Logger Modal */}
      <InjectionLoggerModal
        isOpen={isLoggerOpen}
        onClose={() => {
          setIsLoggerOpen(false);
          setEditingRecord(null);
          setTargetSiteForLogger(undefined);
        }}
        onSave={onSaveInjection}
        onSavePen={onSavePen}
        pens={pens}
        activePenId={activePenId}
        existingRecord={editingRecord}
        lastInjection={latestInjection}
        settings={settings}
        currentLatestWeight={currentLatestWeight}
        initialSite={targetSiteForLogger}
      />
    </div>
  );
};
