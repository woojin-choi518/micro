'use client';

import React, { useState, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { scaleRanges } from '@/app/lib/livestockScaleRanges';

interface Props {
  livestockTypes: string[];
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  onToggleAllTypes: () => void;
  allTypesSelected: boolean;
  onScaleChange: (
    group: string,
    range: { min: number; max: number | null }
  ) => void;
}

export default function LivestockCombinedFilterPanel({
  livestockTypes,
  selectedTypes,
  onToggleType,
  onToggleAllTypes,
  allTypesSelected,
  onScaleChange,
}: Props) {
  const groups = Object.keys(scaleRanges);
  const [activeGroup, setActiveGroup] = useState(groups[0] || '');
  const [rangeMap, setRangeMap] = useState<Record<string, [number, number]>>(() =>
    groups.reduce((acc, g) => {
      const len = scaleRanges[g].length;
      acc[g] = [0, len - 1];
      return acc;
    }, {} as Record<string, [number, number]>)
  );
  const [isOpen, setIsOpen] = useState(false);

  // mount 시 초기 onScaleChange 호출
  useEffect(() => {
    groups.forEach((g) => {
      const [minIdx, maxIdx] = rangeMap[g];
      const rs = scaleRanges[g];
      onScaleChange(g, { min: rs[minIdx].min, max: rs[maxIdx].max });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (group: string, vals: [number, number]) => {
    setRangeMap((prev) => {
      const next = { ...prev, [group]: vals };
      const rs = scaleRanges[group];
      onScaleChange(group, {
        min: rs[vals[0]].min,
        max: rs[vals[1]].max,
      });
      return next;
    });
  };

  // 전체 슬라이더 초기화
  const resetAll = () => {
    const initialMap = groups.reduce((acc, g) => {
      const len = scaleRanges[g].length;
      acc[g] = [0, len - 1];
      return acc;
    }, {} as Record<string, [number, number]>);
    setRangeMap(initialMap);
    groups.forEach((g) => {
      const [minIdx, maxIdx] = initialMap[g];
      const rs = scaleRanges[g];
      onScaleChange(g, { min: rs[minIdx].min, max: rs[maxIdx].max });
    });
  };

  const currentRange = rangeMap[activeGroup] || [0, scaleRanges[activeGroup]?.length - 1 || 0];
  const rs = scaleRanges[activeGroup] || [];

  return (
    <div className="fixed top-[70px] left-4 z-40">
      {/* 토글 버튼 */}
      <div
        className="
          bg-gradient-to-r from-teal-500/20 to-blue-500/20
          backdrop-blur-md border-2 border-teal-300
          rounded-full px-4 py-2 flex items-center justify-between
          cursor-pointer select-none shadow-md hover:shadow-lg
          transition-all duration-300
        "
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="flex items-center space-x-2">
          <svg className="h-4 w-4 text-teal-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
          <span className="text-white font-semibold text-xs">
            축종 및 규모 필터
          </span>
        </div>
        <span className="text-white text-lg leading-none transition-transform duration-300">
          {isOpen ? '▾' : '▸'}
        </span>
      </div>

      {isOpen && (
        <div
          className="
            mt-2 bg-gradient-to-br from-teal-900/10 to-blue-900/10
            backdrop-blur-md border-2 border-teal-300
            rounded-xl shadow-lg p-3
            w-72 h-auto max-h-[50vh] overflow-y-auto
            transition-all duration-300
          "
        >
          {/* 1) 🐷 가축 종 필터 */}
          <div className="mb-4">
            <h3 className="text-white text-sm font-bold mb-2 font-sans">
              🐷 가축 종 선택
            </h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <label className="flex items-center space-x-2 text-white font-sans hover:bg-teal-500/20 rounded-full px-2 py-0.5 text-xs">
                <input
                  type="checkbox"
                  checked={allTypesSelected}
                  onChange={onToggleAllTypes}
                  className="accent-teal-400 focus:ring-2 focus:ring-teal-300 h-4 w-4"
                />
                <span>전체</span>
              </label>
              {livestockTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center space-x-2 text-white font-sans hover:bg-teal-500/20 rounded-full px-2 py-0.5 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => onToggleType(type)}
                    className="accent-teal-400 focus:ring-2 focus:ring-teal-300 h-4 w-4"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2) 📏 규모 필터 + 초기화 버튼 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white text-sm font-bold font-sans">
                📏 축사 규모 선택
              </h3>
              <button
                onClick={resetAll}
                className="text-xs text-teal-200 hover:text-teal-100 border border-teal-300 rounded-full px-2 py-0.5 hover:bg-teal-500/20"
              >
                초기화
              </button>
            </div>
            {/* 그룹 선택 탭 */}
            <div className="flex space-x-2 mb-2 overflow-x-auto pb-1">
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`px-2 py-1 text-xs font-medium rounded-full ${activeGroup === group ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white' : 'bg-teal-900/20 text-teal-200 hover:bg-teal-900/30'}`}
                >
                  {group}
                </button>
              ))}
            </div>
            {/* 슬라이더 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gradient-to-r from-teal-900/20 to-blue-900/20 px-2 py-1 rounded-full">
                <span className="text-teal-100 text-xs font-bold uppercase">
                  {activeGroup}
                </span>
              </div>
              <Slider.Root
                className="relative flex items-center w-full h-8 select-none touch-none"
                min={0}
                max={rs.length - 1}
                step={1}
                value={currentRange}
                onValueChange={(v) => handleChange(activeGroup, v as [number, number])}
              >
                <Slider.Track className="bg-gray-200 relative flex-1 h-2 rounded-full">
                  <Slider.Range className="absolute bg-gradient-to-r from-teal-400 to-blue-500 h-full rounded-full transition-all duration-300" />
                </Slider.Track>
                <Slider.Thumb
                  className="block w-4 h-4 bg-teal-500 rounded-full shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-300 transition-all duration-200"
                  aria-label="Minimum value"
                />
                <Slider.Thumb
                  className="block w-4 h-4 bg-teal-500 rounded-full shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-300 transition-all duration-200"
                  aria-label="Maximum value"
                />
              </Slider.Root>
              <div className="flex justify-between text-sm text-white font-semibold px-1">
                {rs.map((r) => (
                  <span
                    key={r.label}
                    className="font-sans bg-gradient-to-r from-teal-900/20 to-blue-900/20 px-2 py-1 rounded-full"
                  >
                    {r.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}