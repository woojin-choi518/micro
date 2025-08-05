'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import type { ISourceOptions } from 'tsparticles-engine';

// Particles 는 CSR 에서만 로드
const Particles = dynamic(() => import('react-tsparticles'), { ssr: false });

export default function HeroSection() {
  const [darkMode, setDarkMode] = useState(false);

  // 전역 dark 클래스 토글
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const options: ISourceOptions = {
    background: { color: { value: darkMode ? '#1e293b' : '#f0f4f8' } },
    particles: {
      color: { value: '#10b981' },
      links: { enable: true, distance: 200, opacity: 0.2, width: 0.5 },
      move: { enable: true, speed: 0.5 },
      number: { value: 30, density: { enable: true, area: 1000 } },
      size: { value: { min: 1, max: 2 } },
    },
  };

  return (
    <section
      className="relative flex flex-col justify-center items-center w-screen h-screen overflow-hidden
                 bg-cover bg-center"
      style={{ backgroundImage: "url('/images/dna.webp')" }}
    >
      {/* 파티클 배경 */}
      <Particles options={options} className="absolute inset-0 -z-10" />

      {/* 카드 */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="
          relative
          bg-emerald-800/60 backdrop-blur-xl
          p-6 md:p-12
          rounded-2xl md:rounded-3xl
          shadow-2xl
          max-w-full sm:max-w-lg md:max-w-4xl
          mx-4 sm:mx-auto
          text-center text-white
        "
      >
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-extrabold drop-shadow-lg mb-4">
          Microbiome Map Project
        </h1>
        <p className="text-base sm:text-lg md:text-2xl font-light drop-shadow mb-6">
          Explore the World of Microorganisms
        </p>

        {/* 여기에 버튼 둘 다 렌더 */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          {/* 토글 버튼 */}
          <button
            onClick={() => setDarkMode((v) => !v)}
            className="p-2 sm:p-3 rounded-full bg-white/20 hover:bg-white/30 transition"
          >
            {darkMode ? (
              <Sun className="text-yellow-400" size={20} />
            ) : (
              <Moon className="text-white" size={20} />
            )}
          </button>

          {/* Explore 버튼 */}
          <Link
            href="/map"
            className="
              bg-emerald-500 hover:bg-emerald-600
              text-white font-semibold
              px-4 py-2 sm:px-6 sm:py-3
              rounded-lg shadow-md
              flex items-center gap-2
              text-sm sm:text-base
              transition
            "
          >
            <span>🌍</span> Explore the Map
          </Link>
        </div>

        <div className="text-sm sm:text-base drop-shadow">
          ↓ Scroll Down ↓
        </div>
      </motion.div>
    </section>
  );
}
