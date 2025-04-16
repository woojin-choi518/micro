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
  