// app/components/Header.tsx

'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-green-600 text-white p-4">
      <nav className="max-w-6xl mx-auto flex space-x-6">
        <Link href="/map" className="hover:underline">
          Map
        </Link>
        <Link href="/similarity" className="hover:underline">
          Similarity
        </Link>
      </nav>
    </header>
  )
}
