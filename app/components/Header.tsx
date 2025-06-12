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
      </nav>
    </header>
  )
}
