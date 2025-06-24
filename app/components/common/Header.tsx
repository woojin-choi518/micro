'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-green-600 text-white p-4">
      <nav className="max-w-6xl mx-auto flex justify-between items-center">
        {/* 왼쪽: 메뉴 */}
        <div className="flex flex-wrap items-center space-x-4 sm:space-x-6">
          <Link href="/map" className="hover:underline font-pretendard font-bold text-sm sm:text-base">
            Map
          </Link>
          <Link href="/similarity" className="hover:underline font-pretendard font-bold text-sm sm:text-base">
            유사도
          </Link>
          <Link href="/cesium" className="hover:underline font-pretendard font-bold text-sm sm:text-base">
            오염
          </Link>
          <Link href="/tree" className="hover:underline font-pretendard font-bold text-sm sm:text-base">
            보호수
          </Link>
          <Link href="/prod" className="hover:underline font-pretendard font-bold text-sm sm:text-base">
            농작물
          </Link>
          <Link href="/asan" className="hover:underline font-pretendard font-bold text-sm sm:text-base">
            아산
          </Link>
        </div>
      </nav>
    </header>
  );
}