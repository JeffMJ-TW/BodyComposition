import React, { useState, useMemo } from 'react';
import {
  Activity,
  Sparkles,
  Info,
  Calendar,
  Zap,
  TrendingDown,
  TrendingUp,
  HelpCircle,
} from 'lucide-react';
import { InjectionRecord } from '../../types';
import {
  calculatePharmacokineticsCurve,
  TIRZEPATIDE_PK,
  PkDataPoint,
} from '../../utils/mounjaroConstants';

interface PkConcentrationChartProps {
  injections: InjectionRecord[];
}

export const PkConcentrationChart: React.FC<PkConcentrationChartProps> = ({ injections }) => {
  const [hoveredPoint, setHoveredPoint] = useState<PkDataPoint | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Calculate PK data points
  const pkResult = useMemo(() => {
    return calculatePharmacokineticsCurve(injections, 12);
  }, [injections]);

  const { points, currentConcentration, peakConcentration, troughConcentration } = pkResult;

  if (points.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 text-center text-zinc-500">
        <Activity className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
        <p className="text-sm">尚無施打紀錄，登記第一次注射後將自動模擬體內藥物濃度曲線。</p>
      </div>
    );
  }

  // Chart dimensions
  const width = 800;
  const height = 260;
  const padding = { top: 25, right: 30, bottom: 40, left: 45 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // X and Y scales
  const minTime = points[0].timeMs;
  const maxTime = points[points.length - 1].timeMs;
  const timeSpan = Math.max(1, maxTime - minTime);

  const maxConc = Math.max(0.1, peakConcentration * 1.15);

  const getX = (timeMs: number) => {
    return padding.left + ((timeMs - minTime) / timeSpan) * innerWidth;
  };

  const getY = (conc: number) => {
    return padding.top + innerHeight - (conc / maxConc) * innerHeight;
  };

  // Build SVG Path
  const linePath = points.reduce((acc, pt, i) => {
    const x = getX(pt.timeMs);
    const y = getY(pt.concentrationMg);
    return i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

  const areaPath = `${linePath} L ${getX(points[points.length - 1].timeMs).toFixed(1)} ${getY(0)} L ${getX(points[0].timeMs).toFixed(1)} ${getY(0)} Z`;

  // Find "Today" X coordinate
  const nowMs = Date.now();
  const todayX = nowMs >= minTime && nowMs <= maxTime ? getX(nowMs) : null;

  // Injection markers on chart
  const injectionPoints = points.filter((p) => p.isInjectionPoint);

  // Time ticks (sample every 7 days or ~5 intervals)
  const tickCount = Math.min(6, Math.max(3, Math.floor(timeSpan / (7 * 86400000))));
  const timeTicks = Array.from({ length: tickCount + 1 }).map((_, i) => {
    const t = minTime + (i / tickCount) * timeSpan;
    const d = new Date(t);
    return {
      x: getX(t),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
    };
  });

  // Y ticks
  const yTicks = [0, maxConc * 0.25, maxConc * 0.5, maxConc * 0.75, maxConc].map((v) => ({
    y: getY(v),
    label: v.toFixed(1),
  }));

  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200 shadow-2xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
              <span>體內估計藥物濃度走勢（Pharmacokinetics PK 模擬）</span>
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer"
                title="查看計算原理"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </h3>
            <p className="text-xs text-zinc-500">
              Tirzepatide 半衰期約 5 天 · 依皮下吸收與一級消除方程式 C(t) 疊加模擬
            </p>
          </div>
        </div>

        {/* Live PK metric badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200 text-purple-800 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            <span>當前體內估計濃度：</span>
            <strong className="font-mono text-sm">{currentConcentration.toFixed(2)} mg</strong>
          </div>
          <div className="bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200 text-zinc-600 font-mono hidden sm:flex items-center gap-1">
            <span>峰值 {peakConcentration.toFixed(1)} mg</span>
            <span className="text-zinc-300">/</span>
            <span>谷值 {troughConcentration.toFixed(1)} mg</span>
          </div>
        </div>
      </div>

      {/* Formula explanation modal / banner */}
      {showExplanation && (
        <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl text-xs text-purple-900 space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-between font-bold">
            <span>藥動學 (PK) 模擬數學原理：</span>
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="text-purple-500 hover:text-purple-800 text-[11px]"
            >
              關閉
            </button>
          </div>
          <p className="leading-relaxed text-purple-800">
            猛健樂（Tirzepatide）在人體皮下注射後，於 24~48 小時達到血中峰值濃度，其體內半衰期（t½）約為 <strong>5.0 天（120小時）</strong>。
            消除速率常數 <code className="bg-white/80 px-1 py-0.5 rounded font-mono">k = ln(2) / 5 ≈ 0.1386 day⁻¹</code>。
            系統依據經典 Bateman 吸收與一級消除疊加公式，模擬每次施打後的波峰與衰減，並預測每週穩定態（Steady State）的血中濃度波動，協助掌握抑制食慾的高原期與排空節奏。
          </p>
        </div>
      )}

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="pkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#A78BFA" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="#E4E4E7"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={tick.y + 3}
                fontSize="10"
                fill="#A1A1AA"
                textAnchor="end"
                fontFamily="monospace"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* X Axis Ticks */}
          {timeTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.x}
                y1={height - padding.bottom}
                x2={tick.x}
                y2={height - padding.bottom + 4}
                stroke="#D4D4D8"
                strokeWidth="1"
              />
              <text
                x={tick.x}
                y={height - padding.bottom + 16}
                fontSize="10"
                fill="#71717A"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Area under curve */}
          <path d={areaPath} fill="url(#pkGradient)" />

          {/* Concentration Curve Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Today Indicator Line & Badge */}
          {todayX !== null && (
            <g>
              <line
                x1={todayX}
                y1={padding.top - 5}
                x2={todayX}
                y2={height - padding.bottom}
                stroke="#DC2626"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <circle cx={todayX} cy={getY(currentConcentration)} r="4" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
              <rect
                x={todayX - 22}
                y={padding.top - 18}
                width="44"
                height="16"
                rx="4"
                fill="#DC2626"
              />
              <text
                x={todayX}
                y={padding.top - 6}
                fill="#FFFFFF"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                今日
              </text>
            </g>
          )}

          {/* Injection Dose Markers */}
          {injectionPoints.map((pt, i) => {
            const x = getX(pt.timeMs);
            const y = getY(pt.concentrationMg);

            return (
              <g key={i} className="cursor-pointer">
                <circle cx={x} cy={y} r="5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="2" />
                <rect
                  x={x - 24}
                  y={y - 22}
                  width="48"
                  height="16"
                  rx="4"
                  fill="#581C87"
                  opacity="0.9"
                />
                <text
                  x={x}
                  y={y - 11}
                  fill="#FFFFFF"
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  +{pt.injectionDose}mg
                </text>
              </g>
            );
          })}

          {/* Interactive invisible hover overlay rects for points */}
          {points.map((pt, i) => {
            const x = getX(pt.timeMs);
            return (
              <rect
                key={i}
                x={x - 6}
                y={padding.top}
                width={12}
                height={innerHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* Hover crosshair tooltip */}
          {hoveredPoint && (
            <g>
              <line
                x1={getX(hoveredPoint.timeMs)}
                y1={padding.top}
                x2={getX(hoveredPoint.timeMs)}
                y2={height - padding.bottom}
                stroke="#6D28D9"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredPoint.timeMs)}
                cy={getY(hoveredPoint.concentrationMg)}
                r="5"
                fill="#6D28D9"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-zinc-900/90 text-white text-xs rounded-xl p-2.5 shadow-xl border border-zinc-700/60 backdrop-blur-xs flex flex-col gap-0.5"
            style={{
              left: `${Math.min(
                Math.max(10, ((getX(hoveredPoint.timeMs) / width) * 100)),
                80
              )}%`,
              top: '10px',
            }}
          >
            <span className="text-[10px] text-zinc-400">
              {new Date(hoveredPoint.timeMs).toLocaleDateString('zh-TW', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="flex items-center gap-1.5 font-bold font-mono">
              <span className="text-purple-400">體內估算量:</span>
              <span>{hoveredPoint.concentrationMg} mg</span>
            </div>
            {hoveredPoint.isInjectionPoint && (
              <span className="text-[10px] text-amber-300 font-semibold">
                💉 注射記錄: +{hoveredPoint.injectionDose} mg
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Guidance */}
      <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between text-xs text-zinc-500 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <span>體內濃度曲線 (mg 等效累積)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-red-600" />
            <span>今日時間標線</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-900" />
            <span>注射事件點</span>
          </span>
        </div>
        <span className="text-[11px] text-zinc-400">
          *曲線為藥物動力學數學模型估算，個體代謝差異請以臨床醫囑為準
        </span>
      </div>
    </div>
  );
};
