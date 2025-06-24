// MicrobePieChart.tsx
'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Microbe } from '@/app/lib/types';

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28', '#FF4444', '#AA88FF', '#66CCFF', '#99CC33'
];

export default function MicrobePieChart({ data }: { data: Microbe[] }) {
  const grouped = data.reduce((acc: Record<string, number>, cur) => {
    acc[cur.organism] = (acc[cur.organism] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(grouped).map(([name, value]) => ({ name, value }));

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            label
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => `${v} samples`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
