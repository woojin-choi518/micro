// app/components/cesium/FilterPanel.tsx
'use client';

import { useMemo } from 'react';
import { Color } from 'cesium';

interface FilterPanelProps {
  uniqueYears: number[];
  selectedYears: number[];
  onToggleYear(year: number): void;
  onToggleSelectAll(): void;
  minYear: number;
  maxYear: number;
  currentYear: number | null;
  isPlaying: boolean;
  onPlayPause(): void;
  onChangeSlider(year: number): void;

  uniqueOrganisms: string[];
  organismFilter: string;
  onOrganismFilterChange(val: string): void;

  sequenceFilter: string;
  onSequenceFilterChange(val: string): void;

  strainFilter: string;
  onStrainFilterChange(val: string): void;

  sciNameFilter: string;
  onSciNameFilterChange(val: string): void;

  isOpen: boolean;
  onToggleOpen(): void;
}

export default function FilterPanel({
  uniqueYears,
  selectedYears,
  onToggleYear,
  onToggleSelectAll,
  minYear,
  maxYear,
  currentYear,
  isPlaying,
  onPlayPause,
  onChangeSlider,

  uniqueOrganisms,
  organismFilter,
  onOrganismFilterChange,

  sequenceFilter,
  onSequenceFilterChange,

  strainFilter,
  onStrainFilterChange,

  sciNameFilter,
  onSciNameFilterChange,

  isOpen,
  onToggleOpen,
}: FilterPanelProps) {
  const yearColorMap = useMemo(() => {
    const map: Record<number, Color> = {};
    uniqueYears.forEach((y, i) => {
      map[y] = Color.fromHsl(i / (uniqueYears.length || 1), 0.7, 0.5);
    });
    return map;
  }, [uniqueYears]);

  return (
    <div className="fixed top-[70px] left-4 z-40">
      {/* Header */}
      <div
        className="bg-white/20 backdrop-blur-md border border-white/40 rounded-full px-4 py-2 flex items-center justify-between cursor-pointer select-none shadow-lg"
        onClick={onToggleOpen}
      >
        <h2 className="text-sm font-semibold text-white">필터링 패널</h2>
        <span className="text-white text-xl">{isOpen ? '▾' : '▸'}</span>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="mt-2 bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg p-4 w-64 max-h-[90vh] overflow-y-auto space-y-4">
          {/* Year Animation */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">연도 시뮬레이션</h3>
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs">{minYear}</span>
              <input
                type="range"
                min={minYear}
                max={maxYear}
                value={currentYear ?? minYear}
                onChange={(e) => onChangeSlider(+e.target.value)}
                className="w-full"
              />
              <span className="text-white text-xs">{maxYear}</span>
            </div>
            <button
              onClick={onPlayPause}
              className={`mt-2 w-full py-1 text-sm rounded ${
                isPlaying ? 'bg-red-600' : 'bg-green-600'
              } text-white`}
            >
              {isPlaying ? 'Pause ⏸️' : 'Play ▶️'}
            </button>
          </div>

          {/* Organism */}
          <div>
            <label className="block text-white text-sm mb-1">🦠 NCBI Data</label>
            <select
              value={organismFilter}
              onChange={(e) => onOrganismFilterChange(e.target.value)}
              className="w-full p-1 text-sm rounded text-gray-800"
            >
              <option value="">── 전체 ──</option>
              {uniqueOrganisms.map(o => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search organism..."
              value={organismFilter}
              onChange={(e) => onOrganismFilterChange(e.target.value)}
              className="w-full mt-2 p-1 text-sm rounded text-gray-800"
            />
          </div>

          {/* Sequence */}
          <div>
            <input
              type="text"
              placeholder="Search sequence..."
              value={sequenceFilter}
              onChange={(e) => onSequenceFilterChange(e.target.value)}
              className="w-full p-1 text-sm rounded text-gray-800"
            />
          </div>

          {/* Strain No + Scientific Name */}
          <div>
            <label className="block text-white text-sm mb-1">🦠 PAMC Data</label>
            <input
              type="text"
              placeholder="Search Strain No..."
              value={strainFilter}
              onChange={(e) => onStrainFilterChange(e.target.value)}
              className="w-full p-1 text-sm rounded text-gray-800"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Search Scientific Name..."
              value={sciNameFilter}
              onChange={(e) => onSciNameFilterChange(e.target.value)}
              className="w-full p-1 text-sm rounded text-gray-800"
            />
          </div>

          {/* Filter by Year */}
          <div>
            <h3 className="text-white mb-2">📅 Filter by Year</h3>
            <label className="flex items-center space-x-2 text-white mb-2">
              <input
                type="checkbox"
                checked={selectedYears.length === uniqueYears.length}
                onChange={onToggleSelectAll}
                className="accent-lime-400"
              />
              <span>전체 선택</span>
            </label>
            <div className="max-h-40 overflow-y-auto">
              {uniqueYears.map((y) => {
                const hex = yearColorMap[y].toCssHexString();
                return (
                  <label
                    key={y}
                    className="flex items-center space-x-2 text-white py-1 px-2 hover:bg-white/10 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(y)}
                      onChange={() => onToggleYear(y)}
                      className="accent-lime-400"
                    />
                    <span
                      style={{
                        background: hex,
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                      }}
                    />
                    <span>{y}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
