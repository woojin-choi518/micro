// components/ViolinChartPanel.tsx
'use client';

import Plot from 'react-plotly.js';
import type { Data, Layout, Config } from 'plotly.js';

export interface ViolinDatum {
  location: string;
  values: number[];
}

// 사진 예시에서 쓴 통계 그룹 문자 매핑 (예시)
const letterMap: Record<string, string> = {
  LN:  'd', JL:  'c', SX:  'b', SD:  'c',
  NM:  'h', HB:  'ef', GS:  'a', XJ:  'a',
  JX:  'e', MDJ: 'd', XZ:  'g', DQ:  'fg',
  HLJ: 'e',
};

interface ViolinChartPanelProps {
  data: ViolinDatum[];
  selectedRegion: string | null;
}

export default function ViolinChartPanel({
  data,
  selectedRegion,
}: ViolinChartPanelProps) {

  //차트 폭 계산
  const chartWidth = data.length * 35;
  const chartHeight = 300;

  // 1) 파스텔 팔레트
  const palette = [
    '#A6CEE3','#1F78B4','#B2DF8A','#33A02C','#FB9A99',
    '#E31A1C','#FDBF6F','#FF7F00','#CAB2D6','#6A3D9A',
    '#FFFF99','#B15928','#8DD3C7',
  ];

  // 2) traces (vertical violins)
  const traces: Data[] = data.map((d, i) => {
    const x = Array(d.values.length).fill(d.location);
    const y = d.values;
    const isSel = d.location === selectedRegion;
    return {
      type: 'violin',
      orientation: 'v',
      x,
      y,
      name: d.location,
      width: 0.6,
      scalegroup: 'one',
      side: 'both',
      box: { visible: true, fillcolor: 'rgba(255,255,255,0.8)' },
      meanline: { visible: true, width: 2, color: '#333' },
      marker: {
        color: isSel ? '#FF4500' : palette[i % palette.length],
        opacity: isSel ? 1 : 0.8,
      },
      line: {
        color: isSel ? '#FF4500' : '#B2DF8A',
        width: isSel ? 2 : 1,
      },
      hoverinfo: 'y+name',
    };
  });

  // 3) annotations: 그룹 문자 표시
  const annos = data.map((d) => ({
    x: d.location,
    y: Math.max(...d.values) + 5,
    text: letterMap[d.location] || '',
    showarrow: false,
    font: { size: 12, color: '#333' },
    xanchor: 'center' as const,
  }));

  // 4) layout: 사진 스타일 그대로
  const layout: Partial<Layout> = {
    margin: { l: 30, r: 70, t: 30, b: 70 },
    height: chartHeight,
    width: chartWidth,
    autosize: false,
    paper_bgcolor: 'rgba(240,240,240,0.0)',
    plot_bgcolor: 'white',
    xaxis: {
      title: { text: '생산지', font: { size: 14, weight:700, color:"white" } },
      tickangle: -45,
      tickfont: { size: 11, weight:700, color:"white" },
      zeroline: false,
      showgrid: false,
    },
    yaxis: {
      title: { text: '대두 생산량 (g)', font: { size: 14, weight:700, color:"white" } },
      automargin: true,
      tickfont: { size: 11, weight:700, color:"white" },
      gridcolor: '#DDD',
      zeroline: false,
    },
    showlegend: false,
    annotations: annos,
    dragmode: 'zoom',  // 드래그는 항상 확대만
  };

  // 5) config: select/​lasso 제거 + 확대·축소·리셋 버튼 추가
  const config: Partial<Config> = {
    displayModeBar: true,
    modeBarButtons: [
      ['zoom2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],[]
    ],
    displaylogo: false,
    responsive: true,
  };
  (config as any).modeBarOrientation = 'v';

  return (
    <div className="relative violin-wrapper">
        <Plot
          data={traces}
          layout={{ ...layout, autosize: true }}
          config={config}
          useResizeHandler={true}
          style={{ minWidth: `${chartWidth}px`, display: 'block', margin: '0 auto', height:'100%' }}
        />
    </div>
    
  );
}
