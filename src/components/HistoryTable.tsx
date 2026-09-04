import React, { useState } from 'react';
import { BodyRecord } from '../types';
import { exportToCsv } from '../utils/csvParser';
import { Download, Trash2, ChevronRight, Search, FileSpreadsheet, PlusCircle } from 'lucide-react';

interface HistoryTableProps {
  records: BodyRecord[];
  onDeleteRecord: (id: string) => void;
  selectedRecordId?: string;
  onSelectRecord: (record: BodyRecord) => void;
  onOpenQuickAdd: () => void;
  onOpenImport: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  records,
  onDeleteRecord,
  selectedRecordId,
  onSelectRecord,
  onOpenQuickAdd,
  onOpenImport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filtered = records
    .filter((r) => r.date.includes(searchTerm) || (r.modelName && r.modelName.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => (sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp));

  const handleExportCsv = () => {
    const csvContent = exportToCsv(records);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `身體組成量測紀錄_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
      {/* Table Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">歷史量測紀錄明細 ({records.length} 筆)</h3>
          <p className="text-xs text-zinc-500">點擊任意列可於圖表同步標示並顯示細項</p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="搜尋日期..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-zinc-50 border border-zinc-200/80 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900 w-32 md:w-40"
            />
          </div>

          <button
            type="button"
            id="toggle-sort-btn"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 font-medium text-zinc-700"
          >
            {sortOrder === 'desc' ? '最新在前 ↓' : '最舊在前 ↑'}
          </button>

          <button
            type="button"
            id="export-csv-btn"
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 font-medium text-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯出 CSV</span>
          </button>

          <button
            type="button"
            id="table-quick-add-btn"
            onClick={onOpenQuickAdd}
            className="px-3 py-1.5 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>手動新增</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-400 uppercase text-[11px] font-semibold tracking-wider">
              <th className="py-2.5 px-3">測量日期時間</th>
              <th className="py-2.5 px-3">體重</th>
              <th className="py-2.5 px-3">體脂率</th>
              <th className="py-2.5 px-3">骨骼肌率</th>
              <th className="py-2.5 px-3">內臟脂肪</th>
              <th className="py-2.5 px-3">BMI</th>
              <th className="py-2.5 px-3">基代 (kcal)</th>
              <th className="py-2.5 px-3">年齡</th>
              <th className="py-2.5 px-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 font-mono">
            {filtered.map((record) => {
              const isSelected = selectedRecordId === record.id;

              return (
                <tr
                  key={record.id}
                  onClick={() => onSelectRecord(record)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/70 font-semibold text-blue-950' : 'hover:bg-zinc-50/80 text-zinc-700'
                  }`}
                >
                  <td className="py-3 px-3 font-sans font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      <span>{record.date}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-bold text-zinc-900">
                    {record.weight.toFixed(2)} <span className="text-[10px] font-normal text-zinc-400">kg</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-amber-700 font-semibold">
                    {record.bodyFatPct.toFixed(1)}%
                    <span className="text-[10px] text-zinc-400 block font-normal">
                      ({record.bodyFatKg.toFixed(1)}kg)
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-emerald-700 font-semibold">
                    {record.skeletalMusclePct.toFixed(1)}%
                    <span className="text-[10px] text-zinc-400 block font-normal">
                      ({record.skeletalMuscleKg.toFixed(1)}kg)
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        record.visceralFat <= 9
                          ? 'bg-emerald-50 text-emerald-700'
                          : record.visceralFat <= 14
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {record.visceralFat.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">{record.bmi.toFixed(1)}</td>
                  <td className="py-3 px-3 whitespace-nowrap">{Math.round(record.basalMetabolism)}</td>
                  <td className="py-3 px-3 whitespace-nowrap">{record.bodyAge}</td>
                  <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      title="刪除此筆記錄"
                      onClick={() => {
                        if (confirm(`確定要刪除 ${record.date} 的量測記錄嗎？`)) {
                          onDeleteRecord(record.id);
                        }
                      }}
                      className="p-1 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-8 text-center text-zinc-400 text-xs font-sans">
            查無相符量測紀錄
          </div>
        )}
      </div>
    </div>
  );
};
