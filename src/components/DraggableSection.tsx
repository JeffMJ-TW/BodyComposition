import React, { useState } from 'react';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export interface DraggableSectionProps {
  id: string;
  index: number;
  total: number;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  summaryPreview?: React.ReactNode;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  children: React.ReactNode;
}

export const DraggableSection: React.FC<DraggableSectionProps> = ({
  id,
  index,
  total,
  title,
  subtitle,
  icon,
  iconBgColor = 'bg-blue-50 text-blue-600 border-blue-200',
  summaryPreview,
  isCollapsed,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDragOver = false,
  children,
}) => {
  return (
    <section
      id={`section-${id}`}
      aria-label={title}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        onDragOver(e, id);
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        onDragLeave(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(id);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        onDragEnd();
      }}
      className={`relative transition-all duration-200 ${
        isDragging
          ? 'opacity-40 scale-[0.99] ring-2 ring-purple-400 ring-dashed rounded-2xl shadow-lg'
          : isDragOver
          ? 'ring-2 ring-purple-500 rounded-2xl shadow-md'
          : ''
      }`}
    >
      {/* Drop Indicator Bar on top if dragged over */}
      {isDragOver && (
        <div className="absolute -top-3 left-4 right-4 h-1.5 bg-purple-600 rounded-full animate-pulse z-30 shadow-sm" />
      )}

      {/* Module Header Control Bar (Draggable & Collapsible) */}
      <div
        className={`mb-3 px-4 py-2.5 bg-white rounded-xl border border-zinc-200/80 shadow-2xs flex items-center justify-between gap-3 select-none transition-all ${
          isCollapsed
            ? 'hover:border-purple-300 hover:bg-purple-50/20 cursor-pointer'
            : 'hover:border-zinc-300'
        }`}
        onClick={() => {
          if (isCollapsed) {
            onToggleCollapse();
          }
        }}
      >
        {/* Left: Drag Handle, Number, Icon & Titles */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Drag Grip Handle */}
          <div
            title="按住拖曳可調整此大項順序位置"
            className="p-1 -ml-1 text-zinc-400 hover:text-purple-600 active:text-purple-700 cursor-grab active:cursor-grabbing rounded-lg hover:bg-zinc-100 transition-colors shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Position Order Number Badge */}
          <span
            className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 shrink-0"
            title={`目前排列在第 ${index + 1} 大項`}
          >
            #{index + 1}
          </span>

          {/* Section Icon */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 text-sm shadow-2xs ${iconBgColor}`}
          >
            {icon}
          </div>

          {/* Title & Subtitle */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-zinc-900 truncate tracking-tight">
                {title}
              </h3>
              {isCollapsed && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 shrink-0">
                  已收折
                </span>
              )}
            </div>
            {subtitle && !isCollapsed && (
              <p className="text-[11px] text-zinc-500 truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>

          {/* Summary Preview Strip when Collapsed */}
          {isCollapsed && summaryPreview && (
            <div className="hidden md:flex items-center gap-2 truncate text-xs text-zinc-600">
              {summaryPreview}
            </div>
          )}
        </div>

        {/* Right: Reorder Buttons & Collapse Toggle */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Move Up */}
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            title={index === 0 ? '已在最上方' : '向上移一格'}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              index === 0
                ? 'border-transparent text-zinc-200 cursor-not-allowed'
                : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 shadow-2xs cursor-pointer active:scale-95'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          {/* Move Down */}
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            title={index === total - 1 ? '已在最下方' : '向下移一格'}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              index === total - 1
                ? 'border-transparent text-zinc-200 cursor-not-allowed'
                : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 shadow-2xs cursor-pointer active:scale-95'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            id={`toggle-collapse-${id}`}
            onClick={onToggleCollapse}
            title={isCollapsed ? '點擊展開內容' : '點擊收折此區塊'}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              isCollapsed
                ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 shadow-2xs'
                : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 shadow-2xs'
            }`}
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>展開</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>收折</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Section Main Content (Collapsible Body) */}
      {!isCollapsed && (
        <div className="animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </section>
  );
};
