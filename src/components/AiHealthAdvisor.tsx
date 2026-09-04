import React, { useState } from 'react';
import { BodyRecord, AIAnalysisData } from '../types';
import {
  Sparkles,
  Bot,
  ZapOff,
  RefreshCw,
  Apple,
  Dumbbell,
  Clock,
  AlertCircle,
  ShieldCheck,
  Activity,
} from 'lucide-react';

interface AiHealthAdvisorProps {
  records: BodyRecord[];
  isAiEnabled: boolean;
  onToggleAiEnabled: (enabled: boolean) => void;
  cachedAnalysis: AIAnalysisData | null;
  onSaveAnalysis: (analysis: AIAnalysisData) => void;
  lastAnalysisTime?: string | null;
}

export const AiHealthAdvisor: React.FC<AiHealthAdvisorProps> = ({
  records,
  isAiEnabled,
  onToggleAiEnabled,
  cachedAnalysis,
  onSaveAnalysis,
  lastAnalysisTime,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latest = records[records.length - 1];

  const handleGenerateAiAdvice = async (forceFallback = false) => {
    if (!records || records.length === 0) return;
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('/api/analyze-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          records,
          useFallback: forceFallback,
          userProfile: {
            gender: 'male',
            estimatedAge: latest.bodyAge || 52,
          },
        }),
      });

      clearTimeout(timeoutId);
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'AI 分析請求失敗');
      }

      onSaveAnalysis({
        ...resData.data,
        modelUsed: resData.modelUsed,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Fetch AI error:', err);
      let errText = '無法連線至 AI 服務，請稍後再試。';
      if (err?.name === 'AbortError') {
        errText = '雲端 AI 運算時間較長（已達 15 秒保護超時）。您可以點選「即刻套用臨床常模分析」立即取得專業診斷，或再次重試。';
      } else if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          errText = parsed?.error?.message || parsed?.message || err.message;
        } catch {
          errText = err.message;
        }
      }
      if (errText.includes('503') || errText.includes('high demand') || errText.includes('UNAVAILABLE')) {
        errText = 'AI 雲端服務目前全球需求量較大暫時繁忙，系統已具備自動切換與常模備援機制。';
      }
      setError(errText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs transition-all">
      {/* Top Header & AI Toggle Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
              isAiEnabled
                ? 'bg-purple-50 text-purple-600 border-purple-200'
                : 'bg-zinc-100 text-zinc-500 border-zinc-200'
            }`}
          >
            {isAiEnabled ? <Sparkles className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-900">健康建議與生活指引</h3>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  isAiEnabled
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {isAiEnabled ? 'AI 智慧模式' : '標準離線模式 (零流量)'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isAiEnabled
                ? '由 Gemini 根據近期體脂、骨骼肌及部位變化產出客製化診斷'
                : '使用內建臨床醫學常模指標，不消耗任何 AI 額度與流量'}
            </p>
          </div>
        </div>

        {/* The Toggle Switch */}
        <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200/80 px-3 py-1.5 rounded-xl">
          <span className="text-xs font-medium text-zinc-700 select-none">
            {isAiEnabled ? 'AI 功能已開啟' : '節省流量 (關閉 AI)'}
          </span>
          <button
            type="button"
            id="ai-toggle-button"
            onClick={() => onToggleAiEnabled(!isAiEnabled)}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isAiEnabled ? 'bg-purple-600' : 'bg-zinc-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isAiEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* When AI IS DISABLED: Offline Standard Medical Guidance */}
      {!isAiEnabled && (
        <div className="mt-4 space-y-3.5">
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold mb-0.5">已切換至「離線標準醫學指引模式」</p>
              <p className="text-blue-700 leading-relaxed">
                此模式完全在您的裝置本地端依據衛福部及臨床運動醫學常模進行計算，完全不會發送網路請求或消耗 AI API 流量。若需要針對多期數值的長篇深度個別化報告，可隨時將上方開關切換為開啟。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Rule 1: Diet */}
            <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-2 font-semibold text-xs text-zinc-800 mb-2">
                <Apple className="w-4 h-4 text-emerald-600" />
                <span>飲食與蛋白質營養原則</span>
              </div>
              <ul className="text-xs text-zinc-600 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>每日蛋白質攝取量建議達每公斤體重 1.2 ~ 1.6 克（約 105g~140g）。</li>
                <li>以原型食物（雞胸、魚肉、豆漿、雞蛋）為主要蛋白質來源。</li>
                <li>減重期間切忌極端挨餓，維持基礎代謝 ({latest.basalMetabolism} kcal) 以上攝取。</li>
                <li>每日飲水量建議維持在 2500ml ~ 3000ml。</li>
              </ul>
            </div>

            {/* Rule 2: Exercise */}
            <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-2 font-semibold text-xs text-zinc-800 mb-2">
                <Dumbbell className="w-4 h-4 text-blue-600" />
                <span>運動與阻力訓練原則</span>
              </div>
              <ul className="text-xs text-zinc-600 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>骨骼肌率 ({latest.skeletalMusclePct}%) 需藉由大肌群肌力訓練來維持。</li>
                <li>每週進行 2-3 次全身性阻力重訓（如深蹲、胸推、硬舉、划船）。</li>
                <li>搭配每週 120-150 分鐘中低強度有氧（如超慢跑、快走、單車）燃燒內臟脂肪。</li>
                <li>避免過度高強度空腹有氧，以防肌肉組織被分解供能。</li>
              </ul>
            </div>

            {/* Rule 3: Habits */}
            <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-2 font-semibold text-xs text-zinc-800 mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>量測與生活習慣原則</span>
              </div>
              <ul className="text-xs text-zinc-600 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>固定量測時間：建議在晨起排空、尚未進食進水前測量最客觀。</li>
                <li>女性經期、劇烈運動或飲酒後體內水分分布會影響電阻測量。</li>
                <li>內臟脂肪 ({latest.visceralFat}) 偏高時，應嚴格戒除含糖手搖飲與酒精。</li>
                <li>維持每晚 7-8 小時充足睡眠，穩定皮質醇與瘦體素分泌。</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* When AI IS ENABLED */}
      {isAiEnabled && (
        <div className="mt-4">
          {/* Action trigger banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 mb-4">
            <div className="flex items-center gap-2 text-xs text-purple-900">
              <Bot className="w-4 h-4 text-purple-600" />
              <span>
                {cachedAnalysis
                  ? `已保存先前 AI 分析報告 ${lastAnalysisTime ? `(${lastAnalysisTime})` : ''}`
                  : '已備妥量測歷史資料，點擊按鈕即可呼叫 Gemini 進行全方位診斷'}
              </span>
            </div>

            <button
              type="button"
              id="generate-ai-btn"
              onClick={() => handleGenerateAiAdvice(false)}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'AI 深度分析運算中...' : cachedAnalysis ? '重新生成最新分析' : '立即生成 AI 深度診斷'}</span>
            </button>
          </div>

          {/* Loading Animation Status Box */}
          {loading && (
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 mb-4 animate-pulse">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Activity className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-purple-900">AI 深度健康運算中...</h4>
                  <p className="text-[11px] text-purple-700">正在透過高階輕量模型快速交叉比對骨骼肌率與體脂消長數據</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-purple-800 bg-white/80 p-2.5 rounded-lg border border-purple-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
                  <span>1. 彙整 {records.length} 筆身體組成歷史</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                  <span>2. 診斷虛假減重與部位分佈</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>3. 生成飲食、運動與生活指引</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">AI 分析未順利完成</p>
                  <p className="mt-0.5 text-rose-600 leading-relaxed">{error}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  id="instant-fallback-btn"
                  onClick={() => handleGenerateAiAdvice(true)}
                  disabled={loading}
                  className="px-3 py-1 rounded-lg bg-white border border-rose-300 hover:bg-rose-100/60 active:scale-95 text-rose-800 font-medium text-[11px] flex items-center gap-1 transition-all disabled:opacity-50"
                  title="使用系統內建臨床醫學常模立即生成，免除雲端模型排隊等待"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-700" />
                  <span>即刻套用臨床常模 (免等待)</span>
                </button>
                <button
                  type="button"
                  id="retry-ai-btn"
                  onClick={() => handleGenerateAiAdvice(false)}
                  disabled={loading}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-medium text-[11px] flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>重新嘗試 AI</span>
                </button>
              </div>
            </div>
          )}

          {/* Render Cached or Fresh AI Analysis Result */}
          {cachedAnalysis ? (
            <div className="space-y-4 text-xs">
              {/* Overall & Quality */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 leading-relaxed text-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    整體綜合診斷
                  </span>
                  <div className="flex items-center gap-1.5">
                    {cachedAnalysis.modelUsed && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-200/80 text-zinc-700 font-medium text-[10px]">
                        {cachedAnalysis.modelUsed === 'clinical-fallback'
                          ? '臨床常模智慧備援'
                          : cachedAnalysis.modelUsed}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold text-[11px]">
                      {cachedAnalysis.weightLossQuality?.level || '品質分析'}
                    </span>
                  </div>
                </div>
                <p className="mb-2 text-zinc-700">{cachedAnalysis.overallAssessment}</p>
                <div className="p-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-600">
                  <span className="font-semibold text-zinc-900">肌肉與脂肪互動：</span>{' '}
                  {cachedAnalysis.weightLossQuality?.summary}
                </div>
              </div>

              {/* Key Observations & Segmental */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
                  <span className="font-bold text-zinc-900 mb-2 block">🔍 關鍵數值指標觀察</span>
                  <ul className="space-y-1.5 list-disc list-inside text-zinc-700">
                    {cachedAnalysis.keyObservations?.map((obs, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {obs}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
                  <span className="font-bold text-zinc-900 mb-2 block">📐 四肢與身軀分布點評</span>
                  <p className="leading-relaxed text-zinc-700">{cachedAnalysis.segmentalAnalysis}</p>
                </div>
              </div>

              {/* Action Plan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-2">
                    <Apple className="w-4 h-4 text-emerald-600" />
                    <span>飲食調整計畫</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-emerald-800">
                    {cachedAnalysis.actionPlan?.diet?.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 mb-2">
                    <Dumbbell className="w-4 h-4 text-blue-600" />
                    <span>運動處方建議</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-blue-800">
                    {cachedAnalysis.actionPlan?.exercise?.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/40">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>作息與量測指引</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-amber-800">
                    {cachedAnalysis.actionPlan?.lifestyle?.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Encouragement */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/80 text-purple-950 font-medium text-center">
                ✨ {cachedAnalysis.encouragement}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-400 text-xs">
              點擊上方「立即生成 AI 深度診斷」按鈕，獲取包含飲食、運動與肌脂品質的專屬建議。
            </div>
          )}
        </div>
      )}
    </div>
  );
};
