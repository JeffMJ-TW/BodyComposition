import React from 'react';
import { BodyRecord, MetricDefinition, MetricKey } from '../types';
import { METRIC_DEFINITIONS } from '../utils/constants';
import { evaluateBMI, evaluateBodyFat, evaluateVisceralFat, evaluateSkeletalMuscle } from '../utils/healthEvaluation';
import { Scale, Activity, Flame, ShieldAlert, Sparkles, HeartPulse, Dumbbell } from 'lucide-react';

interface MetricOverviewCardsProps {
  currentRecord: BodyRecord;
  previousRecord?: BodyRecord | null;
  selectedMetricKey: MetricKey;
  onSelectMetric: (metric: MetricDefinition) => void;
}

export const MetricOverviewCards: React.FC<MetricOverviewCardsProps> = ({
  currentRecord,
  previousRecord,
  selectedMetricKey,
  onSelectMetric,
}) => {
  // Compute evaluations
  const bmiEval = evaluateBMI(currentRecord.bmi);
  const fatEval = evaluateBodyFat(currentRecord.bodyFatPct);
  const viscEval = evaluateVisceralFat(currentRecord.visceralFat);
  const muscleEval = evaluateSkeletalMuscle(currentRecord.skeletalMusclePct);

  const cards = [
    {
      metric: METRIC_DEFINITIONS.weight,
      value: currentRecord.weight.toFixed(2),
      prevValue: previousRecord?.weight,
      icon: Scale,
      badge: { label: `BMI ${currentRecord.bmi}`, class: bmiEval.badgeClass },
      subText: `較前次`,
    },
    {
      metric: METRIC_DEFINITIONS.bodyFatPct,
      value: currentRecord.bodyFatPct.toFixed(1),
      prevValue: previousRecord?.bodyFatPct,
      icon: Activity,
      badge: { label: fatEval.label, class: fatEval.badgeClass },
      subText: `脂肪量 ${currentRecord.bodyFatKg.toFixed(1)} kg`,
    },
    {
      metric: METRIC_DEFINITIONS.skeletalMusclePct,
      value: currentRecord.skeletalMusclePct.toFixed(1),
      prevValue: previousRecord?.skeletalMusclePct,
      icon: Dumbbell,
      badge: { label: muscleEval.label, class: muscleEval.badgeClass },
      subText: `肌肉量 ${currentRecord.skeletalMuscleKg.toFixed(1)} kg`,
    },
    {
      metric: METRIC_DEFINITIONS.visceralFat,
      value: currentRecord.visceralFat.toFixed(1),
      prevValue: previousRecord?.visceralFat,
      icon: ShieldAlert,
      badge: { label: viscEval.label, class: viscEval.badgeClass },
      subText: currentRecord.visceralFat <= 9 ? '安全區間' : '注意腹部囤積',
    },
    {
      metric: METRIC_DEFINITIONS.bmi,
      value: currentRecord.bmi.toFixed(1),
      prevValue: previousRecord?.bmi,
      icon: HeartPulse,
      badge: { label: bmiEval.label, class: bmiEval.badgeClass },
      subText: '標準 18.5 ~ 24.0',
    },
    {
      metric: METRIC_DEFINITIONS.basalMetabolism,
      value: Math.round(currentRecord.basalMetabolism).toString(),
      prevValue: previousRecord?.basalMetabolism,
      icon: Flame,
      badge: { label: `${currentRecord.bodyAge} 歲`, class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      subText: `身體生理年齡`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const isSelected = selectedMetricKey === card.metric.key;
        const IconComponent = card.icon;

        let delta: number | null = null;
        let deltaText = '';
        let isGood = true;

        if (card.prevValue !== undefined && card.prevValue !== null) {
          delta = parseFloat(((card.metric.key === 'basalMetabolism' ? currentRecord.basalMetabolism : (currentRecord[card.metric.key] as number)) - card.prevValue).toFixed(card.metric.decimals));
          deltaText = delta > 0 ? `+${delta}` : `${delta}`;

          if (card.metric.goodDirection === 'lower') {
            isGood = delta <= 0;
          } else if (card.metric.goodDirection === 'higher') {
            isGood = delta >= 0;
          }
        }

        return (
          <div
            key={card.metric.key}
            id={`metric-card-${card.metric.key}`}
            onClick={() => onSelectMetric(card.metric)}
            className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer select-none text-left flex flex-col justify-between ${
              isSelected
                ? 'bg-white border-zinc-900 shadow-md ring-2 ring-zinc-900/10'
                : 'bg-white border-zinc-200/80 hover:border-zinc-300 hover:shadow-xs'
            }`}
          >
            {/* Top row: icon + label + active marker */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: isSelected ? card.metric.color : 'rgba(244, 244, 245, 0.8)',
                    color: isSelected ? '#ffffff' : card.metric.color,
                  }}
                >
                  <IconComponent className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                  {card.metric.shortLabel}
                </span>
              </div>

              {isSelected && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  圖表
                </span>
              )}
            </div>

            {/* Middle: Big number */}
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">
                  {card.value}
                </span>
                <span className="text-xs font-medium text-zinc-500">{card.metric.unit}</span>
              </div>

              {/* Delta change pill */}
              <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                {delta !== null && delta !== 0 ? (
                  <span
                    className={`font-semibold px-1.5 py-0.2 rounded font-mono ${
                      isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {deltaText}
                  </span>
                ) : (
                  <span className="text-zinc-400 font-mono">持平</span>
                )}
                <span className="text-zinc-400 text-[10px] truncate">{card.subText}</span>
              </div>
            </div>

            {/* Bottom badge */}
            <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between">
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border truncate ${card.badge.class}`}
              >
                {card.badge.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
