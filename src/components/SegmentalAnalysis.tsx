import React from 'react';
import { BodyRecord } from '../types';
import { Dumbbell, Shield, User, Info } from 'lucide-react';

interface SegmentalAnalysisProps {
  record: BodyRecord;
}

export const SegmentalAnalysis: React.FC<SegmentalAnalysisProps> = ({ record }) => {
  const segments = [
    {
      id: 'arms',
      label: '雙臂 (上肢)',
      subLabel: 'Upper Extremities',
      muscle: record.skeletalMuscleArmsPct,
      fat: record.subcutaneousFatArmsPct,
      muscleNormal: '34% ~ 38%',
      fatNormal: '18% ~ 24%',
    },
    {
      id: 'trunk',
      label: '身軀 (軀幹核心)',
      subLabel: 'Trunk / Core',
      muscle: record.skeletalMuscleTrunkPct,
      fat: record.subcutaneousFatTrunkPct,
      muscleNormal: '22% ~ 27%',
      fatNormal: '15% ~ 22%',
    },
    {
      id: 'legs',
      label: '雙腳 (下肢)',
      subLabel: 'Lower Extremities',
      muscle: record.skeletalMuscleLegsPct,
      fat: record.subcutaneousFatLegsPct,
      muscleNormal: '45% ~ 51%',
      fatNormal: '20% ~ 26%',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">部位別骨骼肌率與皮下脂肪深度解析</h3>
            <p className="text-xs text-zinc-500">Omron 702T 四肢與軀幹感測分離量測數據</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-zinc-600">骨骼肌率 (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-zinc-600">皮下脂肪率 (%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {segments.map((seg) => {
          return (
            <div
              key={seg.id}
              className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">{seg.label}</h4>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{seg.subLabel}</span>
                </div>
              </div>

              {/* Skeletal Muscle Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                    <Dumbbell className="w-3 h-3" />
                    骨骼肌率
                  </span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">
                    {seg.muscle.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-zinc-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (seg.muscle / 60) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
                  <span>標準參考：{seg.muscleNormal}</span>
                  <span>上限 60%</span>
                </div>
              </div>

              {/* Subcutaneous Fat Bar */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-medium text-amber-700 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    皮下脂肪率
                  </span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">
                    {seg.fat.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-zinc-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (seg.fat / 40) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
                  <span>標準參考：{seg.fatNormal}</span>
                  <span>上限 40%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Segmental Insight Note */}
      <div className="mt-4 p-3 rounded-xl bg-teal-50/60 border border-teal-100/80 flex items-start gap-2.5 text-xs text-teal-900">
        <Info className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <span className="font-semibold">部位肌脂平衡觀察：</span> 下肢雙腳骨骼肌率 ({record.skeletalMuscleLegsPct.toFixed(1)}%) 表現充足，是推動日常代謝的動力來源；雙腳皮下脂肪 ({record.subcutaneousFatLegsPct.toFixed(1)}%) 與雙臂皮下脂肪 ({record.subcutaneousFatArmsPct.toFixed(1)}%) 呈中度蓄積，核心身軀骨骼肌率 ({record.skeletalMuscleTrunkPct.toFixed(1)}%) 若能配合平板支撐或核心深蹲加強，有助於進一步壓縮身軀皮下脂肪 ({record.subcutaneousFatTrunkPct.toFixed(1)}%)。
        </p>
      </div>
    </div>
  );
};
