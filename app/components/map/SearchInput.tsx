'use client'

import React from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search by Region or Biome...'
}: SearchInputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="mb-6 p-3 w-full rounded-xl border border-green-300 shadow-sm 
                 text-green-800 placeholder:text-green-400 
                 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
