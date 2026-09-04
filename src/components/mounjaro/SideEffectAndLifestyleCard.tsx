import React, { useState } from 'react';
import {
  Droplets,
  Beef,
  AlertCircle,
  Plus,
  Minus,
  CheckCircle2,
  SmilePlus,
  Info,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import { SymptomType, InjectionRecord, MounjaroSettings } from '../../types';
import { SYMPTOM_DEFINITIONS } from '../../utils/mounjaroConstants';

interface SideEffectAndLifestyleCardProps {
  latestRecord?: InjectionRecord | null;
  settings: MounjaroSettings;
  onUpdateDailyHabits: (waterMl: number, proteinG: number) => void;
  onUpdateSymptoms: (symptoms: Partial<Record<SymptomType, number>>) => void;
}

export const SideEffectAndLifestyleCard: React.FC<SideEffectAndLifestyleCardProps> = ({
  latestRecord,
  settings,
  onUpdateDailyHabits,
  onUpdateSymptoms,
}) => {
  const currentWater = latestRecord?.waterMl ?? 1500;
  const currentProtein = latestRecord?.proteinG ?? 65;
  const currentSymptoms = latestRecord?.symptoms || {};

  const targetWater = settings.targetWaterMl || 2000;
  const targetProtein = settings.targetProteinG || 80;

  const waterPercent = Math.min(100, Math.round((currentWater / targetWater) * 100));
  const proteinPercent = Math.min(100, Math.round((currentProtein / targetProtein) * 100));

  const [activeTab, setActiveTab] = useState<'habits' | 'symptoms'>('habits');

  // Handle water adjust
  const handleAddWater = (delta: number) => {
    const next = Math.max(0, currentWater + delta);
    onUpdateDailyHabits(next, currentProtein);
  };

  // Handle protein adjust
  const handleAddProtein = (delta: number) => {
    const next = Math.max(0, currentProtein + delta);
    onUpdateDailyHabits(currentWater, next);
  };

  // Handle symptom toggle
  const handleToggleSymptom = (key: SymptomType, severity: number) => {
    const next = { ...currentSymptoms };
    if (next[key] === severity) {
      delete next[key];
    } else {
      next[key] = severity;
    }
    onUpdateSymptoms(next);
  };

  // Symptoms count
  const activeSymptomKeys = Object.keys(currentSymptoms) as SymptomType[];

  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 shadow-2xs">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
              <span>生活日誌與副作用對策</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                預防脫水與肌肉流失
              </span>
            </h3>
            <p className="text-xs text-zinc-500">
              猛健樂作用於腸胃排空與下視丘食慾，維持飲水與蛋白質是減脂保肌關鍵
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('habits')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'habits'
                ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            飲水與蛋白質打卡
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('symptoms')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'symptoms'
                ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>副作用追蹤</span>
            {activeSymptomKeys.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                {activeSymptomKeys.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Water & Protein Check-in */}
      {activeTab === 'habits' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Water Tracker */}
          <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">今日飲水量打卡</h4>
                  <span className="text-[10px] text-zinc-500">目標 {targetWater} ml（防止便秘與脫水）</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700">
                {waterPercent}%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-zinc-900 tracking-tight">
                {currentWater} <span className="text-xs font-semibold text-zinc-500">ml</span>
              </span>
              <span className="text-xs text-zinc-400">
                剩餘 {Math.max(0, targetWater - currentWater)} ml
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-blue-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${waterPercent}%` }}
              />
            </div>

            {/* Quick adjust buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleAddWater(-250)}
                className="px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs font-bold text-zinc-600 hover:bg-blue-50 cursor-pointer"
              >
                -250
              </button>
              <button
                type="button"
                onClick={() => handleAddWater(250)}
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+250 ml (一杯水)</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddWater(500)}
                className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold cursor-pointer"
              >
                +500 ml
              </button>
            </div>
          </div>

          {/* Protein Tracker */}
          <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-2xs">
                  <Beef className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">蛋白質攝取打卡</h4>
                  <span className="text-[10px] text-zinc-500">目標 {targetProtein} g（減脂不減肌必備）</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700">
                {proteinPercent}%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-zinc-900 tracking-tight">
                {currentProtein} <span className="text-xs font-semibold text-zinc-500">g</span>
              </span>
              <span className="text-xs text-zinc-400">
                剩餘 {Math.max(0, targetProtein - currentProtein)} g
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-amber-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>

            {/* Quick adjust buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleAddProtein(-10)}
                className="px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold text-zinc-600 hover:bg-amber-50 cursor-pointer"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => handleAddProtein(15)}
                className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+15 g (雞蛋/豆漿)</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddProtein(30)}
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg text-xs font-bold cursor-pointer"
              >
                +30 g (乳清/雞胸)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Symptoms Severity & Clinical Tips */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SYMPTOM_DEFINITIONS.map((sym) => {
              const severity = currentSymptoms[sym.key] || 0;

              return (
                <div
                  key={sym.key}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    severity > 0
                      ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                      : 'bg-zinc-50/50 border-zinc-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                        <span className="text-base">{sym.emoji}</span>
                        <span>{sym.label}</span>
                      </span>
                      {severity > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white font-mono">
                          {severity} 級
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      {sym.description}
                    </p>
                    <div className="p-2 bg-white rounded-xl border border-zinc-200/80 text-[10px] text-zinc-600">
                      <strong className="text-zinc-800 block mb-0.5">緩解技巧：</strong>
                      {sym.mitigationTips}
                    </div>
                  </div>

                  {/* 1-5 severity selector */}
                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-zinc-200/60">
                    <span className="text-[10px] text-zinc-400">嚴重度：</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleToggleSymptom(sym.key, lvl)}
                          className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                            severity === lvl
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
