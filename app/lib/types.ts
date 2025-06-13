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

export interface Microbe {
  id: string;
  ncbi_id: string;
  organism: string;
  latitude: number | null;
  longitude: number | null;
  original_date: string | null;
  collection_date: string | null;
  year: number | null;
  sequence: string;
  createdAt?: string | null; 
}

export interface LocationInfo {
  location: string;
  city: string;
  latitude: number;
  longitude: number;
  species: string;
  yield_g: number;
  diversity: number;
  main_microbiome: string;
  contribution: string;
}

export interface ProtectedTree {
  provinceName: string;
  districtName: string;
  managingAgency: string | null;
  designationNumber: string | null;
  protectionDesignationDate: string | null;  // ISO 날짜 문자열
  scientificName: string | null;
  treeCategory: string | null;
  treeAge: number | null;
  roadNameAddress: string | null;
  latitude: number;
  longitude: number;
}

export enum SampleGroup {
  ASH = "ASH",
  BSD = "BSD",
  NSH = "NSH",
  NSD = "NSD",
}

export interface TreeSample {
  id: number;
  group: SampleGroup;
  area: string;
  latitude: number;
  longitude: number;
  declineSymptoms: boolean;
  replicates: string;
  springSampling: string;
  summerSampling: string;    
  compartments: string;
  microorganisms: string;
}

export interface Metric {
  kingdom: string;
  season: string;
  meanRawReads: number;
  meanFilteredReads: number;
}

export interface PhylumAbundance {
  compartment: string;
  phylum: string;
  minPct: number;
  maxPct: number;

}