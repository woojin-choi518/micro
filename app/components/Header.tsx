'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  return (
    <header className="bg-green-600 text-white px-6 py-4 shadow-lg border-b-4 border-green-800">
      <nav className="max-w-6xl mx-auto flex justify-between items-center">
        
        {/* 좌측 링크들 */}
        <div className="flex space-x-6 text-sm font-medium">
          <Link href="/map" className="hover:underline text-xl">Map</Link>
          <Link href="/similarity" className="hover:underline text-xl">Similarity</Link>
          <Link href="/cesium" className="hover:underline text-xl">Cesium</Link>
        </div>

        {/* 우측 로고 및 텍스트 */}
        <div className="flex items-center space-x-2">
          <Image
            src="/images/sunmoonLogo.svg"
            alt="Sunmoon University Logo"
            width={40}
            height={40}
            priority
          />
        </div>
      </nav>
    </header>
  )
}
