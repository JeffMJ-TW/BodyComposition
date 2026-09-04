import React from 'react';
import {
  RefreshCw,
  Compass,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { InjectionSite, InjectionRecord } from '../../types';
import {
  INJECTION_SITES,
  getNextRecommendedSite,
  InjectionSiteDef,
} from '../../utils/mounjaroConstants';

interface SiteRotationCardProps {
  injections: InjectionRecord[];
  onSelectSiteQuick?: (site: InjectionSite) => void;
  onOpenNewInjectionWithSite?: (site: InjectionSite) => void;
}

export const SiteRotationCard: React.FC<SiteRotationCardProps> = ({
  injections,
  onOpenNewInjectionWithSite,
}) => {
  // Sort injections desc
  const sortedInjections = [...injections].sort(
    (a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime()
  );

  const lastInjection = sortedInjections[0];
  const lastSite = lastInjection?.site;
  const recommendedSite = getNextRecommendedSite(lastSite);

  const lastSiteDef = INJECTION_SITES.find((s) => s.key === lastSite);
  const recommendedSiteDef = INJECTION_SITES.find((s) => s.key === recommendedSite);

  // Group sites by region
  const abdomenSites = INJECTION_SITES.filter((s) => s.region === 'abdomen');
  const thighSites = INJECTION_SITES.filter((s) => s.region === 'thigh');
  const armSites = INJECTION_SITES.filter((s) => s.region === 'arm');

  // Count how many times each site has been used
  const siteUsageCount = injections.reduce((acc, inj) => {
    acc[inj.site] = (acc[inj.site] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200 shadow-2xs">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
              <span>皮下注射部位輪替指引</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                預防脂肪增生與硬結
              </span>
            </h3>
            <p className="text-xs text-zinc-500">
              每次注射建議間隔同部位至少 2~3 週，吸收更均勻平穩
            </p>
          </div>
        </div>

        {/* Current status pill */}
        <div className="flex items-center gap-2 text-xs bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200">
          <div className="flex items-center gap-1 text-zinc-500">
            <span>上次：</span>
            <strong className="text-zinc-800">
              {lastSiteDef ? lastSiteDef.label : '尚未記錄'}
            </strong>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          <div className="flex items-center gap-1 text-purple-700 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>推薦本次：</span>
            <span className="bg-purple-600 text-white px-1.5 py-0.5 rounded text-[11px]">
              {recommendedSiteDef?.label}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Interactive Diagram & Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Schematic Canvas Box */}
        <div className="relative bg-zinc-50/80 rounded-2xl border border-zinc-200/90 p-4 flex flex-col items-center justify-center min-h-[220px]">
          <span className="absolute top-2.5 left-3 text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
            人體皮下部位分佈
          </span>

          {/* Simple Clean Body Silhouette & Regions */}
          <div className="w-44 h-48 relative flex items-center justify-center">
            {/* Body wireframe outline */}
            <svg
              viewBox="0 0 160 200"
              className="w-full h-full text-zinc-300 drop-shadow-2xs"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Head */}
              <circle cx="80" cy="22" r="14" fill="#F4F4F5" />
              {/* Torso & Shoulders */}
              <path
                d="M 52 44 C 44 48, 30 56, 24 84 C 22 92, 28 96, 32 94 C 36 92, 44 76, 50 68 L 52 130 C 52 138, 62 144, 80 144 C 98 144, 108 138, 108 130 L 110 68 C 116 76, 124 92, 128 94 C 132 96, 138 92, 136 84 C 130 56, 116 48, 108 44 Z"
                fill="#FAFAFA"
              />
              {/* Navel (belly button) */}
              <circle cx="80" cy="95" r="2" fill="#A1A1AA" stroke="none" />
              {/* Legs */}
              <path
                d="M 60 142 L 56 194 C 55 198, 68 200, 72 196 L 77 144 Z"
                fill="#FAFAFA"
              />
              <path
                d="M 100 142 L 104 194 C 105 198, 92 200, 88 196 L 83 144 Z"
                fill="#FAFAFA"
              />
            </svg>

            {/* Interactive Region Dots on SVG Silhouette */}
            {INJECTION_SITES.map((site) => {
              const isLast = site.key === lastSite;
              const isRec = site.key === recommendedSite;
              const count = siteUsageCount[site.key] || 0;

              return (
                <button
                  key={site.key}
                  type="button"
                  onClick={() => onOpenNewInjectionWithSite?.(site.key)}
                  title={`${site.label} (${site.description}) - 已施打 ${count} 次${isRec ? ' [本次推薦]' : ''}${isLast ? ' [上次施打]' : ''}`}
                  style={{
                    left: `${site.iconCoord.x}%`,
                    top: `${site.iconCoord.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute group cursor-pointer transition-all duration-200 z-10 p-1 rounded-full ${
                    isRec
                      ? 'scale-125 ring-4 ring-purple-400/50 animate-bounce'
                      : isLast
                      ? 'scale-110 ring-2 ring-zinc-400'
                      : 'hover:scale-125'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs ${
                      isRec
                        ? 'bg-purple-600 text-white shadow-purple-500/50'
                        : isLast
                        ? 'bg-zinc-800 text-white'
                        : 'bg-white border-2 border-purple-300 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    {isRec ? '★' : count > 0 ? count : '·'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span>本次推薦</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              <span>上次施打</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-purple-300" />
              <span>可選部位</span>
            </span>
          </div>
        </div>

        {/* Region Buttons Breakdown */}
        <div className="md:col-span-2 space-y-3">
          {/* Abdomen 4 Quadrants */}
          <div>
            <span className="text-xs font-bold text-zinc-700 block mb-1.5">
              1. 腹部四象限（最常用 · 吸收最平穩 · 距肚臍 5cm 以上）
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {abdomenSites.map((site) => {
                const isLast = site.key === lastSite;
                const isRec = site.key === recommendedSite;
                const count = siteUsageCount[site.key] || 0;

                return (
                  <button
                    key={site.key}
                    type="button"
                    onClick={() => onOpenNewInjectionWithSite?.(site.key)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isRec
                        ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-400/40 shadow-xs'
                        : isLast
                        ? 'bg-zinc-100 border-zinc-400 text-zinc-700'
                        : 'bg-white border-zinc-200 hover:border-purple-200 hover:bg-purple-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">{site.label}</span>
                      {isRec && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-600 text-white">
                          首選
                        </span>
                      )}
                      {isLast && (
                        <span className="text-[9px] font-medium px-1 rounded bg-zinc-200 text-zinc-700">
                          上次
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1">
                      歷史累計 {count} 次
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thigh & Upper Arm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Thighs */}
            <div>
              <span className="text-xs font-bold text-zinc-700 block mb-1.5">
                2. 大腿前外側中段（易自行施打）
              </span>
              <div className="grid grid-cols-2 gap-2">
                {thighSites.map((site) => {
                  const isLast = site.key === lastSite;
                  const isRec = site.key === recommendedSite;
                  const count = siteUsageCount[site.key] || 0;

                  return (
                    <button
                      key={site.key}
                      type="button"
                      onClick={() => onOpenNewInjectionWithSite?.(site.key)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isRec
                          ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-400/40 shadow-xs'
                          : isLast
                          ? 'bg-zinc-100 border-zinc-400 text-zinc-700'
                          : 'bg-white border-zinc-200 hover:border-purple-200 hover:bg-purple-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900">{site.label}</span>
                        {isRec && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-600 text-white">
                            首選
                          </span>
                        )}
                        {isLast && (
                          <span className="text-[9px] font-medium px-1 rounded bg-zinc-200 text-zinc-700">
                            上次
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-1">
                        歷史累計 {count} 次
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upper Arms */}
            <div>
              <span className="text-xs font-bold text-zinc-700 block mb-1.5">
                3. 上臂外側後側（需他人協助或自捏）
              </span>
              <div className="grid grid-cols-2 gap-2">
                {armSites.map((site) => {
                  const isLast = site.key === lastSite;
                  const isRec = site.key === recommendedSite;
                  const count = siteUsageCount[site.key] || 0;

                  return (
                    <button
                      key={site.key}
                      type="button"
                      onClick={() => onOpenNewInjectionWithSite?.(site.key)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isRec
                          ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-400/40 shadow-xs'
                          : isLast
                          ? 'bg-zinc-100 border-zinc-400 text-zinc-700'
                          : 'bg-white border-zinc-200 hover:border-purple-200 hover:bg-purple-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900">{site.label}</span>
                        {isRec && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-600 text-white">
                            首選
                          </span>
                        )}
                        {isLast && (
                          <span className="text-[9px] font-medium px-1 rounded bg-zinc-200 text-zinc-700">
                            上次
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-1">
                        歷史累計 {count} 次
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
