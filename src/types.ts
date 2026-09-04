export interface BodyRecord {
  id: string;
  date: string; // e.g. "2026/08/31 13:36"
  timestamp: number; // Unix epoch ms
  timezone: string;
  weight: number; // 體重 (kg)
  bodyFatPct: number; // 體脂肪 (%)
  bodyFatKg: number; // 體脂肪量 (kg)
  visceralFat: number; // 內臟脂肪程度
  basalMetabolism: number; // 基礎代謝 (kcal)
  skeletalMusclePct: number; // 骨骼肌 (%)
  skeletalMuscleKg: number; // 骨骼肌重量 (kg)
  skeletalMuscleArmsPct: number; // 骨骼肌率（雙臂）(%)
  skeletalMuscleTrunkPct: number; // 骨骼肌率（身軀）(%)
  skeletalMuscleLegsPct: number; // 骨骼肌率（雙腳）(%)
  subcutaneousFatPct: number; // 皮下脂肪率 (%)
  subcutaneousFatArmsPct: number; // 皮下脂肪率（雙臂）(%)
  subcutaneousFatTrunkPct: number; // 皮下脂肪率（身軀）(%)
  subcutaneousFatLegsPct: number; // 皮下脂肪率（雙腳）(%)
  bmi: number; // BMI
  bodyAge: number; // 身體年齡 (歲)
  modelName: string; // 型號
  note?: string; // 使用者自訂備註
}

export type MetricKey =
  | 'weight'
  | 'bodyFatPct'
  | 'bodyFatKg'
  | 'skeletalMusclePct'
  | 'skeletalMuscleKg'
  | 'visceralFat'
  | 'bmi'
  | 'basalMetabolism'
  | 'bodyAge'
  | 'subcutaneousFatPct'
  | 'skeletalMuscleArmsPct'
  | 'skeletalMuscleTrunkPct'
  | 'skeletalMuscleLegsPct'
  | 'subcutaneousFatArmsPct'
  | 'subcutaneousFatTrunkPct'
  | 'subcutaneousFatLegsPct';

export type MetricCategory = 'main' | 'fat' | 'muscle' | 'segmental' | 'metabolic';

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  shortLabel: string;
  unit: string;
  category: MetricCategory;
  color: string;
  fillColor: string;
  decimals: number;
  description: string;
  normalRange?: {
    min: number;
    max: number;
    label: string;
  };
  goodDirection: 'lower' | 'higher' | 'neutral'; // Whether lower is generally better (e.g. fat, BMI) or higher (muscle, BMR)
}

export type ScaleMode = 'snug' | 'zero' | 'custom';

export interface ScaleSettings {
  mode: ScaleMode;
  customMin: number;
  customMax: number;
  paddingPercent: number; // default e.g. 10%
  tickSteps: number; // number of horizontal tick lines
  showGrid: boolean;
  showPoints: boolean;
  curveType: 'smooth' | 'linear';
}

export interface DualAxisSettings {
  enabled: boolean;
  primaryMetric: MetricKey;
  secondaryMetric: MetricKey;
}

export type ChartDisplayMode = 'single' | 'dual' | 'multi';

export type MultiAxisNormalization = 'independent' | 'relativeChange';

export interface MultiAxisSettings {
  enabled: boolean;
  metrics: MetricKey[];
  normalization: MultiAxisNormalization;
  highlightedMetric?: MetricKey | null;
}

export type TimeRangeFilter = 'all' | '7d' | '30d' | '90d' | 'custom';

export interface AIAnalysisData {
  overallAssessment: string;
  weightLossQuality: {
    level: string;
    summary: string;
  };
  keyObservations: string[];
  segmentalAnalysis: string;
  actionPlan: {
    diet: string[];
    exercise: string[];
    lifestyle: string[];
  };
  encouragement: string;
  modelUsed?: string;
}

export interface UserHealthGoal {
  targetWeight?: number;
  targetBodyFatPct?: number;
  targetMusclePct?: number;
  targetVisceralFat?: number;
}

// ==========================================
// 猛健樂 (Mounjaro / Tirzepatide) Types
// ==========================================

export type InjectionSite =
  | 'abdomen_ur' // 腹部右上
  | 'abdomen_ul' // 腹部左上
  | 'abdomen_lr' // 腹部右下
  | 'abdomen_ll' // 腹部左下
  | 'thigh_left' // 左大腿外側
  | 'thigh_right' // 右大腿外側
  | 'arm_left' // 左手臂外側
  | 'arm_right'; // 右手臂外側

export interface MounjaroPen {
  id: string;
  name: string; // 藥筆名稱或編號，例如「猛健樂 10mg 原廠藥筆 #1」
  purchaseDate: string; // 購買日期 (YYYY-MM-DD)
  priceTwd: number; // 購買金額 (NTD)
  totalDoseMg: number; // 規格總劑量 (如 10mg, 20mg)
  residualBufferMg: number; // 原廠殘劑緩衝量 (預設 0.6mg)
  firstUsedDate?: string; // 首次開瓶日期 (YYYY-MM-DD)，超過 28 天提示
  notes?: string;
  isArchived?: boolean; // 是否已用罄封存
}

export type SymptomType =
  | 'nausea' // 噁心
  | 'constipation' // 便秘
  | 'diarrhea' // 腹瀉
  | 'bloating' // 胃脹/消化不良
  | 'fatigue' // 疲倦
  | 'reflux'; // 胃食道逆流

export interface InjectionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  penId: string; // 關聯藥筆 ID
  doseMg: number; // 施打劑量 (如 2.5, 5.0, 7.5)
  site: InjectionSite; // 注射部位
  weightKg?: number; // 施打時或當日體重
  notes?: string; // 備註
  symptoms?: Partial<Record<SymptomType, number>>; // 1-5 嚴重度
  waterMl?: number; // 當日水分攝取 ml (目標 2000ml)
  proteinG?: number; // 當日蛋白質攝取 g
}

export interface MounjaroSettings {
  includeResidual: boolean; // 是否計入殘劑 (預設 0.6mg)
  doseIntervalDays: number; // 預設施打間隔天數 (7 天)
  targetWaterMl: number; // 目標飲水量 (2000 ml)
  targetProteinG: number; // 目標蛋白質 (80 g)
}

export interface MounjaroRoiMetrics {
  totalSpentTwd: number; // 累計藥品花費總額
  totalInjectedMg: number; // 累計施打總劑量 (mg)
  costPerMgTwd: number; // 每 1mg 藥物花費 (NTD/mg)
  weeklyAvgCostTwd: number; // 每週平均花費 (NTD/週)
  baselineWeightKg: number; // 起始基準體重 (kg)
  currentWeightKg: number; // 當前體重 (kg)
  weightDeltaKg: number; // 體重淨減量 (負值表示變輕)
  costPerKgLostTwd: number | null; // 瘦 1 公斤花費 (NTD/kg)
  daysSinceFirstDose: number; // 首次施打至今經過天數
}

