import React, { useState } from 'react';
import { BodyRecord, UserHealthGoal } from '../types';
import { Target, CheckCircle2, ChevronRight, Edit3, Save } from 'lucide-react';

interface HealthGoalsCardProps {
  currentRecord: BodyRecord;
  goals: UserHealthGoal;
  onUpdateGoals: (goals: UserHealthGoal) => void;
}

export const HealthGoalsCard: React.FC<HealthGoalsCardProps> = ({
  currentRecord,
  goals,
  onUpdateGoals,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [targetWeight, setTargetWeight] = useState(goals.targetWeight?.toString() || '78.0');
  const [targetFat, setTargetFat] = useState(goals.targetBodyFatPct?.toString() || '20.0');
  const [targetVisceral, setTargetVisceral] = useState(goals.targetVisceralFat?.toString() || '8.0');

  const weightGoal = goals.targetWeight || 78.0;
  const fatGoal = goals.targetBodyFatPct || 20.0;
  const viscGoal = goals.targetVisceralFat || 8.0;

  const remainingWeight = +(currentRecord.weight - weightGoal).toFixed(2);
  const remainingFat = +(currentRecord.bodyFatPct - fatGoal).toFixed(1);
  const remainingVisc = +(currentRecord.visceralFat - viscGoal).toFixed(1);

  const handleSave = () => {
    onUpdateGoals({
      targetWeight: parseFloat(targetWeight) || undefined,
      targetBodyFatPct: parseFloat(targetFat) || undefined,
      targetVisceralFat: parseFloat(targetVisceral) || undefined,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">健康減脂與體態目標追蹤</h3>
            <p className="text-xs text-zinc-500">設定理想目標，即時掌握差額進度</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isEditing) handleSave();
            else setIsEditing(true);
          }}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 flex items-center gap-1 transition-colors"
        >
          {isEditing ? (
            <>
              <Save className="w-3.5 h-3.5 text-blue-600" />
              <span>儲存目標</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
              <span>修改目標</span>
            </>
          )}
        </button>
      </div>

      {isEditing ? (
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs">
          <div>
            <label className="block text-zinc-600 font-medium mb-1">目標體重 (kg)</label>
            <input
              type="number"
              step="0.5"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-zinc-600 font-medium mb-1">目標體脂肪率 (%)</label>
            <input
              type="number"
              step="0.5"
              value={targetFat}
              onChange={(e) => setTargetFat(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-zinc-600 font-medium mb-1">目標內臟脂肪 (等級)</label>
            <input
              type="number"
              step="0.5"
              value={targetVisceral}
              onChange={(e) => setTargetVisceral(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs font-mono"
            />
          </div>
        </div>
      ) : (
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Weight goal card */}
          <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-zinc-500">目標體重</span>
              <span className="text-xs font-bold text-zinc-800 font-mono">{weightGoal} kg</span>
            </div>
            <div className="text-base font-bold text-zinc-900 font-mono">
              目前 {currentRecord.weight.toFixed(1)} kg
            </div>
            <div className="mt-1 text-[11px] font-medium">
              {remainingWeight <= 0 ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 已達標！
                </span>
              ) : (
                <span className="text-blue-600">還需 -{remainingWeight} kg 達標</span>
              )}
            </div>
          </div>

          {/* Body Fat goal card */}
          <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-zinc-500">目標體脂率</span>
              <span className="text-xs font-bold text-zinc-800 font-mono">{fatGoal}%</span>
            </div>
            <div className="text-base font-bold text-zinc-900 font-mono">
              目前 {currentRecord.bodyFatPct.toFixed(1)}%
            </div>
            <div className="mt-1 text-[11px] font-medium">
              {remainingFat <= 0 ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 已達標！
                </span>
              ) : (
                <span className="text-amber-600">還需 -{remainingFat}% 達標</span>
              )}
            </div>
          </div>

          {/* Visceral Fat goal card */}
          <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-zinc-500">目標內臟脂肪</span>
              <span className="text-xs font-bold text-zinc-800 font-mono">{viscGoal} 級</span>
            </div>
            <div className="text-base font-bold text-zinc-900 font-mono">
              目前 {currentRecord.visceralFat.toFixed(1)} 級
            </div>
            <div className="mt-1 text-[11px] font-medium">
              {remainingVisc <= 0 ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 已達安全標準！
                </span>
              ) : (
                <span className="text-rose-600">還需降 {remainingVisc} 級進入安全區間</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
