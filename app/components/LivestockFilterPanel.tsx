//components/LivestockFilterPanel.tsx
'use client';

import React, { useState } from 'react';

interface Props {
  livestockTypes: string[];
  selected: string[];
  onToggle: (type: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
}

export default function LivestockFilterPanel({
  livestockTypes,
  selected,
  onToggle,
  onToggleAll,
  allSelected,
}: Props) {
  // 패널 열림/닫힘 상태 관리
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  return (
    <div className="fixed top-[70px] left-4 z-40">
      {/* 1) 패널 헤더 (토글) */}
      <div
        className="
          bg-gradient-to-r from-teal-500/20 to-blue-500/20
          backdrop-blur-md
          border-2 border-teal-300
          rounded-full
          px-5 py-3
          flex items-center justify-between
          cursor-pointer select-none
          shadow-md hover:shadow-xl
          transition-all duration-300
        "
        onClick={toggleOpen}
      >
        <div className="flex items-center space-x-3">
          <svg className="h-5 w-5 text-teal-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
          <span className="text-white font-bold font-sans text-m tracking-wide">
            축종 필터링
          </span>
        </div>
        <span className="text-white text-xl leading-none transition-transform duration-300">
          {isOpen ? '▾' : '▸'}
        </span>
      </div>

      {/* 2) 패널 본문 (펼쳐졌을 때만 렌더링) */}
      {isOpen && (
        <div
          className="
            mt-2
            bg-gradient-to-br from-teal-900/10 to-blue-900/10
            backdrop-blur-md
            border-2 border-teal-300
            rounded-2xl
            shadow-lg
            p-4
            max-w-[300px] w-full
            max-h-[60vh]
            overflow-y-auto
            space-y-2
            transition-all duration-300 ease-in-out
          "
        >
          <div>
            <h3 className="text-white text-m font-bold mb-2 font-sans">🐷 가축 종 선택</h3>
            <div className="space-y-1">
              <label
                className="flex items-center space-x-2 text-m text-white font-bold  font-sans hover:bg-teal-500/20 rounded-md px-2 py-1"
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="accent-teal-400 focus:ring-2 focus:ring-teal-300"
                />
                <span>전체 선택</span>
              </label>

              {livestockTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center space-x-2 text-m text-white font-bold font-sans hover:bg-teal-500/20 rounded-md px-2 py-1"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(type)}
                    onChange={() => onToggle(type)}
                    className="accent-teal-400 focus:ring-2 focus:ring-teal-300"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}