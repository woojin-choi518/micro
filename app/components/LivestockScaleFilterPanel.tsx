//components/LivestockScaleFilterPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { scaleRanges } from '@/app/lib/livestockScaleRanges';

interface Props {
  onChange: (
    group: string,
    range: { min: number; max: number | null }
  ) => void;
}

export default function LivestockScaleFilterPanel({ onChange }: Props) {
  const groups = Object.keys(scaleRanges);

  // 각 그룹별 [minIdx, maxIdx]
  const [rangeMap, setRangeMap] = useState<
    Record<string, [number, number]>
  >(
    groups.reduce((acc, g) => {
      const len = scaleRanges[g].length;
      acc[g] = [0, len - 1];
      return acc;
    }, {} as Record<string, [number, number]>)
  );

  // mount 시 전체 범위로 초기 onChange
  useEffect(() => {
    groups.forEach((g) => {
      const [minIdx, maxIdx] = rangeMap[g];
      const rs = scaleRanges[g];
      onChange(g, { min: rs[minIdx].min, max: rs[maxIdx].max });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (group: string, vals: [number, number]) => {
    setRangeMap((prev) => ({ ...prev, [group]: vals }));
    const rs = scaleRanges[group];
    onChange(group, { min: rs[vals[0]].min, max: rs[vals[1]].max });
  };

  return (
    <div className="bg-gradient-to-br from-teal-500/20 to-blue-500/20 backdrop-blur-md border-2 border-teal-300 rounded-xl shadow-lg p-4 w-72 sm:w-80 max-w-full space-y-6">
      <div className="font-semibold text-white text-lg tracking-wide">축사 규모 필터</div>

      {groups.map((group) => {
        const rs = scaleRanges[group];
        const [minIdx, maxIdx] = rangeMap[group];

        return (
          <div key={group} className="space-y-3">
            <div className="font-medium text-white text-sm">{group}</div>

            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-10"
              min={0}
              max={rs.length - 1}
              step={1}
              value={[minIdx, maxIdx]}
              onValueChange={(v) => handleChange(group, [v[0], v[1]])}
            >
              <Slider.Track className="bg-gray-200 relative flex-1 h-1.5 rounded-full">
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

            <div className="flex justify-between text-xs text-teal-100 px-1">
              {rs.map((r) => (
                <span key={r.label} className="font-pretendard">
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}