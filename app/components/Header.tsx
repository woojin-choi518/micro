'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  return (
    <header className="bg-green-600 text-white p-4">
      <nav className="max-w-6xl mx-auto flex justify-between items-center flex-wrap">
        {/* 왼쪽: 메뉴 */}
        <div className="flex space-x-6">
          <Link href="/map" className="hover:underline">Map</Link>
          <Link href="/similarity" className="hover:underline">유사도</Link>
          <Link href="/cesium" className="hover:underline">오염</Link>
          <Link href="/tree" className="hover:underline">보호수</Link>
          <Link href="/prod" className='hover:underline'>농작물</Link>
        </div>

        {/* 오른쪽: 로고와 텍스트 */}
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <div className="w-8 h-8 relative">
            <Image
              src="/images/sunmoonLogo.svg" // 실제 경로로 수정
              alt="Sunmoon Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-bold whitespace-nowrap text-sm sm:text-base">
            선문대학교
          </span>
        </div>
      </nav>
    </header>
  )
}
