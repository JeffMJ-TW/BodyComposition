import React from 'react';
import { MetricKey, BodyRecord } from '../types';
import { METRIC_DEFINITIONS } from '../utils/constants';
import { X, Check, Layers, Sparkles, Plus, RotateCcw } from 'lucide-react';

interface MultiAxisMetricPickerProps {
  isOpen: boolean;
  onClose: () => void;
  activeMetrics: MetricKey[];
  onToggleMetric: (key: MetricKey) => void;
  onApplyPreset: (metrics: MetricKey[]) => void;
  latestRecord?: BodyRecord;
}

const CATEGORIES = [
  { id: 'main', name: '核心總覽', icon: '⚖️' },
  { id: 'fat', name: '脂肪與內臟', icon: '🔥' },
  { id: 'muscle', name: '骨骼肌肉', icon: '💪' },
  { id: 'metabolic', name: '代謝與年齡', icon: '⚡' },
  { id: 'segmental', name: '四肢軀幹分佈', icon: '🧍' },
] as const;

export const MULTI_AXIS_PRESETS = [
  {
    id: 'core-4',
    name: '肌脂消長 (4軸)',
    icon: '🎯',
    badge: '最推薦',
    metrics: ['weight', 'bodyFatPct', 'skeletalMusclePct', 'visceralFat'] as MetricKey[],
    desc: '體重 + 體脂率 + 骨骼肌率 + 內臟脂肪',
  },
  {
    id: 'mass-3',
    name: '實體重量 (3軸)',
    icon: '⚖️',
    badge: '減脂監控',
    metrics: ['weight', 'bodyFatKg', 'skeletalMuscleKg'] as MetricKey[],
    desc: '總重 + 脂肪重量(kg) + 肌肉重量(kg)',
  },
  {
    id: 'limbs-muscle-3',
    name: '四肢肌率 (3軸)',
    icon: '💪',
    badge: '肌力平衡',
    metrics: ['skeletalMuscleArmsPct', 'skeletalMuscleTrunkPct', 'skeletalMuscleLegsPct'] as MetricKey[],
    desc: '雙臂 + 身軀 + 雙腳骨骼肌率',
  },
  {
    id: 'metabolic-3',
    name: '代謝指標 (3軸)',
    icon: '📈',
    badge: '健康防護',
    metrics: ['bodyFatPct', 'visceralFat', 'basalMetabolism'] as MetricKey[],
    desc: '體脂率 + 內臟脂肪 + 基礎代謝率',
  },
  {
    id: 'subcutaneous-3',
    name: '皮下脂肪分佈 (3軸)',
    icon: '🧬',
    badge: '線條雕塑',
    metrics: ['subcutaneousFatArmsPct', 'subcutaneousFatTrunkPct', 'subcutaneousFatLegsPct'] as MetricKey[],
    desc: '雙臂 + 身軀 + 雙腳皮下脂肪率',
  },
];

export const MultiAxisMetricPicker: React.FC<MultiAxisMetricPickerProps> = ({
  isOpen,
  onClose,
  activeMetrics,
  onToggleMetric,
  onApplyPreset,
  latestRecord,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">多軸對比指標設定</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  已選取 {activeMetrics.length} / 6 項
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                可勾選 2~6 項不同單位指標，同時繪製於同一張時間軸進行趨勢交叉關聯
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Quick Presets Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                常用多軸組合推薦
              </span>
              <span className="text-[11px] text-zinc-400">點擊即可一鍵切換套用</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {MULTI_AXIS_PRESETS.map((preset) => {
                const isActive =
                  preset.metrics.length === activeMetrics.length &&
                  preset.metrics.every((k) => activeMetrics.includes(k));

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onApplyPreset(preset.metrics)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isActive
                        ? 'bg-purple-50/80 border-purple-300 ring-1 ring-purple-400 shadow-2xs'
                        : 'bg-zinc-50 hover:bg-white border-zinc-200/80 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-zinc-200/60 text-zinc-700">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-1">{preset.desc}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      {preset.metrics.map((k) => (
                        <span
                          key={k}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: METRIC_DEFINITIONS[k]?.color }}
                          title={METRIC_DEFINITIONS[k]?.label}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* All Available Metrics Checkbox Groups */}
          <div>
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-zinc-100">
              <span className="font-semibold text-zinc-800">所有身體量測指標清單 (可自選勾選)</span>
              <span className="text-[11px] text-zinc-400">上限 6 項，確保畫面整潔</span>
            </div>

            <div className="space-y-3.5">
              {CATEGORIES.map((cat) => {
                const catMetrics = Object.values(METRIC_DEFINITIONS).filter(
                  (m) => m.category === cat.id
                );
                if (catMetrics.length === 0) return null;

                return (
                  <div key={cat.id}>
                    <div className="text-[11px] font-bold text-zinc-500 mb-1.5 flex items-center gap-1">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catMetrics.map((def) => {
                        const isChecked = activeMetrics.includes(def.key);
                        const val = latestRecord ? (latestRecord[def.key] as number) : null;

                        return (
                          <div
                            key={def.key}
                            onClick={() => onToggleMetric(def.key)}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-white border-zinc-300 shadow-2xs ring-1'
                                : 'bg-zinc-50/70 border-zinc-200/70 hover:bg-zinc-50'
                            }`}
                            style={{
                              borderColor: isChecked ? def.color : undefined,
                              boxShadow: isChecked ? `0 0 0 1px ${def.color}33` : undefined,
                            }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Custom Checkbox */}
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                                  isChecked
                                    ? 'text-white'
                                    : 'border border-zinc-300 bg-white'
                                }`}
                                style={{ backgroundColor: isChecked ? def.color : undefined }}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>

                              {/* Color Bar / Dot */}
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: def.color }}
                              />

                              <div className="min-w-0">
                                <div className="font-semibold text-zinc-900 truncate">
                                  {def.label}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  單位：{def.unit || '無'}
                                </div>
                              </div>
                            </div>

                            {/* Current Reading */}
                            {val !== null && (
                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-zinc-800 text-xs">
                                  {val.toFixed(def.decimals)}
                                </span>
                                <span className="text-[10px] text-zinc-400 ml-0.5">
                                  {def.unit}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/80">
          <button
            type="button"
            onClick={() => onApplyPreset(MULTI_AXIS_PRESETS[0].metrics)}
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>還原預設 4 軸</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            完成設定 (套用 {activeMetrics.length} 軸)
          </button>
        </div>
      </div>
    </div>
  );
};
