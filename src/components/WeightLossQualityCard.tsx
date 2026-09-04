import React from 'react';
import { BodyRecord } from '../types';
import { evaluateWeightLossQuality } from '../utils/healthEvaluation';
import { Award, AlertTriangle, CheckCircle2, TrendingDown, Scale, Info } from 'lucide-react';

interface WeightLossQualityCardProps {
  currentRecord: BodyRecord;
  baselineRecord: BodyRecord;
}

export const WeightLossQualityCard: React.FC<WeightLossQualityCardProps> = ({
  currentRecord,
  baselineRecord,
}) => {
  const quality = evaluateWeightLossQuality(currentRecord, baselineRecord);

  // Compute Mass Breakdown for currentRecord
  const totalWeight = currentRecord.weight;
  const fatKg = currentRecord.bodyFatKg;
  const muscleKg = currentRecord.skeletalMuscleKg;
  const otherKg = Math.max(0, +(totalWeight - fatKg - muscleKg).toFixed(1));

  const fatPct = ((fatKg / totalWeight) * 100).toFixed(1);
  const musclePct = ((muscleKg / totalWeight) * 100).toFixed(1);
  const otherPct = ((otherKg / totalWeight) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">減重品質評估 (肌肉 vs 脂肪消長)</h3>
              <p className="text-xs text-zinc-500">
                基準點：{baselineRecord.date} ➔ 當前：{currentRecord.date}
              </p>
            </div>
          </div>

          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${quality.badgeClass}`}>
            {quality.title}
          </span>
        </div>

        {/* Quality Description Alert */}
        <div className="mt-3.5 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs leading-relaxed text-zinc-700">
          <p>{quality.description}</p>
        </div>

        {/* Delta metrics comparison */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-[11px] text-zinc-500 block mb-0.5">總體重變動</span>
            <span
              className={`text-base font-bold font-mono ${
                quality.deltaWeight < 0 ? 'text-blue-600' : quality.deltaWeight > 0 ? 'text-amber-600' : 'text-zinc-700'
              }`}
            >
              {quality.deltaWeight > 0 ? `+${quality.deltaWeight}` : quality.deltaWeight} kg
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-[11px] text-zinc-500 block mb-0.5">實質脂肪重變動</span>
            <span
              className={`text-base font-bold font-mono ${
                quality.deltaFatKg < 0 ? 'text-emerald-600' : quality.deltaFatKg > 0 ? 'text-rose-600' : 'text-zinc-700'
              }`}
            >
              {quality.deltaFatKg > 0 ? `+${quality.deltaFatKg}` : quality.deltaFatKg} kg
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-[11px] text-zinc-500 block mb-0.5">骨骼肌肉重變動</span>
            <span
              className={`text-base font-bold font-mono ${
                quality.deltaMuscleKg > 0 ? 'text-emerald-600' : quality.deltaMuscleKg < 0 ? 'text-rose-600' : 'text-zinc-700'
              }`}
            >
              {quality.deltaMuscleKg > 0 ? `+${quality.deltaMuscleKg}` : quality.deltaMuscleKg} kg
            </span>
          </div>
        </div>
      </div>

      {/* Body Mass Stacked Bar Visual */}
      <div className="mt-4 pt-3 border-t border-zinc-100">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="font-semibold text-zinc-800 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-zinc-500" />
            當前身體組成物理質量比例 (總重 {totalWeight} kg)
          </span>
        </div>

        {/* Stacked Bar */}
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-zinc-100 border border-zinc-200/60 shadow-2xs">
          {/* Skeletal Muscle */}
          <div
            className="h-full bg-emerald-500 relative group transition-all duration-300"
            style={{ width: `${musclePct}%` }}
            title={`骨骼肌重: ${muscleKg} kg (${musclePct}%)`}
          />
          {/* Body Fat */}
          <div
            className="h-full bg-amber-500 relative group transition-all duration-300"
            style={{ width: `${fatPct}%` }}
            title={`體脂肪重: ${fatKg} kg (${fatPct}%)`}
          />
          {/* Other mass */}
          <div
            className="h-full bg-zinc-300 relative group transition-all duration-300"
            style={{ width: `${otherPct}%` }}
            title={`骨骼/水分/內臟等其他: ${otherKg} kg (${otherPct}%)`}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-600 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>骨骼肌 {muscleKg}kg ({musclePct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>體脂肪 {fatKg}kg ({fatPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            <span>其他骨骼水分 {otherKg}kg ({otherPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
