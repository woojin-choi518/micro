'use client'

import { motion } from 'framer-motion'
import React, { useState } from 'react'
import { ASVCount, TaxonomyInfo } from '@/app/lib/types'

interface ASVProfileListProps {
  asvs: ASVCount[]
  totalSamples: number
  selectedFeature: string | null
  taxonomyMap: Record<string, TaxonomyInfo>
  onSelect: (seq: string) => void
}

export default function ASVProfileList({
  asvs,
  totalSamples,
  selectedFeature,
  taxonomyMap,
  onSelect
}: ASVProfileListProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {asvs.length > 0 ? (
        asvs.map(({ sequence, count, features }) => {
          const taxonomy = taxonomyMap[sequence]
          const microbeName =
            taxonomy?.species || taxonomy?.genus || 'Unknown species'
          const fullTaxonomy = [
            taxonomy?.phylum,
            taxonomy?.class,
            taxonomy?.order,
            taxonomy?.family,
            taxonomy?.genus,
            taxonomy?.species
          ]
            .filter(Boolean)
            .join(' > ')
          const isExpanded = expanded === sequence

          return (
            <div
              key={sequence}
              className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => {
                setExpanded(prev => (prev === sequence ? null : sequence))
                onSelect(sequence)
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-green-800">
                  {microbeName}
                </span>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  출현: {count}회 / {((count / totalSamples) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-700 italic">
                {fullTaxonomy || 'No taxonomy information'}
              </div>

              {!selectedFeature && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(features).map(([feature, featureCount]) => (
                    <span
                      key={feature}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                    >
                      {feature}: {featureCount}회
                    </span>
                  ))}
                </div>
              )}

              {isExpanded && taxonomy && (
                <div className="mt-3 text-xs text-gray-700 space-y-1 font-mono break-all">
                  <div><b>Domain:</b> {taxonomy.domain}</div>
                  <div><b>Phylum:</b> {taxonomy.phylum}</div>
                  <div><b>Class:</b> {taxonomy.class}</div>
                  <div><b>Order:</b> {taxonomy.order}</div>
                  <div><b>Family:</b> {taxonomy.family}</div>
                  <div><b>Genus:</b> {taxonomy.genus}</div>
                  <div><b>Species:</b> {taxonomy.species}</div>
                  <div><b>ASV Seq:</b> {sequence}</div>
                </div>
              )}
            </div>
          )
        })
      ) : (
        <p className="text-gray-600 text-sm">
          선택된 위치 주변에서 발견된 ASV가 없습니다.
          {selectedFeature && ` (${selectedFeature} 특징에서)`}
        </p>
      )}
    </motion.div>
  )
}
