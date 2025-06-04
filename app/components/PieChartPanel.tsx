'use client';

import dynamic from 'next/dynamic';
import { Microbe } from '@/app/lib/types';

// PieChart 컴포넌트를 동적으로 import (SSR 비활성화)
const PieChart = dynamic(() => import('@/app/components/MicrobePieChart'), { ssr: false });

interface PieChartPanelProps {
  data: Microbe[];
  isOpen: boolean;
  onToggleOpen: () => void;
}

/**
 * 우측 하단 PieChart 토글 패널:
 * - 헤더(타이틀 + 토글 버튼)
 * - 본문(PieChart) → isOpen === true일 때만 렌더링
 */
export default function PieChartPanel({
  data,
  isOpen,
  onToggleOpen,
}: PieChartPanelProps) {
  return (
    <div className="fixed bottom-6 right-2 z-30">
      {/* 1) 패널 헤더 (토글 버튼) */}
      <div
        className="
          bg-white/20 backdrop-blur-md
          border border-white/40
          rounded-full
          px-5 py-3
          flex items-center justify-between
          cursor-pointer select-none
          shadow-lg
        "
        onClick={onToggleOpen}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xl text-white leading-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* chart-pie 아이콘 예시 */}
              <path d="M11 2.052a9.001 9.001 0 0 1 9 9c0 4.97-4.03 9-9 9a9.001 9.001 0 0 1-9-9 9.001 9.001 0 0 1 9-9zm0 2a7 7 0 0 0-7 7c0 3.866 3.134 7 7 7 3.866 0 7-3.134 7-7a7 7 0 0 0-7-7zm1 1v6h6.002a7.001 7.001 0 0 0-6.002-6z" />
            </svg>
          </span>
          <span className="text-white font-semibold text-sm">Organism Distribution</span>
        </div>
        <span className="text-white text-xl leading-none">{isOpen ? '▾' : '▸'}</span>
      </div>

      {/* 2) 패널 본문 (isOpen === true일 때만 렌더링) */}
      {isOpen && (
        <div
          className="
            mt-2
            bg-white/20 backdrop-blur-md
            border border-white/40
            rounded-2xl
            shadow-lg
            p-4
            w-[350px]
            max-h-[50vh] overflow-y-auto
          "
        >
          <PieChart data={data} />
        </div>
      )}
    </div>
  );
}
