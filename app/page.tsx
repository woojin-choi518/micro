'use client'

import { useEffect, useState } from 'react'
import Particles from 'react-tsparticles'
import type { ISourceOptions } from 'tsparticles-engine'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import Skeleton from './components/Skeleton'
import { Sample } from '@/app/lib/types'
import Image from 'next/image'
import { Moon, Sun } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, EffectCoverflow } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-coverflow'
import { Urbanist } from 'next/font/google'

const urbanist = Urbanist({ subsets: ['latin'], weight: ['400', '600', '800'] })

const features = [
  {
    title: '간편한 샘플 검색',
    desc: 'EMP의 미생물 샘플을 환경, 위치, 유형 등 다양한 조건으로 빠르게 검색할 수 있습니다.',
    image: '/images/sample1.jpg',
  },
  {
    title: '지역별로 미생물 분포 시각화',
    desc: '지도 기반으로 지역별 미생물의의 분포를 한 눈에 파악할 수 있습니다.',
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
    image: '/images/graphDB.png',
  },
  {
    title: '농산물 생산량과 미생물 연관성 탐색',
    desc: '지역 농산물 데이터와 미생물 데이터를 함께 분석하여 새로운 인사이트를 얻어보세요.',
    image: '/images/agricul.png',
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

  if (loading) return <Skeleton darkMode={darkMode} />

  return (
    <main className={urbanist.className + ' ' + (darkMode ? 'dark' : '')}>
      <Particles options={options} className="absolute inset-0 -z-10" />

      {/* Hero Section */}
      <section className="relative flex flex-col justify-center items-center h-screen text-center bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: "url('/images/dna.jpg')" }}>

        <div className="bg-black/40 backdrop-blur-md p-8 rounded-xl shadow-2xl max-w-xl text-white">
          <h1 className="text-5xl font-extrabold mb-4 drop-shadow-md">Microbiome Map Project</h1>
          <p className="text-xl text-emerald-200 mb-6 drop-shadow">Explore the World of Microorganisms</p>

          <div className="flex justify-center items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-white/10 transition">
              {darkMode ? <Sun className="text-yellow-300" /> : <Moon className="text-white" />}
            </button>

            <Link
              href="/map"
              className="bg-emerald-500 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:bg-emerald-600 hover:shadow-lg transition"
            >
              Explore the Map
            </Link>
          </div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mt-8 text-emerald-200"
          >
            ↓ Scroll Down ↓
          </motion.div>
        </div>
      </section>

      {/* Feature Carousel Section */}
      <section className="py-20">
        <Swiper
          modules={[Pagination, Autoplay, EffectCoverflow]}
          slidesPerView={1.2}
          centeredSlides={true}
          grabCursor={true}
          spaceBetween={20}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          effect="coverflow"
          coverflowEffect={{ rotate: 0, stretch: 0, depth: 100, modifier: 2.5, slideShadows: false }}
          className="w-full max-w-4xl px-4"
        >
          {features.map((feature, index) => (
            <SwiperSlide key={index}>
              {({ isActive }) => (
                <div
                  className={`rounded-xl transition-all duration-300 shadow-lg p-6 bg-white dark:bg-gray-800 w-full h-[430px] flex flex-col items-center justify-center ${
                    isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-40'
                  }`}
                >
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    width={600}
                    height={300}
                    className="rounded-xl object-cover w-full h-64"
                  />
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Simple Map */}
      <section className="h-screen flex flex-col justify-center items-center px-4">
        <h2 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-4">
          Sample Map Demo
        </h2>
        <SimpleMap samples={samples} />
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">
        Data Source: Earth Microbiome Project | Built with ♥
      </footer>
    </main>
  )
}
