'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useEffect, useState } from 'react';
import { groupSmallCategories } from '@/app/lib/groupSmallCategories';

const COLORS = [
  '#FF6F61', // 짙은 초록 (그라데이션 시작)
  '#6B7280', // 중간 초록
  '#34D399', // 밝은 초록
  '#60A5FA', // 연한 초록
  '#FBBF24', // 매우 연한 초록 (그라데이션 끝)
  '#A78BFA'  // 회색 (유지)
];

export default function LivestockPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 480);
    }
  }, []);

  const outerRadius = isMobile ? 70 : 90;

  const groupedData = groupSmallCategories(data, 0.03); // ✅ 여기서 기타 묶기 적용

  return (
    <div className="w-full h-[260px] sm:h-[320px] px-2">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={groupedData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
            innerRadius={40}
            fill="#8884d8"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(1)}%)`
            }
            isAnimationActive
            animationDuration={800}
          >
            {groupedData.map((_, i) => (
              <Cell
                key={`cell-${i}`}
                fill={COLORS[i % COLORS.length]}
                style={{ transition: 'all 0.3s ease' }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '8px',
              border: '1px solid #45B7D1',
            }}
            itemStyle={{ color: '#333' }}
            formatter={(value: number) => `${value} 농가`}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              fontSize: '12px',
              fontWeight: 600,
              marginTop: 8,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
