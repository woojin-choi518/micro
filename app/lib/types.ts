export interface Sample {
  id: string
  sample_id: string
  env_biome: string
  env_feature: string | null
  sample_type: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  top5_asv: string[]
  physical_specimen_remaining: boolean
}

export interface ASVProfileProps {
  samples: Sample[]
  selectedLocation?: { lat: number; lng: number }
  radius?: number
}

export interface ASVCount {
  sequence: string
  count: number
  features: Record<string, number>
  name?: string
}

export interface TaxonomyInfo {
  asvSeq: string
  domain?: string
  phylum?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  species?: string
  confidence?: number
}