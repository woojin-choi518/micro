'use client'

import { ResponsivePie } from '@nivo/pie'
import { ResponsiveBar } from '@nivo/bar'
import { ResponsiveTreeMap } from '@nivo/treemap'
import { useMemo, useState, useRef, useEffect } from 'react'
import { FaQuestionCircle } from 'react-icons/fa'
import { ASVCount } from '@/app/lib/types'

interface ASVChartProps {
  data: ASVCount[]
}

const PIE_COLORS = ['#2E7D32', '#43A047', '#66BB6A', '#81C784', '#A5D6A7']
const TREEMAP_COLORS = ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#388E3C', '#2E7D32']
const nivoTheme = {
  tooltip: {
    container: {
      background: '#ffffff',
      color: '#1B5E20',
      fontSize: 14,
      fontWeight: 600,
      borderRadius: '4px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      padding: '8px 12px',
    },
  },
}


function ChartHeader({ title, explanation }: { title: string; explanation: string }) {
  const [open, setOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="flex items-center justify-between mb-2 relative">
      <h3 className="text-lg font-semibold text-green-800">{title}</h3>
      <div className="relative" ref={tooltipRef}>
        <FaQuestionCircle
          className="text-green-600 cursor-pointer hover:text-black-800"
          onClick={(e) => {
            e.stopPropagation()
            setOpen(prev => !prev)
          }}
        />
        {open && (
          <div className="absolute top-1 right-full ml-4 w-60 text-sm p-3 rounded-md z-10 bg-white text-gray-600 border border-gray-300 shadow-lg">
            {explanation}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ASVProfileCharts({ data }: ASVChartProps) {
  const top10 = data.slice(0, 10)

  const pieData = useMemo(() => top10.map((asv, i) => ({
    id: asv.name,
    label: asv.name,
    value: asv.count,
    color: PIE_COLORS[i % PIE_COLORS.length]
  })), [top10])

  const barData = useMemo(() =>
    top10.map((asv) => ({
      name: asv.name ?? 'Unknown',
      value: asv.count
    })), [top10])

  const stackedData = useMemo(() => {
    const features = new Set<string>()
    top10.forEach(asv => Object.keys(asv.features || {}).forEach(f => features.add(f)))
    return top10.map(asv => {
      const row: Record<string, number | string> = { name: asv.name ?? 'Unknown' }
      features.forEach(f => row[f] = asv.features?.[f] ?? 0)
      return row
    })
  }, [top10])

  const keys = useMemo(() => {
    const all = new Set<string>()
    top10.forEach(asv => Object.keys(asv.features).forEach(k => all.add(k)))
    return Array.from(all)
  }, [top10])

  const treemapData = useMemo(() => ({
    name: 'root',
    children: top10.map((asv, i) => ({
      name: asv.name ?? 'Unknown',
      value: asv.count,
      color: TREEMAP_COLORS[i % TREEMAP_COLORS.length]
    }))
  }), [top10])

  return (
    <div className="grid grid-cols-1 gap-6 p-4">
  {/* Pie Chart */}
  <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
    <ChartHeader title="ASV 출현 분포 (파이차트)" explanation="ASV의 전체 출현 비율을 파이 차트로 나타냅니다." />
    <div className="min-w-[450px] h-[300px]">
      <ResponsivePie
        data={pieData}
        margin={{ top: 20, right: 80, bottom: 40, left: 80 }}
        innerRadius={0.4}
        padAngle={1.8}
        cornerRadius={3}
        colors={({ data }) => data.color}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#333"
        arcLinkLabelsThickness={2}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        animate={true}
        motionConfig="gentle"
        transitionMode='middleAngle'
        activeOuterRadiusOffset={5}
        theme={nivoTheme}
      />
    </div>
  </div>

  {/* Bar Chart */}
  <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
    <ChartHeader title="ASV 출현 빈도 (바차트)" explanation="ASV가 얼마나 자주 나타났는지를 막대 차트로 표현합니다." />
    <div className="min-w-[450px] h-[300px]">
      <ResponsiveBar
        data={barData}
        keys={['value']}
        indexBy="name"
        margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
        padding={0.3}
        colors={{ scheme: 'greens' }}
        axisBottom={{ 
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 15,
        }}
        axisLeft={{ tickSize: 5, tickPadding: 5 }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        animate
        theme={nivoTheme}
      />
    </div>
  </div>

  {/* Stacked Bar Chart */}
  <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
    <ChartHeader title="환경 특징별 ASV 분포 (누적형)" explanation="환경 조건별로 나타난 ASV 빈도를 누적 막대로 시각화합니다." />
    <div className="min-w-[450px] h-[400px]">
      <ResponsiveBar
        data={stackedData}
        keys={keys}
        indexBy="name"
        margin={{ top: 20, right: 30, bottom: 60, left: 50 }}
        padding={0.3}
        groupMode="stacked"
        colors={{ scheme: 'paired' }}
        axisBottom={{ 
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 15,
        }}
        axisLeft={{ tickSize: 5, tickPadding: 5 }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        animate
        theme={nivoTheme}
      />
    </div>
  </div>

  {/* Treemap */}
  <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
    <ChartHeader title="계통 분포 트리맵 (Phylum/Genus 중심)" explanation="계통적 분류에 따라 ASV를 트리맵으로 시각화합니다." />
    <div className="min-w-[450px] h-[400px]">
      <ResponsiveTreeMap
        data={treemapData}
        identity="name"
        value="value"
        innerPadding={4}
        outerPadding={4}
        labelSkipSize={12}
        label={(node) => node.data.name}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.4]] }}
        colors={{ datum: 'data.color' }}
        borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
        animate
        theme={nivoTheme}
      />
    </div>
  </div>
</div>

  )
}
