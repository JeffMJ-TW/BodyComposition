import { BodyRecord } from '../types';

export interface HealthStatusRating {
  level: 'excellent' | 'normal' | 'warning' | 'danger';
  label: string;
  badgeClass: string;
  advice: string;
}

export interface WeightLossQualityResult {
  status: 'healthy_loss' | 'muscle_loss_warning' | 'bulking_clean' | 'fat_gain' | 'stable';
  title: string;
  description: string;
  badgeClass: string;
  deltaWeight: number;
  deltaFatKg: number;
  deltaMuscleKg: number;
  qualityScore: number; // 0 - 100
}

export function evaluateBMI(bmi: number): HealthStatusRating {
  if (bmi <= 0) {
    return { level: 'normal', label: '未知', badgeClass: 'bg-zinc-100 text-zinc-700', advice: '尚無資料' };
  }
  if (bmi < 18.5) {
    return {
      level: 'warning',
      label: '過輕',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      advice: '低於標準範圍（18.5-24.0），建議適度增加健康蛋白質與肌力訓練，補充熱量。',
    };
  }
  if (bmi < 24.0) {
    return {
      level: 'excellent',
      label: '理想正常',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      advice: '落在台灣衛福部建議的健康理想範圍，請持續維持規律運動與均衡飲食。',
    };
  }
  if (bmi < 27.0) {
    return {
      level: 'warning',
      label: '過重',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      advice: '略高於標準範圍，建議控制每日精緻糖份與油炸攝取，每週進行至少 150 分鐘中強度運動。',
    };
  }
  return {
    level: 'danger',
    label: '肥胖警示',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    advice: '屬於中重度肥胖範圍，心血管與代謝症候群風險較高，建議諮詢醫師或營養師規律減重。',
  };
}

export function evaluateBodyFat(pct: number, gender: 'male' | 'female' = 'male'): HealthStatusRating {
  if (pct <= 0) {
    return { level: 'normal', label: '未知', badgeClass: 'bg-zinc-100 text-zinc-700', advice: '' };
  }

  const normalMin = gender === 'male' ? 10 : 20;
  const normalMax = gender === 'male' ? 20 : 28;
  const warningMax = gender === 'male' ? 25 : 33;

  if (pct < normalMin) {
    return {
      level: 'warning',
      label: '偏低 (精實)',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      advice: '體脂偏低，需注意內分泌平衡與必要脂肪酸攝取。',
    };
  }
  if (pct <= normalMax) {
    return {
      level: 'excellent',
      label: '標準健康',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      advice: '體脂肪率在良好健康標準區間，心血管負擔適中。',
    };
  }
  if (pct <= warningMax) {
    return {
      level: 'warning',
      label: '輕度偏高',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      advice: '體脂略微偏高，建議著重非精緻碳水化合物、增加全身阻力訓練。',
    };
  }
  return {
    level: 'danger',
    label: '偏高肥胖',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    advice: '體脂率超過健康標準，建議以規律有氧搭配肌力訓練，減少超加工食品。',
  };
}

export function evaluateVisceralFat(level: number): HealthStatusRating {
  if (level <= 0) {
    return { level: 'normal', label: '未知', badgeClass: 'bg-zinc-100 text-zinc-700', advice: '' };
  }
  if (level <= 9.0) {
    return {
      level: 'excellent',
      label: '標準 (0.5-9.0)',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      advice: '內臟脂肪在安全標準等級，器官機能代謝負擔低。',
    };
  }
  if (level <= 14.0) {
    return {
      level: 'warning',
      label: '稍高警戒 (10-14)',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      advice: '內臟周圍脂肪開始累積，為脂肪肝與胰島素阻抗的高風險因子，請嚴格減少含糖手搖飲與精製澱粉。',
    };
  }
  return {
    level: 'danger',
    label: '過高危險 (15+)',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    advice: '內臟脂肪過高，心血管疾病、高血壓與二型糖尿病風險大增，強烈建議飲食生活調整與醫療追蹤。',
  };
}

export function evaluateSkeletalMuscle(pct: number, gender: 'male' | 'female' = 'male'): HealthStatusRating {
  if (pct <= 0) {
    return { level: 'normal', label: '未知', badgeClass: 'bg-zinc-100 text-zinc-700', advice: '' };
  }
  const threshold = gender === 'male' ? 32.0 : 27.0;
  if (pct < threshold - 3) {
    return {
      level: 'warning',
      label: '偏低 (易流失)',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      advice: '骨骼肌比例偏低，基礎代謝率會隨之受限，建議增加蛋白質補給並加入腿部與大肌群重訓。',
    };
  }
  if (pct < threshold) {
    return {
      level: 'normal',
      label: '標準邊緣',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      advice: '骨骼肌率接近標準，若能加強全身性阻力運動，將有助於體態塑形與長期熱量消耗。',
    };
  }
  return {
    level: 'excellent',
    label: '充足發達',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    advice: '骨骼肌率優良！擁有充沛的代謝引擎與身體支撐力，繼續保持！',
  };
}

/**
 * Evaluates the quality of weight change between two records
 */
export function evaluateWeightLossQuality(
  current: BodyRecord,
  baseline: BodyRecord
): WeightLossQualityResult {
  const deltaW = +(current.weight - baseline.weight).toFixed(2);
  const deltaF = +(current.bodyFatKg - baseline.bodyFatKg).toFixed(2);
  const deltaM = +(current.skeletalMuscleKg - baseline.skeletalMuscleKg).toFixed(2);

  // If weight decreased
  if (deltaW < -0.3) {
    // Check muscle vs fat
    if (deltaM < -0.3 && deltaF >= -0.1) {
      return {
        status: 'muscle_loss_warning',
        title: '⚠️ 肌肉流失警訊（虛假減重）',
        description: `體重雖然減輕了 ${Math.abs(deltaW)} kg，但肌肉量同步下降了 ${Math.abs(deltaM)} kg，而脂肪量變化為 ${deltaF >= 0 ? '+' : ''}${deltaF} kg。這代表減輕的大部分是「水分與肌肉組織」，可能會降低基礎代謝率並引發日後快速復胖！強烈建議：提高每日優質蛋白質攝取，並避免極端節食。`,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        deltaWeight: deltaW,
        deltaFatKg: deltaF,
        deltaMuscleKg: deltaM,
        qualityScore: 35,
      };
    }

    if (deltaF < -0.3 && deltaM >= -0.2) {
      return {
        status: 'healthy_loss',
        title: '🌟 高品質減脂成功！',
        description: `恭喜！體重降低 ${Math.abs(deltaW)} kg 的同時，純脂肪量實質減少了 ${Math.abs(deltaF)} kg，且骨骼肌量成功維持（${deltaM >= 0 ? '+' : ''}${deltaM} kg）。這是教科書級別的最佳減脂成果！`,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        deltaWeight: deltaW,
        deltaFatKg: deltaF,
        deltaMuscleKg: deltaM,
        qualityScore: 95,
      };
    }

    return {
      status: 'healthy_loss',
      title: '⚖️ 混合性減重狀態',
      description: `體重下降 ${Math.abs(deltaW)} kg，脂肪與肌肉皆有微幅變動（脂肪 ${deltaF} kg，肌肉 ${deltaM} kg）。建議持續觀察長線趨勢。`,
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      deltaWeight: deltaW,
      deltaFatKg: deltaF,
      deltaMuscleKg: deltaM,
      qualityScore: 65,
    };
  }

  // If weight increased
  if (deltaW > 0.3) {
    if (deltaM > 0.3 && deltaF <= 0.2) {
      return {
        status: 'bulking_clean',
        title: '💪 精實增肌中',
        description: `體重增加 ${deltaW} kg，主要由骨骼肌肉成長（+${deltaM} kg）帶動，脂肪並未顯著增加，訓練與營養補充非常見效！`,
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        deltaWeight: deltaW,
        deltaFatKg: deltaF,
        deltaMuscleKg: deltaM,
        qualityScore: 90,
      };
    }

    return {
      status: 'fat_gain',
      title: '📈 體重與脂肪上升',
      description: `體重增加 ${deltaW} kg，其中脂肪量增加了 ${deltaF} kg。建議審視近期飲食攝取熱量是否超標，或是否攝取過多高升糖食物。`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      deltaWeight: deltaW,
      deltaFatKg: deltaF,
      deltaMuscleKg: deltaM,
      qualityScore: 45,
    };
  }

  return {
    status: 'stable',
    title: '🌿 體態持平維持期',
    description: `整體體重變動在 ±0.3kg 內（體重 ${deltaW >= 0 ? '+' : ''}${deltaW} kg，脂肪 ${deltaF >= 0 ? '+' : ''}${deltaF} kg，肌肉 ${deltaM >= 0 ? '+' : ''}${deltaM} kg），體態處於穩定維持階段。`,
    badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-300',
    deltaWeight: deltaW,
    deltaFatKg: deltaF,
    deltaMuscleKg: deltaM,
    qualityScore: 70,
  };
}
