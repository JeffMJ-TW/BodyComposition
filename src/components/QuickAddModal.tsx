import React, { useState } from 'react';
import { BodyRecord } from '../types';
import { PlusCircle, X, Check } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecord: (record: BodyRecord) => void;
  lastRecord?: BodyRecord;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAddRecord,
  lastRecord,
}) => {
  const now = new Date();
  const defaultDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [date, setDate] = useState(defaultDate);
  const [weight, setWeight] = useState(lastRecord ? lastRecord.weight.toString() : '85.0');
  const [bodyFatPct, setBodyFatPct] = useState(lastRecord ? lastRecord.bodyFatPct.toString() : '28.0');
  const [skeletalMusclePct, setSkeletalMusclePct] = useState(
    lastRecord ? lastRecord.skeletalMusclePct.toString() : '30.0'
  );
  const [visceralFat, setVisceralFat] = useState(lastRecord ? lastRecord.visceralFat.toString() : '13.0');
  const [basalMetabolism, setBasalMetabolism] = useState(
    lastRecord ? lastRecord.basalMetabolism.toString() : '1830'
  );
  const [bmi, setBmi] = useState(lastRecord ? lastRecord.bmi.toString() : '28.0');
  const [bodyAge, setBodyAge] = useState(lastRecord ? lastRecord.bodyAge.toString() : '50');

  // Segmental optional inputs
  const [armsMuscle, setArmsMuscle] = useState(lastRecord ? lastRecord.skeletalMuscleArmsPct.toString() : '35.5');
  const [trunkMuscle, setTrunkMuscle] = useState(lastRecord ? lastRecord.skeletalMuscleTrunkPct.toString() : '22.0');
  const [legsMuscle, setLegsMuscle] = useState(lastRecord ? lastRecord.skeletalMuscleLegsPct.toString() : '47.0');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight) || 0;
    const fatPct = parseFloat(bodyFatPct) || 0;
    const musclePct = parseFloat(skeletalMusclePct) || 0;

    const fatKg = parseFloat(((w * fatPct) / 100).toFixed(1));
    const muscleKg = parseFloat(((w * musclePct) / 100).toFixed(1));

    const newRecord: BodyRecord = {
      id: `manual-${Date.now()}`,
      date: date.trim(),
      timestamp: new Date(date.replace(/\//g, '-')).getTime() || Date.now(),
      timezone: 'Asia/Taipei',
      weight: w,
      bodyFatPct: fatPct,
      bodyFatKg: fatKg,
      visceralFat: parseFloat(visceralFat) || 10,
      basalMetabolism: parseInt(basalMetabolism, 10) || 1800,
      skeletalMusclePct: musclePct,
      skeletalMuscleKg: muscleKg,
      skeletalMuscleArmsPct: parseFloat(armsMuscle) || 35.0,
      skeletalMuscleTrunkPct: parseFloat(trunkMuscle) || 22.0,
      skeletalMuscleLegsPct: parseFloat(legsMuscle) || 47.0,
      subcutaneousFatPct: parseFloat(((fatPct * 0.7).toFixed(1))),
      subcutaneousFatArmsPct: parseFloat(((fatPct * 0.95).toFixed(1))),
      subcutaneousFatTrunkPct: parseFloat(((fatPct * 0.65).toFixed(1))),
      subcutaneousFatLegsPct: parseFloat(((fatPct * 0.95).toFixed(1))),
      bmi: parseFloat(bmi) || 28.0,
      bodyAge: parseInt(bodyAge, 10) || 50,
      modelName: lastRecord?.modelName || 'HBF-702T',
    };

    onAddRecord(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">手動登記身體量測數據</h3>
              <p className="text-xs text-zinc-500">輸入單筆測量結果加入資料庫</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs text-zinc-700">
          <div>
            <label className="block font-medium mb-1">測量日期時間 (YYYY/MM/DD HH:mm)</label>
            <input
              type="text"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">體重 (kg)</label>
              <input
                type="number"
                step="0.05"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">體脂肪率 (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={bodyFatPct}
                onChange={(e) => setBodyFatPct(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">骨骼肌率 (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={skeletalMusclePct}
                onChange={(e) => setSkeletalMusclePct(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">內臟脂肪等級 (1-30)</label>
              <input
                type="number"
                step="0.5"
                required
                value={visceralFat}
                onChange={(e) => setVisceralFat(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-medium mb-1">基礎代謝 (kcal)</label>
              <input
                type="number"
                value={basalMetabolism}
                onChange={(e) => setBasalMetabolism(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-2 text-xs font-mono focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">BMI</label>
              <input
                type="number"
                step="0.1"
                value={bmi}
                onChange={(e) => setBmi(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-2 text-xs font-mono focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">身體年齡 (歲)</label>
              <input
                type="number"
                value={bodyAge}
                onChange={(e) => setBodyAge(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-2 text-xs font-mono focus:bg-white"
              />
            </div>
          </div>

          {/* Segmental Muscle row */}
          <div className="pt-2 border-t border-zinc-100">
            <span className="block font-semibold text-zinc-900 mb-1.5">部位骨骼肌率 (%) (選填)</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-zinc-500 block">雙臂</span>
                <input
                  type="number"
                  step="0.1"
                  value={armsMuscle}
                  onChange={(e) => setArmsMuscle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">身軀</span>
                <input
                  type="number"
                  step="0.1"
                  value={trunkMuscle}
                  onChange={(e) => setTrunkMuscle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">雙腳</span>
                <input
                  type="number"
                  step="0.1"
                  value={legsMuscle}
                  onChange={(e) => setLegsMuscle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>儲存量測紀錄</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
