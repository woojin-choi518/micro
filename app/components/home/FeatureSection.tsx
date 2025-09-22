'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ImageData { src: string; alt: string }
interface FeatureSectionProps {
  title: string;
  subTitle: string;
  description: string;
  image1: ImageData;  // 큰 맵
  image2: ImageData;  // 작은 캡처
}

export default function FeatureSection({
  title, subTitle, description, image1, image2
}: FeatureSectionProps) {
  const [view, setView] = useState<'first' | 'second'>('first');

  return (
    <motion.section
      initial={{ y: 100, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 1 }}
      viewport={{ once: true, margin: '100px' }}
      className="py-16"
    >
      <div className="max-w-6xl mx-auto px-4">

        {/* 모바일 전용 */}
        <div className="md:hidden">
          <div className="text-center mb-6">
            {/* 라이트: 초록 / 다크: 베이지 */}
            <h2 className="text-2xl font-extrabold text-green-600 mb-2 dark:text-[#F5E6C8]">
              {title}
            </h2>
            {/* 라이트: 진회색 / 다크: 흰색 */}
            <p className="whitespace-pre-line text-xl font-extrabold text-gray-700 dark:text-white">
              {subTitle}
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setView('first')}
              className={`px-4 py-2 rounded-lg transition ${
                view === 'first'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-800 dark:bg-[#5a2a1a] dark:text-[#F5E6C8]'
              }`}
            >
              page
            </button>
            <button
              onClick={() => setView('second')}
              className={`px-4 py-2 rounded-lg transition ${
                view === 'second'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-800 dark:bg-[#5a2a1a] dark:text-[#F5E6C8]'
              }`}
            >
              function
            </button>
          </div>

          <div className="mb-6">
            {view === 'first' ? (
              <Image
                src={image1.src}
                alt={image1.alt}
                width={800}
                height={450}
                className="rounded-2xl w-full h-auto shadow-lg object-cover"
              />
            ) : (
              <Image
                src={image2.src}
                alt={image2.alt}
                width={800}
                height={450}
                className="rounded-2xl w-full h-auto shadow-lg object-cover"
              />
            )}
          </div>

          <p className="text-center text-gray-600 dark:text-[#F5E6C8]">
            {description}
          </p>
        </div>

        {/* 데스크탑 전용 그리드 */}
        <div
          className="hidden md:grid gap-4"
          style={{ gridTemplateColumns: '2fr 2.5fr', gridTemplateRows: 'auto 1fr' }}
        >
          {/* (1,1) 제목·부제목 */}
          <div className="self-start text-left">
            <h2 className="text-2xl md:text-2xl font-extrabold text-green-600 mb-2 dark:text-[#FFF6D1]">
              {title}
            </h2>
            <p className="whitespace-pre-line text-xl md:text-4xl font-extrabold text-gray-700 dark:text-white">
              {subTitle}
            </p>
          </div>

          {/* (1,2) 큰 맵 */}
          <div>
            <Image
              src={image1.src}
              alt={image1.alt}
              width={800}
              height={450}
              className="rounded-2xl w-full h-auto shadow-lg object-cover"
              loading="lazy"
            />
          </div>

          {/* (2,1) 작은 캡처 */}
          <div>
            <Image
              src={image2.src}
              alt={image2.alt}
              width={900}
              height={600}
              className="rounded-2xl w-full h-auto shadow-lg object-cover"
              loading="lazy"
            />
          </div>

          {/* (2,2) 설명 */}
          <div className="self-start text-left">
            <p className="text-base md:text-2xl text-gray-600 dark:text-[#FFF6D1]">
              {description}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
