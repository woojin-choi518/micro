'use client'

import { Sample } from '@/app/lib/types'

interface SampleDetailPanelProps {
  sample: Sample
}

export default function SampleDetailPanel({ sample }: SampleDetailPanelProps) {
  return (
    <div className="p-4 space-y-2 text-sm text-gray-800 dark:text-gray-200">
      <div>
        <span className="font-semibold">Sample ID:</span>
        <div className="break-words text-green-800 dark:text-green-300">{sample.sample_id}</div>
      </div>
      <div>
        <span className="font-semibold">Specimen:</span>{' '}
        <span className={sample.physical_specimen_remaining ? 'text-green-600' : 'text-red-500'}>
          {sample.physical_specimen_remaining ? 'Available' : 'Not Available'}
        </span>
      </div>
      <div>
        <span className="font-semibold">Biome:</span> {sample.env_biome}
      </div>
      <div>
        <span className="font-semibold">Feature:</span> {sample.env_feature || 'N/A'}
      </div>
      <div>
        <span className="font-semibold">Description:</span> {sample.description || 'None'}
      </div>
      <div>
        <span className="font-semibold">Coordinates:</span>{' '}
        {sample.latitude?.toFixed(4)}, {sample.longitude?.toFixed(4)}
      </div>
    </div>
  )
}
