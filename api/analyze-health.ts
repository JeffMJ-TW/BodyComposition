import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

let genAIClient: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing');
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { records, goals, userProfile } = req.body || {};

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: '請提供量測記錄數據以進行分析' });
    }

    if (req.body?.useFallback || !process.env.GEMINI_API_KEY) {
      const fallbackResult = generateFallbackClinicalAnalysis(records);
      return res.json({
        success: true,
        data: fallbackResult,
        modelUsed: 'clinical-fallback',
        generatedAt: new Date().toISOString(),
      });
    }

    const ai = getGenAI();
    const latest = records[records.length - 1];
    const previous = records.length > 1 ? records[records.length - 2] : null;
    const earliest = records[0];

    const promptContext = {
      recordCount: records.length,
      timeSpan: {
        firstDate: earliest.date,
        latestDate: latest.date,
      },
      latestRecord: latest,
      previousRecord: previous,
      earliestRecord: records.length > 2 ? earliest : null,
      goals: goals || {},
      userProfile: userProfile || { gender: 'male', estimatedAge: latest.bodyAge || 52 },
    };

    const prompt = `你是一位專業的臨床運動醫學與營養學健康顧問。使用者提供了一份來自專業人體組成分析儀（如 Omron HBF-702T / InBody 等）的多項身體數值報告。

請根據以下數值與變化趨勢進行專業、客觀且富有建設性的健康分析與生活指引：

【量測數據摘要】
${JSON.stringify(promptContext, null, 2)}

【特別注意重點】
1. 觀察「體重」、「體脂肪率(%)」、「體脂肪量(kg)」、「骨骼肌率(%)」與「骨骼肌重量(kg)」的互動關係。
   - 警惕「虛假減重」：如果體重下降，但骨骼肌重量下降、體脂肪率反而上升，必須溫和但明確提醒「可能減到了水分與肌肉，而非真實脂肪，需要注意蛋白質攝取與阻力訓練避免肌少症或代謝下降」。
2. 評估「內臟脂肪程度」（正常為 1-9，10-14 偏高，15+ 危險）及「BMI」。
3. 部位分析（雙臂、身軀、雙腳的骨骼肌率與皮下脂肪率）是否有不均衡現象。
4. 提供具體可行、貼近日常的飲食（蛋白質/低GI碳水/水份）與運動建議（肌力重訓與有氧心肺的比例）。

請以繁體中文回答，語氣專業、同理心且具鼓勵性。`;

    // 支援當前穩定的 flash 系列模型
    const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let parsedResult: any = null;
    let usedModel = '';

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response: any = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              '你是一位專業、嚴謹且溫暖的身體組成數據與健康顧問，精通運動生理學與臨床營養學。輸出必須遵守 JSON 格式，請力求精準、專業、扼要。',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallAssessment: { type: Type.STRING },
                weightLossQuality: {
                  type: Type.OBJECT,
                  properties: {
                    level: { type: Type.STRING },
                    summary: { type: Type.STRING },
                  },
                  required: ['level', 'summary'],
                },
                keyObservations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                segmentalAnalysis: { type: Type.STRING },
                actionPlan: {
                  type: Type.OBJECT,
                  properties: {
                    diet: { type: Type.ARRAY, items: { type: Type.STRING } },
                    exercise: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lifestyle: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['diet', 'exercise', 'lifestyle'],
                },
                encouragement: { type: Type.STRING },
              },
              required: [
                'overallAssessment',
                'weightLossQuality',
                'keyObservations',
                'segmentalAnalysis',
                'actionPlan',
                'encouragement',
              ],
            },
          },
        });

        const text = response?.text;
        if (text) {
          parsedResult = JSON.parse(text);
          usedModel = modelName;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err?.message || err);
      }
    }

    if (!parsedResult) {
      parsedResult = generateFallbackClinicalAnalysis(records);
      usedModel = 'clinical-fallback';
    }

    return res.status(200).json({
      success: true,
      data: parsedResult,
      modelUsed: usedModel,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error?.message || '產生 AI 分析時發生錯誤，請稍後再試。',
    });
  }
}

function generateFallbackClinicalAnalysis(records: any[]) {
  const latest = records[records.length - 1];
  const previous = records.length > 1 ? records[records.length - 2] : null;

  const deltaWeight = previous ? +(latest.weight - previous.weight).toFixed(2) : 0;
  const deltaFatKg = previous ? +(latest.bodyFatKg - previous.bodyFatKg).toFixed(2) : 0;
  const deltaMuscleKg = previous ? +(latest.skeletalMuscleKg - previous.skeletalMuscleKg).toFixed(2) : 0;

  let qualityLevel = '體態維持';
  let qualitySummary = '';
  if (deltaWeight < 0 && deltaMuscleKg < 0 && deltaFatKg >= 0) {
    qualityLevel = '肌肉流失警訊';
    qualitySummary = `近期體重下降 ${Math.abs(deltaWeight)} kg，但實質骨骼肌肉量減少 ${Math.abs(deltaMuscleKg)} kg，體脂肪反而微增 ${deltaFatKg} kg。此現象顯示減少的大多為水分與骨骼肌，需留意蛋白質補充與漸進式阻力訓練，以預防基礎代謝下滑。`;
  } else if (deltaFatKg < 0 && deltaMuscleKg >= 0) {
    qualityLevel = '優秀減脂';
    qualitySummary = `減重品質相當優良！實質體脂肪下降 ${Math.abs(deltaFatKg)} kg，且有效保全骨骼肌肉質量，基礎代謝得以穩定維持。`;
  } else {
    qualitySummary = `目前各項組成指標處於調整階段，體重 ${latest.weight} kg、體脂率 ${latest.bodyFatPct}%，需持續追蹤長期肌脂消長走勢。`;
  }

  return {
    overallAssessment: `當前體重 ${latest.weight} kg，BMI ${latest.bmi}，體脂肪率 ${latest.bodyFatPct}%。內臟脂肪等級為 ${latest.visceralFat}，骨骼肌率為 ${latest.skeletalMusclePct}%。${
      latest.visceralFat > 9 ? '內臟脂肪稍有蓄積，宜留意腰圍與內臟代謝負荷。' : '內臟脂肪維持在良好安全區間。'
    }整體基礎代謝為 ${Math.round(latest.basalMetabolism)} kcal。`,
    weightLossQuality: {
      level: qualityLevel,
      summary: qualitySummary,
    },
    keyObservations: [
      `體脂肪率 ${latest.bodyFatPct}%，折算體脂肪重量約 ${latest.bodyFatKg} kg。`,
      `骨骼肌率 ${latest.skeletalMusclePct}% (${latest.skeletalMuscleKg} kg)，維持骨骼肌是防範代謝下滑之關鍵。`,
      `內臟脂肪等級 ${latest.visceralFat}，${latest.visceralFat > 9 ? '建議減少含糖飲品與酒精攝取以縮減內臟脂肪。' : '維持良好標準範圍。'}`,
      `身體生理年齡判定為 ${latest.bodyAge} 歲，反映目前生理組織之代謝能力。`,
    ],
    segmentalAnalysis: `雙腳下肢骨骼肌率 (${latest.skeletalMuscleLegsPct}%) 保持良好支撐力；身軀核心骨骼肌率為 ${latest.skeletalMuscleTrunkPct}%，可搭配棒式或深蹲加強核心；四肢與身軀皮下脂肪分布平均，規律阻抗訓練有助於全身緊實。`,
    actionPlan: {
      diet: [
        `維持每日蛋白質攝取約 1.2~1.5 g/kg（約 105g~130g），優先攝取優質蛋白質（魚類、雞肉、非基改豆漿、雞蛋）。`,
        `每日飲水量達 2500ml ~ 3000ml，促進代謝與體內電解質平衡。`,
        `飲食維持在基礎代謝率 (${Math.round(latest.basalMetabolism)} kcal) 以上，切勿極端節食以防肌肉被分解消耗。`,
      ],
      exercise: [
        `每週安排 2-3 次全身性肌力阻力訓練（如深蹲、胸推、划船、硬舉），重點刺激大肌群守護肌肉量。`,
        `每週累積 120-150 分鐘中低強度有氧運動（如超慢跑或快走），專注氧化燃燒內臟脂肪。`,
      ],
      lifestyle: [
        `固定晨起空腹、如廁後測量，以排除日常水分與飲食擾動對電阻量測的干擾。`,
        `維持 7-8 小時充足睡眠，穩定皮質醇激素，降低腹部脂肪堆積傾向。`,
      ],
    },
    encouragement: '健康減重是一場長期的生活習慣重塑，守護骨骼肌肉就是守護未來十年的代謝活力，一步一腳印持續前行！',
  };
}
