import { BodyRecord } from '../types';

/**
 * Splits a CSV line handling quoted strings with commas inside them
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Normalizes headers and maps column index to key
 */
interface ColumnMapping {
  date?: number;
  timezone?: number;
  weight?: number;
  bodyFatPct?: number;
  bodyFatKg?: number;
  visceralFat?: number;
  basalMetabolism?: number;
  skeletalMusclePct?: number;
  skeletalMuscleKg?: number;
  skeletalMuscleArmsPct?: number;
  skeletalMuscleTrunkPct?: number;
  skeletalMuscleLegsPct?: number;
  subcutaneousFatPct?: number;
  subcutaneousFatArmsPct?: number;
  subcutaneousFatTrunkPct?: number;
  subcutaneousFatLegsPct?: number;
  bmi?: number;
  bodyAge?: number;
  modelName?: number;
}

function buildHeaderMapping(headerRow: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  headerRow.forEach((rawHeader, idx) => {
    const h = rawHeader.toLowerCase().replace(/[\s"'\(\)（）%]/g, '');

    if (h.includes('日期') || h.includes('date') || h.includes('時間') || h.includes('time')) {
      if (!h.includes('時區') && !h.includes('timezone')) {
        mapping.date = idx;
      }
    }
    if (h.includes('時區') || h.includes('timezone')) {
      mapping.timezone = idx;
    }
    if (h.includes('體重') || h.includes('weight')) {
      mapping.weight = idx;
    }
    if ((h.includes('體脂肪') || h.includes('體脂率') || h.includes('fat')) && !h.includes('量') && !h.includes('kg') && !h.includes('內臟') && !h.includes('皮下')) {
      mapping.bodyFatPct = idx;
    }
    if (h.includes('體脂肪量') || (h.includes('體脂') && h.includes('kg'))) {
      mapping.bodyFatKg = idx;
    }
    if (h.includes('內臟脂肪') || h.includes('visceral')) {
      mapping.visceralFat = idx;
    }
    if (h.includes('基礎代謝') || h.includes('bmr') || h.includes('metabolism') || h.includes('kcal')) {
      mapping.basalMetabolism = idx;
    }
    if ((h.includes('骨骼肌') || h.includes('muscle')) && !h.includes('量') && !h.includes('kg') && !h.includes('臂') && !h.includes('軀') && !h.includes('腳')) {
      mapping.skeletalMusclePct = idx;
    }
    if (h.includes('骨骼肌重量') || (h.includes('骨骼肌') && h.includes('kg'))) {
      mapping.skeletalMuscleKg = idx;
    }
    if ((h.includes('骨骼肌') || h.includes('muscle')) && (h.includes('雙臂') || h.includes('手臂') || h.includes('arm'))) {
      mapping.skeletalMuscleArmsPct = idx;
    }
    if ((h.includes('骨骼肌') || h.includes('muscle')) && (h.includes('身軀') || h.includes('軀幹') || h.includes('trunk'))) {
      mapping.skeletalMuscleTrunkPct = idx;
    }
    if ((h.includes('骨骼肌') || h.includes('muscle')) && (h.includes('雙腳') || h.includes('腿') || h.includes('leg'))) {
      mapping.skeletalMuscleLegsPct = idx;
    }
    if (h.includes('皮下脂肪') && !h.includes('臂') && !h.includes('軀') && !h.includes('腳')) {
      mapping.subcutaneousFatPct = idx;
    }
    if (h.includes('皮下脂肪') && (h.includes('雙臂') || h.includes('手臂') || h.includes('arm'))) {
      mapping.subcutaneousFatArmsPct = idx;
    }
    if (h.includes('皮下脂肪') && (h.includes('身軀') || h.includes('軀幹') || h.includes('trunk'))) {
      mapping.subcutaneousFatTrunkPct = idx;
    }
    if (h.includes('皮下脂肪') && (h.includes('雙腳') || h.includes('腿') || h.includes('leg'))) {
      mapping.subcutaneousFatLegsPct = idx;
    }
    if (h.includes('bmi')) {
      mapping.bmi = idx;
    }
    if (h.includes('年齡') || h.includes('bodyage') || h.includes('age')) {
      mapping.bodyAge = idx;
    }
    if (h.includes('型號') || h.includes('model')) {
      mapping.modelName = idx;
    }
  });

  return mapping;
}

function parseNumber(val: string | undefined, defaultValue: number = 0): number {
  if (!val) return defaultValue;
  const clean = val.replace(/[^0-9.-]/g, '');
  const n = parseFloat(clean);
  return isNaN(n) ? defaultValue : n;
}

function parseDateToTimestamp(dateStr: string): number {
  if (!dateStr) return Date.now();
  // Standardize "2026/08/31 13:36" to ISO compatible "2026-08-31T13:36:00"
  const normalized = dateStr.replace(/\//g, '-');
  const d = new Date(normalized);
  if (!isNaN(d.getTime())) {
    return d.getTime();
  }
  // Try fallback with manual regex: YYYY-MM-DD HH:mm
  const parts = normalized.match(/(\d{4})-(\d{1,2})-(\d{1,2})\s*(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (parts) {
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const day = parseInt(parts[3], 10);
    const hour = parseInt(parts[4], 10);
    const min = parseInt(parts[5], 10);
    const sec = parts[6] ? parseInt(parts[6], 10) : 0;
    return new Date(year, month, day, hour, min, sec).getTime();
  }
  return Date.now();
}

/**
 * Parses raw CSV content into BodyRecord[]
 */
export function parseBodyCsv(csvText: string): { records: BodyRecord[]; errors: string[] } {
  const errors: string[] = [];
  const records: BodyRecord[] = [];

  // Remove Byte Order Mark (BOM) if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.substring(1);
  }

  const lines = cleanText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { records: [], errors: ['CSV 檔案內容過少，至少需包含標題行與一筆數值紀錄。'] };
  }

  const headerTokens = parseCsvLine(lines[0]);
  const mapping = buildHeaderMapping(headerTokens);

  if (mapping.weight === undefined && mapping.bodyFatPct === undefined) {
    return {
      records: [],
      errors: ['無法識別 CSV 欄位標題，請確認包含「體重」或「體脂肪」等指標。'],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const tokens = parseCsvLine(line);
    if (tokens.length < 3) continue;

    const dateStr = mapping.date !== undefined && tokens[mapping.date] ? tokens[mapping.date] : `記錄-${i}`;
    const timestamp = parseDateToTimestamp(dateStr);
    const weight = mapping.weight !== undefined ? parseNumber(tokens[mapping.weight]) : 0;

    if (weight <= 0 && (!tokens[mapping.bodyFatPct ?? -1] || parseNumber(tokens[mapping.bodyFatPct ?? -1]) <= 0)) {
      continue; // Skip invalid empty rows
    }

    const bodyFatPct = mapping.bodyFatPct !== undefined ? parseNumber(tokens[mapping.bodyFatPct]) : 0;
    let bodyFatKg = mapping.bodyFatKg !== undefined ? parseNumber(tokens[mapping.bodyFatKg]) : 0;
    if (bodyFatKg <= 0 && weight > 0 && bodyFatPct > 0) {
      bodyFatKg = parseFloat(((weight * bodyFatPct) / 100).toFixed(1));
    }

    const skeletalMusclePct = mapping.skeletalMusclePct !== undefined ? parseNumber(tokens[mapping.skeletalMusclePct]) : 0;
    let skeletalMuscleKg = mapping.skeletalMuscleKg !== undefined ? parseNumber(tokens[mapping.skeletalMuscleKg]) : 0;
    if (skeletalMuscleKg <= 0 && weight > 0 && skeletalMusclePct > 0) {
      skeletalMuscleKg = parseFloat(((weight * skeletalMusclePct) / 100).toFixed(1));
    }

    const record: BodyRecord = {
      id: `rec-${timestamp}-${i}`,
      date: dateStr,
      timestamp,
      timezone: mapping.timezone !== undefined && tokens[mapping.timezone] ? tokens[mapping.timezone] : 'Asia/Taipei',
      weight,
      bodyFatPct,
      bodyFatKg,
      visceralFat: mapping.visceralFat !== undefined ? parseNumber(tokens[mapping.visceralFat]) : 0,
      basalMetabolism: mapping.basalMetabolism !== undefined ? Math.round(parseNumber(tokens[mapping.basalMetabolism])) : 0,
      skeletalMusclePct,
      skeletalMuscleKg,
      skeletalMuscleArmsPct: mapping.skeletalMuscleArmsPct !== undefined ? parseNumber(tokens[mapping.skeletalMuscleArmsPct]) : 0,
      skeletalMuscleTrunkPct: mapping.skeletalMuscleTrunkPct !== undefined ? parseNumber(tokens[mapping.skeletalMuscleTrunkPct]) : 0,
      skeletalMuscleLegsPct: mapping.skeletalMuscleLegsPct !== undefined ? parseNumber(tokens[mapping.skeletalMuscleLegsPct]) : 0,
      subcutaneousFatPct: mapping.subcutaneousFatPct !== undefined ? parseNumber(tokens[mapping.subcutaneousFatPct]) : 0,
      subcutaneousFatArmsPct: mapping.subcutaneousFatArmsPct !== undefined ? parseNumber(tokens[mapping.subcutaneousFatArmsPct]) : 0,
      subcutaneousFatTrunkPct: mapping.subcutaneousFatTrunkPct !== undefined ? parseNumber(tokens[mapping.subcutaneousFatTrunkPct]) : 0,
      subcutaneousFatLegsPct: mapping.subcutaneousFatLegsPct !== undefined ? parseNumber(tokens[mapping.subcutaneousFatLegsPct]) : 0,
      bmi: mapping.bmi !== undefined ? parseNumber(tokens[mapping.bmi]) : 0,
      bodyAge: mapping.bodyAge !== undefined ? Math.round(parseNumber(tokens[mapping.bodyAge])) : 0,
      modelName: mapping.modelName !== undefined && tokens[mapping.modelName] ? tokens[mapping.modelName] : 'HBF-702T',
    };

    records.push(record);
  }

  // Sort ascending by timestamp
  records.sort((a, b) => a.timestamp - b.timestamp);

  return { records, errors };
}

/**
 * Merges existing records with new records, deduplicating by normalized date string or timestamp
 */
export function mergeBodyRecords(existing: BodyRecord[], incoming: BodyRecord[]): {
  merged: BodyRecord[];
  addedCount: number;
  updatedCount: number;
} {
  const map = new Map<string, BodyRecord>();

  existing.forEach((rec) => {
    const key = rec.date.trim();
    map.set(key, rec);
  });

  let addedCount = 0;
  let updatedCount = 0;

  incoming.forEach((rec) => {
    const key = rec.date.trim();
    if (map.has(key)) {
      map.set(key, { ...map.get(key)!, ...rec, id: map.get(key)!.id });
      updatedCount++;
    } else {
      map.set(key, rec);
      addedCount++;
    }
  });

  const merged = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  return { merged, addedCount, updatedCount };
}

/**
 * Converts BodyRecord[] back to downloadable Omron-compatible CSV
 */
export function exportToCsv(records: BodyRecord[]): string {
  const headers = [
    '測量日期',
    '時區',
    '體重(kg)',
    '體脂肪(%)',
    '體脂肪量(kg)',
    '內臟脂肪程度',
    '基礎代謝(kcal)',
    '骨骼肌(%)',
    '骨骼肌重量(kg)',
    '骨骼肌率（雙臂）(%)',
    '骨骼肌率（身軀）(%)',
    '骨骼肌率（雙腳）(%)',
    '皮下脂肪率(%)',
    '皮下脂肪率（雙臂）(%)',
    '皮下脂肪率（身軀）(%)',
    '皮下脂肪率（雙腳）(%)',
    'BMI',
    '身體年齡(歲)',
    '型號',
  ];

  const rows = records.map((r) => [
    `"${r.date}"`,
    `"${r.timezone || 'Asia/Taipei'}"`,
    `"${r.weight.toFixed(2)}"`,
    `"${r.bodyFatPct.toFixed(1)}"`,
    `"${r.bodyFatKg.toFixed(1)}"`,
    `"${r.visceralFat.toFixed(1)}"`,
    `"${r.basalMetabolism}"`,
    `"${r.skeletalMusclePct.toFixed(1)}"`,
    `"${r.skeletalMuscleKg.toFixed(1)}"`,
    `"${r.skeletalMuscleArmsPct.toFixed(1)}"`,
    `"${r.skeletalMuscleTrunkPct.toFixed(1)}"`,
    `"${r.skeletalMuscleLegsPct.toFixed(1)}"`,
    `"${r.subcutaneousFatPct.toFixed(1)}"`,
    `"${r.subcutaneousFatArmsPct.toFixed(1)}"`,
    `"${r.subcutaneousFatTrunkPct.toFixed(1)}"`,
    `"${r.subcutaneousFatLegsPct.toFixed(1)}"`,
    `"${r.bmi.toFixed(1)}"`,
    `"${r.bodyAge}"`,
    `"${r.modelName || 'HBF-702T'}"`,
  ]);

  return [headers.map((h) => `"${h}"`).join(','), ...rows.map((row) => row.join(','))].join('\n');
}
