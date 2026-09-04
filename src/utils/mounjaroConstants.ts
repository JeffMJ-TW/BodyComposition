import {
  InjectionSite,
  MounjaroPen,
  InjectionRecord,
  SymptomType,
  MounjaroSettings,
} from '../types';

// ==========================================
// 猛健樂 (Tirzepatide) 藥物動力學常數
// ==========================================
export const TIRZEPATIDE_PK = {
  HALF_LIFE_DAYS: 5.0, // 半衰期約 5 天 (120 小時)
  ELIMINATION_K: Math.LN2 / 5.0, // 一級消除速率常數 ~ 0.138629 day^-1
  ABSORPTION_KA: 1.5, // 皮下吸收速率常數 ~ 1.5 day^-1 (達峰時間約 24~48 小時)
  BIOAVAILABILITY_F: 0.8, // 皮下注射生物利用度約 80%
  RECOMMENDED_INTERVAL_DAYS: 7, // 每週注射一次
  EXPIRATION_AFTER_OPEN_DAYS: 28, // 開封後室溫/冷藏最長保存 28 天
};

// ==========================================
// 注射部位定義與座標
// ==========================================
export interface InjectionSiteDef {
  key: InjectionSite;
  label: string;
  region: 'abdomen' | 'thigh' | 'arm';
  side: 'left' | 'right' | 'center';
  description: string;
  iconCoord: { x: number; y: number }; // Relative percentage on body schematic
}

export const INJECTION_SITES: InjectionSiteDef[] = [
  {
    key: 'abdomen_ur',
    label: '腹部右上',
    region: 'abdomen',
    side: 'right',
    description: '肚臍右上側約 5 公分處（避開肚臍與肋骨邊緣）',
    iconCoord: { x: 40, y: 38 },
  },
  {
    key: 'abdomen_ul',
    label: '腹部左上',
    region: 'abdomen',
    side: 'left',
    description: '肚臍左上側約 5 公分處',
    iconCoord: { x: 60, y: 38 },
  },
  {
    key: 'abdomen_lr',
    label: '腹部右下',
    region: 'abdomen',
    side: 'right',
    description: '肚臍右下側約 5 公分處',
    iconCoord: { x: 40, y: 46 },
  },
  {
    key: 'abdomen_ll',
    label: '腹部左下',
    region: 'abdomen',
    side: 'left',
    description: '肚臍左下側約 5 公分處',
    iconCoord: { x: 60, y: 46 },
  },
  {
    key: 'thigh_right',
    label: '右大腿外側',
    region: 'thigh',
    side: 'right',
    description: '右側大腿前外側中段（坐下時肌肉放鬆區域）',
    iconCoord: { x: 38, y: 64 },
  },
  {
    key: 'thigh_left',
    label: '左大腿外側',
    region: 'thigh',
    side: 'left',
    description: '左側大腿前外側中段',
    iconCoord: { x: 62, y: 64 },
  },
  {
    key: 'arm_right',
    label: '右上臂外側',
    region: 'arm',
    side: 'right',
    description: '右側上臂後外側三角肌下方脂肪層（需他人協助或鏡前操作）',
    iconCoord: { x: 24, y: 34 },
  },
  {
    key: 'arm_left',
    label: '左上臂外側',
    region: 'arm',
    side: 'left',
    description: '左側上臂後外側三角肌下方脂肪層',
    iconCoord: { x: 76, y: 34 },
  },
];

// 部位智慧輪替建議順序 (避開同部位連續注射，避免皮下硬結或脂肪增生)
export const SITE_ROTATION_ORDER: InjectionSite[] = [
  'abdomen_lr',
  'abdomen_ul',
  'abdomen_ll',
  'abdomen_ur',
  'thigh_right',
  'thigh_left',
  'arm_right',
  'arm_left',
];

export function getNextRecommendedSite(lastSite?: InjectionSite): InjectionSite {
  if (!lastSite) return 'abdomen_lr';
  const idx = SITE_ROTATION_ORDER.indexOf(lastSite);
  if (idx === -1 || idx === SITE_ROTATION_ORDER.length - 1) {
    return SITE_ROTATION_ORDER[0];
  }
  return SITE_ROTATION_ORDER[idx + 1];
}

// ==========================================
// 副作用症狀定義
// ==========================================
export interface SymptomDef {
  key: SymptomType;
  label: string;
  emoji: string;
  description: string;
  mitigationTips: string;
}

export const SYMPTOM_DEFINITIONS: SymptomDef[] = [
  {
    key: 'nausea',
    label: '噁心反胃',
    emoji: '🤢',
    description: '胃部悶滯、食慾低落或輕微反胃感',
    mitigationTips: '少量多餐、細嚼慢嚥，避免油炸重口味，可飲用常溫薄荷茶或檸檬水。',
  },
  {
    key: 'constipation',
    label: '排便不順 / 便秘',
    emoji: '🧱',
    description: '排便次數減少或糞便乾硬',
    mitigationTips: '每日飲水至少達 2000~2500ml，增加水溶性膳食纖維與適度步行運動。',
  },
  {
    key: 'diarrhea',
    label: '腹瀉 / 軟便',
    emoji: '💧',
    description: '排便次數增加或水狀便',
    mitigationTips: '補充電解質與充足水分，避免乳製品、生冷食物與高油脂料理。',
  },
  {
    key: 'bloating',
    label: '胃脹 / 消化緩慢',
    emoji: '🎈',
    description: '胃排空減緩造成進食後容易持續飽脹感',
    mitigationTips: '進食量減半、七分飽即停箸，餐後維持直立散步 15 分鐘，切勿躺臥。',
  },
  {
    key: 'fatigue',
    label: '疲倦 / 活力較低',
    emoji: '🥱',
    description: '熱量攝取減少或代謝適應期的暫時性嗜睡疲乏',
    mitigationTips: '確保每日足量蛋白質（60~80g）避免肌肉分解，規律作息與補充電解質。',
  },
  {
    key: 'reflux',
    label: '胃食道逆流 / 火燒心',
    emoji: '🔥',
    description: '胸口灼熱感、胃酸倒流或打嗝有異味',
    mitigationTips: '睡前 3 小時禁食，避免甜食、咖啡因、巧克力與辛辣刺激物。',
  },
];

// ==========================================
// 猛健樂規格與藥筆劑型庫
// ==========================================
export interface StandardPenPreset {
  label: string;
  badge: string;
  totalDoseMg: number;
  residualBufferMg: number;
  type: 'multi' | 'single';
  defaultPrice: number;
  description: string;
}

export const STANDARD_PEN_PRESETS: StandardPenPreset[] = [
  // 多劑型 KwikPen (原廠 4 劑型)
  {
    label: '5 mg (多劑型 4×1.25mg 或雙週)',
    badge: '5mg 筆',
    totalDoseMg: 5.0,
    residualBufferMg: 0.6,
    type: 'multi',
    defaultPrice: 5500,
    description: '適用於初期 1.25mg 微量調適、雙週 2.5mg 或敏感體質減量',
  },
  {
    label: '10 mg (標準 4×2.5mg 啟動筆)',
    badge: '10mg 筆',
    totalDoseMg: 10.0,
    residualBufferMg: 0.6,
    type: 'multi',
    defaultPrice: 8500,
    description: '標準首月第 1~4 週 2.5mg 啟始劑量原廠多劑型藥筆',
  },
  {
    label: '15 mg (多劑型 4×3.75mg 過渡筆)',
    badge: '15mg 筆',
    totalDoseMg: 15.0,
    residualBufferMg: 0.6,
    type: 'multi',
    defaultPrice: 11500,
    description: '介於 2.5mg 與 5.0mg 間平緩過渡，或客製調階施打',
  },
  {
    label: '20 mg (標準 4×5.0mg 維持進階筆)',
    badge: '20mg 筆',
    totalDoseMg: 20.0,
    residualBufferMg: 0.6,
    type: 'multi',
    defaultPrice: 15000,
    description: '第 5 週起 5.0mg 標準維持劑量多劑型藥筆',
  },
  {
    label: '30 mg (標準 4×7.5mg 高階筆)',
    badge: '30mg 筆',
    totalDoseMg: 30.0,
    residualBufferMg: 0.6,
    type: 'multi',
    defaultPrice: 19000,
    description: '臨床 7.5mg 調升階次原廠多劑型藥筆',
  },
  {
    label: '40 mg (標準 4×10.0mg 筆)',
    badge: '40mg 筆',
    totalDoseMg: 40.0,
    residualBufferMg: 0.6,
    type: 'multi',
    defaultPrice: 22000,
    description: '10mg 目標劑量 4 劑型藥筆',
  },
  {
    label: '50 mg (標準 4×12.5mg 筆)',
    badge: '50mg 筆',
    totalDoseMg: 50.0,
    residualBufferMg: 0.6,
    type: 'multi',
    defaultPrice: 25000,
    description: '12.5mg 深度減重進階劑量藥筆',
  },
  {
    label: '60 mg (標準 4×15.0mg 頂規筆)',
    badge: '60mg 筆',
    totalDoseMg: 60.0,
    residualBufferMg: 0.6,
    type: 'multi',
    defaultPrice: 28000,
    description: '最高階 15.0mg 4 劑型藥筆',
  },
  // 單劑型 Auto-Injector (單次注射筆)
  {
    label: '2.5 mg (單劑型 Auto-injector)',
    badge: '2.5mg 單劑',
    totalDoseMg: 2.5,
    residualBufferMg: 0.1,
    type: 'single',
    defaultPrice: 2400,
    description: '單次拋棄式自動注射筆，每支一劑 2.5mg',
  },
  {
    label: '5.0 mg (單劑型 Auto-injector)',
    badge: '5.0mg 單劑',
    totalDoseMg: 5.0,
    residualBufferMg: 0.1,
    type: 'single',
    defaultPrice: 3800,
    description: '單次拋棄式自動注射筆，每支一劑 5.0mg',
  },
  {
    label: '7.5 mg (單劑型 Auto-injector)',
    badge: '7.5mg 單劑',
    totalDoseMg: 7.5,
    residualBufferMg: 0.1,
    type: 'single',
    defaultPrice: 4800,
    description: '單次拋棄式自動注射筆，每支一劑 7.5mg',
  },
  {
    label: '10.0 mg (單劑型 Auto-injector)',
    badge: '10.0mg 單劑',
    totalDoseMg: 10.0,
    residualBufferMg: 0.1,
    type: 'single',
    defaultPrice: 5800,
    description: '單次拋棄式自動注射筆，每支一劑 10.0mg',
  },
  {
    label: '12.5 mg (單劑型 Auto-injector)',
    badge: '12.5mg 單劑',
    totalDoseMg: 12.5,
    residualBufferMg: 0.1,
    type: 'single',
    defaultPrice: 6500,
    description: '單次拋棄式自動注射筆，每支一劑 12.5mg',
  },
  {
    label: '15.0 mg (單劑型 Auto-injector)',
    badge: '15.0mg 單劑',
    totalDoseMg: 15.0,
    residualBufferMg: 0.1,
    type: 'single',
    defaultPrice: 7200,
    description: '單次拋棄式自動注射筆，每支一劑 15.0mg',
  },
];

// ==========================================
// 預設初始資料 (若使用者尚未建立)
// ==========================================
export const DEFAULT_MOUNJARO_SETTINGS: MounjaroSettings = {
  includeResidual: true,
  doseIntervalDays: 7,
  targetWaterMl: 2000,
  targetProteinG: 80,
};

export const INITIAL_MOUNJARO_PENS: MounjaroPen[] = [
  {
    id: 'pen-mj-2.5mg-start',
    name: '猛健樂 2.5mg/支 (單劑/起始)',
    purchaseDate: '2026-08-01',
    priceTwd: 2500,
    totalDoseMg: 2.5,
    residualBufferMg: 0.1,
    notes: '2.5mg/支 原廠單劑起始筆',
  },
  {
    id: 'pen-mj-5mg-00',
    name: '猛健樂 5mg/支 (微調/雙週)',
    purchaseDate: '2026-08-05',
    priceTwd: 5500,
    totalDoseMg: 5.0,
    residualBufferMg: 0.6,
    notes: '5mg/支 標準維持與微調劑量',
  },
  {
    id: 'pen-mj-10mg-01',
    name: '猛健樂 10mg/支 (#1 已啟用)',
    purchaseDate: '2026-08-08',
    priceTwd: 8500,
    totalDoseMg: 10.0,
    residualBufferMg: 0.6,
    firstUsedDate: '2026-08-11',
    notes: '門診自費開立，含原廠安全緩衝殘劑 0.6mg',
  },
  {
    id: 'pen-mj-15mg-top',
    name: '猛健樂 15mg/支 (進階/頂規)',
    purchaseDate: '2026-08-20',
    priceTwd: 11500,
    totalDoseMg: 15.0,
    residualBufferMg: 0.6,
    notes: '15mg/支 頂規高劑量藥筆',
  },
  {
    id: 'pen-mj-20mg-02',
    name: '猛健樂 20mg/支 (#2 備用)',
    purchaseDate: '2026-08-28',
    priceTwd: 15000,
    totalDoseMg: 20.0,
    residualBufferMg: 0.6,
    notes: '全新未開瓶，預計第 5 劑起調升至 5mg 銜接使用',
  },
];

export const INITIAL_INJECTIONS: InjectionRecord[] = [
  {
    id: 'inj-01',
    date: '2026-08-11',
    time: '08:30',
    penId: 'pen-mj-10mg-01',
    doseMg: 2.5,
    site: 'abdomen_lr',
    weightKg: 87.5,
    notes: '初次起始劑量 2.5mg，無明顯不適，注射疼痛感極輕',
    symptoms: { nausea: 1, bloating: 2 },
    waterMl: 2100,
    proteinG: 75,
  },
  {
    id: 'inj-02',
    date: '2026-08-18',
    time: '08:45',
    penId: 'pen-mj-10mg-01',
    doseMg: 2.5,
    site: 'abdomen_ll',
    weightKg: 86.8,
    notes: '第 2 次施打，食慾明顯降低，飽足感持續時間長',
    symptoms: { nausea: 2, constipation: 2, fatigue: 1 },
    waterMl: 2300,
    proteinG: 82,
  },
  {
    id: 'inj-03',
    date: '2026-08-25',
    time: '09:00',
    penId: 'pen-mj-10mg-01',
    doseMg: 2.5,
    site: 'thigh_right',
    weightKg: 86.4,
    notes: '改打大腿外側，噁心感較腹部更輕微，維持良好蛋白質攝取',
    symptoms: { bloating: 1, reflux: 1 },
    waterMl: 2000,
    proteinG: 80,
  },
  {
    id: 'inj-04',
    date: '2026-09-01',
    time: '08:30',
    penId: 'pen-mj-10mg-01',
    doseMg: 2.5,
    site: 'thigh_left',
    weightKg: 86.0,
    notes: '第 4 劑完成，累計施打 10mg，藥筆標示量已用罄，尚存 0.6mg 原廠緩衝殘劑',
    symptoms: { nausea: 1 },
    waterMl: 2200,
    proteinG: 85,
  },
];

// ==========================================
// 藥動學 (PK) 濃度模擬計算
// ==========================================
export interface PkDataPoint {
  timeMs: number;
  dateStr: string; // MM/DD
  hoursFromStart: number;
  concentrationMg: number; // 體內有效藥物濃度 (mg 等效累積量)
  isInjectionPoint?: boolean;
  injectionDose?: number;
  isToday?: boolean;
}

/**
 * 依據一級消除動力學 C(t) = C0 * e^(-k*t) 疊加模擬各時間點的體內藥物有效濃度
 */
export function calculatePharmacokineticsCurve(
  injections: InjectionRecord[],
  futureDays: number = 10
): {
  points: PkDataPoint[];
  currentConcentration: number;
  peakConcentration: number;
  troughConcentration: number;
  steadyStateRange: { min: number; max: number };
} {
  if (!injections || injections.length === 0) {
    return {
      points: [],
      currentConcentration: 0,
      peakConcentration: 0,
      troughConcentration: 0,
      steadyStateRange: { min: 0, max: 0 },
    };
  }

  // 按時間遞增排序
  const sorted = [...injections].sort((a, b) => {
    return new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime();
  });

  const firstDoseTime = new Date(`${sorted[0].date}T${sorted[0].time || '00:00'}`).getTime();
  const nowTime = Date.now();
  const endTime = Math.max(nowTime + futureDays * 86400000, new Date(`${sorted[sorted.length - 1].date}T${sorted[sorted.length - 1].time || '00:00'}`).getTime() + futureDays * 86400000);

  // 以 6 小時為取樣步長，確保平滑繪製
  const stepMs = 6 * 3600 * 1000;
  const totalSteps = Math.ceil((endTime - firstDoseTime) / stepMs);
  const points: PkDataPoint[] = [];

  const k = TIRZEPATIDE_PK.ELIMINATION_K; // day^-1
  const ka = TIRZEPATIDE_PK.ABSORPTION_KA; // day^-1
  const F = TIRZEPATIDE_PK.BIOAVAILABILITY_F; // 0.8

  let maxConc = 0;
  let currentConc = 0;

  for (let i = 0; i <= totalSteps; i++) {
    const tMs = firstDoseTime + i * stepMs;
    const tDate = new Date(tMs);
    const dateStr = `${tDate.getMonth() + 1}/${tDate.getDate()}`;

    let totalC = 0;
    // 遍歷所有在當前時間點之前發生的注射
    for (const inj of sorted) {
      const injMs = new Date(`${inj.date}T${inj.time || '00:00'}`).getTime();
      if (tMs >= injMs) {
        const deltaDays = (tMs - injMs) / 86400000;
        // 經典 Bateman 吸收與一級消除 PK 方程式:
        // C(t) = (Dose * F * ka / (ka - k)) * (e^(-k*t) - e^(-ka*t))
        // 當 ka > k 時，先吸收達峰後按 k 速率消除
        const factor = (inj.doseMg * F * ka) / (ka - k);
        const conc = factor * (Math.exp(-k * deltaDays) - Math.exp(-ka * deltaDays));
        if (conc > 0) {
          totalC += conc;
        }
      }
    }

    if (totalC > maxConc) maxConc = totalC;

    // Check if close to now
    const isToday = Math.abs(tMs - nowTime) < stepMs / 2;
    if (isToday) {
      currentConc = totalC;
    }

    points.push({
      timeMs: tMs,
      dateStr,
      hoursFromStart: Math.round((tMs - firstDoseTime) / 3600000),
      concentrationMg: Number(totalC.toFixed(3)),
      isToday,
    });
  }

  // 標記注射事件點
  for (const inj of sorted) {
    const injMs = new Date(`${inj.date}T${inj.time || '00:00'}`).getTime();
    // 找到最接近的點
    const closest = points.reduce((prev, curr) =>
      Math.abs(curr.timeMs - injMs) < Math.abs(prev.timeMs - injMs) ? curr : prev
    );
    if (closest) {
      closest.isInjectionPoint = true;
      closest.injectionDose = inj.doseMg;
    }
  }

  // 穩態谷值與峰值估計 (取近兩週已施打期間)
  const recentPoints = points.filter((p) => p.timeMs <= nowTime && p.timeMs >= nowTime - 14 * 86400000);
  const minRecent = recentPoints.length > 0 ? Math.min(...recentPoints.map((p) => p.concentrationMg)) : 0;
  const maxRecent = recentPoints.length > 0 ? Math.max(...recentPoints.map((p) => p.concentrationMg)) : maxConc;

  return {
    points,
    currentConcentration: currentConc || (points.find((p) => p.isToday)?.concentrationMg ?? 0),
    peakConcentration: maxConc,
    troughConcentration: minRecent,
    steadyStateRange: { min: minRecent, max: maxRecent },
  };
}

// ==========================================
// KwikPen 轉動格數與殘劑計算輔助函式 (GLP-1 Taiwan 標準規範)
// ==========================================

export const STANDARD_PEN_NOMINAL_DOSES = [2.5, 5.0, 7.5, 10.0, 12.5, 15.0];

/**
 * 取得藥筆標稱單次劑量 (mg)
 * 例如 5mg 筆標準包含 4 次 5mg (20mg)，每轉 60 格為 5mg
 */
export function getPenNominalDose(pen?: MounjaroPen | null): number {
  if (!pen) return 5.0;
  const match = pen.name.match(/(\d+(?:\.\d+)?)\s*mg/i);
  if (match) {
    const val = parseFloat(match[1]);
    if (STANDARD_PEN_NOMINAL_DOSES.includes(val)) {
      return val;
    }
  }
  if (pen.totalDoseMg === 10) return 2.5;
  if (pen.totalDoseMg === 20) return 5.0;
  if (pen.totalDoseMg === 30) return 7.5;
  if (pen.totalDoseMg === 40) return 10.0;
  if (pen.totalDoseMg === 50) return 12.5;
  if (pen.totalDoseMg === 60) return 15.0;
  if (STANDARD_PEN_NOMINAL_DOSES.includes(pen.totalDoseMg)) {
    return pen.totalDoseMg;
  }
  return 5.0;
}

/**
 * 計算轉動筆身格數 (Clicks)
 * 仿單規範：1 個標稱劑量 (0.6ml) = 60 格
 * 格數 = (想施打劑量 / 筆身標稱劑量) * 60
 */
export function calculateKwikPenClicks(nominalDoseMg: number, desiredDoseMg: number): number {
  if (nominalDoseMg <= 0 || desiredDoseMg <= 0) return 0;
  return Math.round((desiredDoseMg / nominalDoseMg) * 60);
}

/**
 * 試算全新藥筆之標準與含殘劑可用次數
 */
export function calculatePenDoseEstimates(nominalDoseMg: number, desiredDoseMg: number) {
  if (nominalDoseMg <= 0 || desiredDoseMg <= 0) {
    return {
      clicks: 0,
      standardMg: 0,
      residualMg: 0,
      totalMgWithResidual: 0,
      standardDoses: 0,
      withResidualDoses: 0,
    };
  }
  const clicks = Math.round((desiredDoseMg / nominalDoseMg) * 60);
  const standardMg = 4 * nominalDoseMg;
  const residualMg = nominalDoseMg; // 原廠安全殘劑緩衝量約為 1 次標稱劑量 (~0.6ml)
  const totalMgWithResidual = 5 * nominalDoseMg; // 總量含殘劑約 3.0ml

  const standardDoses = Math.floor(standardMg / desiredDoseMg);
  const withResidualDoses = Math.floor(totalMgWithResidual / desiredDoseMg);

  return {
    clicks,
    standardMg,
    residualMg,
    totalMgWithResidual,
    standardDoses,
    withResidualDoses,
  };
}

/**
 * 匯出猛健樂注射歷程記錄為 CSV 檔案 (支援 UTF-8 BOM，相容 Excel)
 */
export function exportMounjaroInjectionsToCsv(injections: InjectionRecord[], pens: MounjaroPen[]) {
  if (injections.length === 0) {
    return false;
  }

  const sorted = [...injections].sort(
    (a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime()
  );

  const headers = [
    '紀錄編號',
    '注射日期',
    '注射時間',
    '使用藥筆名稱',
    '藥筆規格劑型(mg)',
    '施打劑量(mg)',
    '轉動筆身格數(格)',
    '注射部位',
    '當日體重(kg)',
    '當日水分(ml)',
    '當日蛋白質(g)',
    '副作用症狀反應',
    '備註說明',
  ];

  const rows = sorted.map((inj) => {
    const pen = pens.find((p) => p.id === inj.penId);
    const nominal = getPenNominalDose(pen);
    const clicks = calculateKwikPenClicks(nominal, inj.doseMg);
    const siteLabel = INJECTION_SITES[inj.site]?.label || inj.site;

    const symptomsList: string[] = [];
    if (inj.symptoms) {
      Object.entries(inj.symptoms).forEach(([k, severity]) => {
        if (typeof severity === 'number' && severity > 0) {
          const symDef = SYMPTOM_DEFINITIONS.find((s) => s.key === k);
          symptomsList.push(`${symDef?.label || k}(${severity}級)`);
        }
      });
    }

    const escapeCsv = (str: any) => {
      if (str === undefined || str === null) return '';
      const text = String(str).replace(/"/g, '""');
      return `"${text}"`;
    };

    return [
      escapeCsv(inj.id),
      escapeCsv(inj.date),
      escapeCsv(inj.time || ''),
      escapeCsv(pen?.name || '未指定藥筆'),
      escapeCsv(nominal ? `${nominal}mg/支` : ''),
      escapeCsv(inj.doseMg),
      escapeCsv(clicks),
      escapeCsv(siteLabel),
      escapeCsv(inj.weightKg !== undefined ? inj.weightKg : ''),
      escapeCsv(inj.waterMl !== undefined ? inj.waterMl : ''),
      escapeCsv(inj.proteinG !== undefined ? inj.proteinG : ''),
      escapeCsv(symptomsList.join('; ') || '無副作用'),
      escapeCsv(inj.notes || ''),
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF)
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  link.setAttribute('href', url);
  link.setAttribute('download', `猛健樂注射紀錄_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

