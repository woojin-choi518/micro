'use client'

import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, ResponsiveContainer, Treemap
} from 'recharts'
import { useMemo, useState, useRef, useEffect } from 'react'
import { ASVCount } from '@/app/lib/types'
import { FaQuestionCircle } from 'react-icons/fa'

interface ASVChartProps {
  data: ASVCount[]
}

const PIE_COLORS = ['#2E7D32', '#43A047', '#66BB6A', '#81C784', '#A5D6A7']
const STACK_COLORS = ['#2E7D32', '#43A047', '#FFA726', '#42A5F5', '#AB47BC', '#FFCA28', '#EF5350']
const TREEMAP_COLORS = ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#388E3C', '#2E7D32']

function ChartHeader({ title, explanation }: { title: string; explanation: string }) {
  const [open, setOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [open])

  return (
    <div className="flex items-center justify-between mb-2 relative">
      <h3 className="text-lg font-semibold text-green-800">{title}</h3>
      <div className="relative" ref={tooltipRef}>
        <FaQuestionCircle
          className="text-green-600 cursor-pointer hover:text-green-800"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((prev) => !prev)
          }}
        />
        {open && (
          <div className="absolute top-1 left-full ml-4 w-64 text-sm p-2 bg-white border border-green-200 rounded shadow-md z-10">
            {explanation}
          </div>
        )}
      </div>
    </div>
  )
}

interface TreemapTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      name: string
      size: number
    }
  }>
}

function CustomTreemapTooltip({ active, payload }: TreemapTooltipProps) {
  if (active && payload && payload.length) {
    const { name, size } = payload[0].payload
    return (
      <div className="bg-white p-2 border rounded shadow text-sm text-gray-800">
        <strong>{name}</strong><br />
        출현 수: {size}
      </div>
    )
  }
  return null
}

export default function ASVProfileCharts({ data }: ASVChartProps) {
  const top10 = data.slice(0, 10)

  const chartData = useMemo(() =>
    top10.map(asv => ({ name: asv.name, value: asv.count })), [top10])

  const stackedData = useMemo(() => {
    const features = new Set<string>()
    top10.forEach(asv => Object.keys(asv.features || {}).forEach(f => features.add(f)))
    return top10.map(asv => {
      const row: Record<string, number | string | undefined> = { name: asv.name }
      features.forEach(f => {
        const value = asv.features?.[f]
        row[f] = value !== undefined ? value : 0
      })
      return row
    })
  }, [top10])

  const featureKeys = useMemo(() => {
    const keys = new Set<string>()
    top10.forEach(asv => Object.keys(asv.features || {}).forEach(k => keys.add(k)))
    return Array.from(keys)
  }, [top10])

  const treemapData = useMemo(() =>
    top10.map((asv, i) => ({
      name: asv.name,
      size: asv.count,
      fill: TREEMAP_COLORS[i % TREEMAP_COLORS.length]
    })), [top10])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {/* Pie Chart */}
      <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <ChartHeader
          title="ASV 출현 분포 (파이차트)"
          explanation="ASV의 전체 출현 비율을 파이 차트로 나타냅니다."
        />
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} dataKey="value" outerRadius={100} label={({ name }) => name}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <ChartHeader
          title="ASV 출현 빈도 (바차트)"
          explanation="ASV가 얼마나 자주 나타났는지를 막대 차트로 표현합니다."
        />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#2E7D32" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stacked Bar Chart */}
      <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 col-span-2">
        <ChartHeader
          title="환경 특징별 ASV 분포 (누적형)"
          explanation="환경 조건별로 나타난 ASV 빈도를 누적 막대로 시각화합니다."
        />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stackedData}>
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip />
            {featureKeys.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="a" fill={STACK_COLORS[i % STACK_COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Treemap Chart */}
      <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 col-span-2">
        <ChartHeader
          title="계통 분포 트리맵 (Phylum/Genus 중심)"
          explanation="계통적 분류에 따라 ASV를 트리맵으로 시각화합니다."
        />
        <ResponsiveContainer width="100%" height={350}>
          <Treemap
            data={treemapData}
            dataKey="size"
            nameKey="name"
            stroke="#fff"
            animationDuration={500}
          >
          </Treemap>
        </ResponsiveContainer>
        <CustomTreemapTooltip />
      </div>
    </div>
  )
}
