'use client';

import { useMemo } from 'react';
import { Color } from 'cesium';

interface FilterPanelProps {
  uniqueYears: number[];
  selectedYears: number[];
  onToggleYear: (year: number) => void;
  onToggleSelectAll: () => void;
  minYear: number;
  maxYear: number;
  currentYear: number | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onChangeSlider: (year: number) => void;
  uniqueOrganisms: string[];
  organismFilter: string;
  onOrganismFilterChange: (value: string) => void;
  sequenceFilter: string;
  onSequenceFilterChange: (value: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

/**
 * 왼쪽 필터링 패널:
 * - 연도 애니메이션 슬라이더 + Play/Pause
 * - Organism 드롭다운+검색
 * - Sequence 검색
 * - Filter by Year 체크박스 멀티셀렉트
 * - 토글 버튼을 눌러 “접기/펼치기” 가능
 */
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
  isOpen,
  onToggleOpen,
}: FilterPanelProps) {
  // 연도별 색상 매핑을 계산 (useMemo)
  const yearColorMap = useMemo(() => {
    const map: Record<number, Color> = {};
    uniqueYears.forEach((year, idx) => {
      const N = uniqueYears.length || 1;
      const hue = (idx / N) * 360;
      map[year] = Color.fromHsl(hue / 360, 0.7, 0.5);
    });
    return map;
  }, [uniqueYears]);

  return (
    <div className="fixed top-[70px] left-4 z-40">
      {/* 1) 패널 헤더 (토글) */}
      <div
        className="
          bg-white/20 backdrop-blur-md
          border border-white/40
          rounded-full
          px-4 py-2
          flex items-center justify-between
          cursor-pointer select-none
          shadow-lg
        "
        onClick={onToggleOpen}
      >
        <h2 className="text-sm font-semibold text-white">필터링 패널</h2>
        <span className="text-white text-xl leading-none">
          {isOpen ? '▾' : '▸'}
        </span>
      </div>

      {/* 2) 패널 본문 (펼쳐졌을 때만 렌더링) */}
      {isOpen && (
        <div
          className="
            mt-2
            bg-white/20 backdrop-blur-md
            border border-white/40
            rounded-2xl
            shadow-lg
            p-4
            w-60
            max-h-[90vh] overflow-y-auto
            space-y-6
          "
        >
          {/* ── 2-1) 연도 애니메이션 슬라이더 + Play/Pause ── */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">
              연도별 변화 시뮬레이션
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs">{minYear}</span>
              <input
                type="range"
                min={minYear}
                max={maxYear}
                value={currentYear ?? minYear}
                onChange={(e) => onChangeSlider(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-white text-xs">{maxYear}</span>
            </div>
            <button
              onClick={onPlayPause}
              className={`
                mt-2 w-full text-sm font-medium rounded
                ${isPlaying ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}
              `}
            >
              {isPlaying ? 'Pause ⏸️' : 'Play ▶️'}
            </button>
          </div>

          {/* ── 2-2) Organism 드롭다운 + 검색 ── */}
          <div>
            <label className="block text-white text-xs mb-1">🦠 Organism 선택</label>
            <select
              value={organismFilter}
              onChange={(e) => onOrganismFilterChange(e.target.value)}
              className="w-full p-1 text-gray-800 rounded-md text-sm"
            >
              <option value="">── 전체 ──</option>
              {uniqueOrganisms.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
            <label className="block text-white text-xs mt-3 mb-1">🔎 Organism 검색</label>
            <input
              type="text"
              placeholder="Enter organism name..."
              value={organismFilter}
              onChange={(e) => onOrganismFilterChange(e.target.value)}
              className="w-full p-1 text-gray-800 rounded-md text-sm"
            />
          </div>

          {/* ── 2-3) Sequence 검색 ── */}
          <div>
            <label className="block text-white text-xs mb-1">🔎 Sequence 검색</label>
            <input
              type="text"
              placeholder="Enter sequence substring..."
              value={sequenceFilter}
              onChange={(e) => onSequenceFilterChange(e.target.value)}
              className="w-full p-1 text-gray-800 rounded-md text-sm"
            />
          </div>

          {/* ── 2-4) Filter by Year (체크박스 멀티셀렉트) ── */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-white">📅 Filter by Year</h3>
            <div className="mb-2">
              <label className="flex items-center space-x-2 text-white text-sm hover:bg-white/10 rounded-md px-2 py-1">
                <input
                  type="checkbox"
                  checked={selectedYears.length === uniqueYears.length}
                  onChange={onToggleSelectAll}
                  className="accent-lime-400 focus:ring-2 focus:ring-lime-300"
                />
                <span>전체 선택</span>
              </label>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto px-1">
              {uniqueYears.map((year) => {
                const cesiumColor = yearColorMap[year] || Color.GRAY;
                const cssHex = cesiumColor.toCssHexString();

                return (
                  <label
                    key={year}
                    className="flex items-center space-x-2 text-sm text-white hover:bg-white/10 rounded-md px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      value={year}
                      checked={selectedYears.includes(year)}
                      onChange={() => onToggleYear(year)}
                      className="accent-lime-400 focus:ring-2 focus:ring-lime-300"
                    />
                    <span
                      style={{
                        backgroundColor: cssHex,
                        width: '12px',
                        height: '12px',
                        borderRadius: '2px',
                        display: 'inline-block',
                      }}
                    />
                    <span>{year}</span>
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
