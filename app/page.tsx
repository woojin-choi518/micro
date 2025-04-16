'use client'

import { useEffect, useState } from 'react'
import Particles from 'react-tsparticles'
import type { ISourceOptions } from 'tsparticles-engine'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import Skeleton from './components/Skeleton'
import { Sample } from '@/app/lib/types'
import Image from 'next/image'

const features = [
  {
    title: '여러 특징으로 간편하게 샘플 검색',
    desc: '미생물 샘플을 환경, 위치, 유형 등 다양한 조건으로 빠르게 검색할 수 있습니다.',
    image: '/images/sample1.jpg', 
  },
  {
    title: '지역별로 미생물 분포 시각화',
    desc: '지도 기반으로 지역별 미생물 분포를 한 눈에 파악할 수 있습니다.',
    image: '/images/sample1.jpg',
  },
  {
    title: '사용자 데이터셋 업로드 시각화',
    desc: 'CSV, JSON 등 개인 데이터를 업로드하여 시각화할 수 있습니다.',
    image: '/images/sample2.jpg',
  },
  {
    title: '그래프 데이터베이스 기반 분석',
    desc: 'Neo4j 기반의 그래프 데이터베이스를 활용하여 관계 기반 데이터 분석이 가능합니다.',
    image: '/images/sample3.jpg',
  },
  {
    title: '농산물 생산량과 미생물 연관성 탐색',
    desc: '지역 농산물 데이터와 미생물 데이터를 함께 분석하여 새로운 인사이트를 얻어보세요.',
    image: '/images/sample1.jpg',
  },
]

const SimpleMap = dynamic(() => import('./components/SimpleMap'), { ssr: false })

export default function IntroPage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    fetch('/api/samples')
      .then((res) => res.json())
      .then((data) => {
        setSamples(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching samples:', error)
        setLoading(false)
      })
  }, [])

  const options: ISourceOptions = {
    background: { color: { value: darkMode ? '#0f172a' : '#f0fdf4' } },
    particles: {
      color: { value: '#4ade80' },
      links: { enable: true, color: '#4ade80', distance: 150, opacity: 0.3, width: 1 },
      move: { enable: true, speed: 1 },
      number: { value: 60, density: { enable: true, area: 800 } },
      size: { value: { min: 1, max: 3 } },
    },
  }

  if (loading) {
    return <Skeleton darkMode={darkMode} />
  }

  return (
    <main className={clsx('min-h-screen overflow-x-hidden', darkMode && 'dark')}>
      <Particles options={options} className="absolute inset-0 -z-10" />

      {/* Hero */}
      <section className="flex flex-col justify-center items-center h-screen text-center">
        <h1 className="text-5xl font-bold text-green-800 dark:text-green-300 mb-4">
          Microbiome Map Project
        </h1>
        <p className="text-xl text-green-600 dark:text-green-800 mb-6">
          Explore the World of Microorganisms
        </p>

        <div className="flex gap-4 mb-10">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-sm border px-4 py-2 rounded-xl hover:bg-green-400 dark:hover:bg-gray-800 transition"
          >
            Toggle Dark Mode
          </button>

          <Link
            href="/map"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow"
          >
            Explore the Map
          </Link>
        </div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <span className="text-green-500 text-2xl">↓ Scroll Down ↓</span>
        </motion.div>
      </section>

      {/* Feature Section */}
      <section className="space-y-[40vh] px-6">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            className={clsx(
              "flex flex-col md:flex-row items-center justify-center gap-10 max-w-5xl mx-auto group cursor-pointer",
              idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
            )}
            initial={{ opacity: 0, x: idx % 2 === 0 ? 100 : -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            whileHover={{ scale: 1.03 }} // Hover 애니메이션
          >
            {/* 이미지 */}
            <div className="w-[500px] h-[300px] rounded-lg overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-300">
              <Image
                src={feature.image}
                alt={feature.title}
                width={500}
                height={300}
                className="object-cover w-full h-full"
              />
            </div>

            {/* 설명 */}
            <div className="max-w-md text-center md:text-left">
              <h2 className="text-3xl font-bold text-green-700 dark:text-green-300 mb-4">
                {feature.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </section>

      

      {/* Simple Map */}
      <section className="h-screen flex flex-col justify-center items-center px-6">
        <h2 className="text-3xl font-bold text-green-700 dark:text-green-300 mb-4">
          Sample Map Demo
        </h2>
        <SimpleMap samples={samples} />
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        Data Source: Earth Microbiome Project
      </footer>
    </main>
  )
}
