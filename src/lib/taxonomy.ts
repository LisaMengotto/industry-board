export const SECTOR_VALUES = ['Primary', 'Secondary', 'Tertiary', 'Quaternary', 'Quinary'] as const
export type SectorValue = (typeof SECTOR_VALUES)[number]

export const INDUSTRY_VALUES = [
  'Agriculture',
  'Forestry',
  'Fishing & Aquaculture',
  'Mining',
  'Oil & Gas',
  'Energy',
  'Utilities',
  'Manufacturing',
  'Construction',
  'Semiconductors',
  'Electronics & Hardware',
  'Robotics',
  'Automotive',
  'Aerospace & Defense',
  'Chemicals',
  'Materials',
  'Pharmaceuticals',
  'Biotechnology',
  'Healthcare',
  'Financial Services',
  'Insurance',
  'Real Estate',
  'Retail',
  'E-commerce',
  'Logistics & Supply Chain',
  'Transportation',
  'Travel & Hospitality',
  'Media & Entertainment',
  'Gaming',
  'Telecommunications',
  'Education',
  'Government',
  'Software',
  'Information Technology',
  'Cybersecurity',
  'Data Infrastructure',
  'Cloud Computing',
  'Artificial Intelligence',
  'Research & Development',
  'Professional Services',
  'Marketing & Advertising',
  'Legal',
  'Recruiting / HR',
  'Nonprofit / NGO',
] as const
export type IndustryValue = (typeof INDUSTRY_VALUES)[number]

export const LAYER_VALUES = [
  'Raw Materials',
  'Components',
  'Infrastructure',
  'Platform',
  'Application',
  'Consumer',
  'Services',
  'Marketplace',
  'Governance',
] as const
export type LayerValue = (typeof LAYER_VALUES)[number]

export const BUSINESS_MODEL_VALUES = [
  'SaaS',
  'Usage-based SaaS',
  'API / Developer Platform',
  'Hardware',
  'Hardware + Software',
  'Marketplace',
  'Transaction Fee',
  'Subscription',
  'Advertising',
  'Licensing',
  'Services',
  'Consulting',
  'Manufacturing',
  'D2C',
  'Enterprise Sales',
  'Freemium',
  'Open Source + Commercial',
  'Government Contracts',
] as const
export type BusinessModelValue = (typeof BUSINESS_MODEL_VALUES)[number]

export const FRONTIER_VALUES = [
  'AI',
  'Robotics',
  'Bio',
  'Energy',
  'Climate',
  'Defense',
  'Space',
  'Quantum',
  'Crypto / Web3',
  'Fintech',
  'Healthcare',
  'Education',
  'Enterprise',
  'Consumer',
  'Industrial',
  'Mobility',
] as const
export type FrontierValue = (typeof FRONTIER_VALUES)[number]

export type CompanyTaxonomy = {
  sector?: SectorValue
  industry?: IndustryValue
  subIndustry?: string
  layer?: LayerValue
  businessModel?: BusinessModelValue
  frontier?: FrontierValue[]
}

const FIELD_HELP: Record<
  keyof Pick<CompanyTaxonomy, 'sector' | 'industry' | 'subIndustry' | 'layer' | 'businessModel' | 'frontier'>,
  string
> = {
  sector:
    'Select where the company operates in the economy (Primary = raw materials, ... Quinary = governance/societal coordination).',
  industry: 'Select the closest controlled industry domain for the company or startup.',
  subIndustry:
    "Freeform but specific: name the technical/market slice (e.g., 'Foundation models', 'Fraud detection', 'Payments infrastructure').",
  layer: 'Select the primary stack layer the product sits in (data/infra -> platform -> application -> services -> governance, etc.).',
  businessModel: 'Select how the company monetizes value (pricing + packaging).',
  frontier:
    'Select the frontier themes the company is advancing (choose multiple if it fits).',
}

export function getFieldHelp(field: keyof CompanyTaxonomy): string | undefined {
  return FIELD_HELP[field as keyof typeof FIELD_HELP]
}

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

const SECTOR_BY_KEY = new Map(SECTOR_VALUES.map((v) => [normalizeKey(v), v]))
const INDUSTRY_BY_KEY = new Map(INDUSTRY_VALUES.map((v) => [normalizeKey(v), v]))
const LAYER_BY_KEY = new Map(LAYER_VALUES.map((v) => [normalizeKey(v), v]))
const BUSINESS_MODEL_BY_KEY = new Map(BUSINESS_MODEL_VALUES.map((v) => [normalizeKey(v), v]))
const FRONTIER_BY_KEY = new Map(FRONTIER_VALUES.map((v) => [normalizeKey(v), v]))

export function mapBoardSectorNameToSectorValue(raw: string | undefined | null): SectorValue | undefined {
  if (!raw) return undefined
  return SECTOR_BY_KEY.get(normalizeKey(raw))
}

export function mapBoardIndustryNameToIndustryValue(raw: string | undefined | null): IndustryValue | undefined {
  if (!raw) return undefined
  return INDUSTRY_BY_KEY.get(normalizeKey(raw))
}

export function mapControlledLayer(raw: string | undefined | null): LayerValue | undefined {
  if (!raw) return undefined
  return LAYER_BY_KEY.get(normalizeKey(raw))
}

export function mapControlledBusinessModel(raw: string | undefined | null): BusinessModelValue | undefined {
  if (!raw) return undefined
  return BUSINESS_MODEL_BY_KEY.get(normalizeKey(raw))
}

export function mapControlledFrontier(raw: string | undefined | null): FrontierValue | undefined {
  if (!raw) return undefined
  return FRONTIER_BY_KEY.get(normalizeKey(raw))
}

function includesAny(text: string, needles: string[]): boolean {
  for (const needle of needles) {
    if (!needle) continue
    if (text.includes(needle)) return true
  }
  return false
}

export function inferTaxonomyFromText(params: {
  text: string
  parentIndustryName?: string
}): Pick<CompanyTaxonomy, 'layer' | 'businessModel' | 'frontier'> {
  const t = `${params.text} ${params.parentIndustryName ?? ''}`.toLowerCase()

  const result: Pick<CompanyTaxonomy, 'layer' | 'businessModel' | 'frontier'> = {}

  // Layer inference (simple heuristics; safe default is "unset".)
  if (
    includesAny(t, ['raw materials', 'extraction', 'mining', 'ore', 'lithium', 'oilfield', 'crude']) ||
    (params.parentIndustryName && normalizeKey(params.parentIndustryName) === normalizeKey('Oil & Gas'))
  ) {
    result.layer = 'Raw Materials'
  } else if (includesAny(t, ['chip', 'gpu', 'sensor', 'component', 'module', 'hardware', 'pcb'])) {
    result.layer = 'Components'
  } else if (includesAny(t, ['infrastructure', 'network', 'grid', 'pipeline', 'data center', 'fabric'])) {
    result.layer = 'Infrastructure'
  } else if (includesAny(t, ['platform'])) {
    result.layer = 'Platform'
  } else if (includesAny(t, ['application', 'workflow', 'tool', 'product'])) {
    result.layer = 'Application'
  } else if (includesAny(t, ['consumer', 'b2c'])) {
    result.layer = 'Consumer'
  } else if (includesAny(t, ['service', 'services', 'operations', 'managed'])) {
    result.layer = 'Services'
  } else if (includesAny(t, ['marketplace', 'two-sided', 'buyers and sellers'])) {
    result.layer = 'Marketplace'
  } else if (includesAny(t, ['governance', 'regulation', 'compliance', 'oversight', 'policy'])) {
    result.layer = 'Governance'
  }

  // Business model inference (again, heuristics-only).
  if (includesAny(t, ['usage-based', 'metered usage'])) {
    result.businessModel = 'Usage-based SaaS'
  } else if (includesAny(t, ['api', 'developer platform', 'sdk'])) {
    result.businessModel = 'API / Developer Platform'
  } else if (includesAny(t, ['saas'])) {
    result.businessModel = 'SaaS'
  } else if (includesAny(t, ['freemium'])) {
    result.businessModel = 'Freemium'
  } else if (includesAny(t, ['open source', 'oss'])) {
    if (includesAny(t, ['commercial', 'paid'])) result.businessModel = 'Open Source + Commercial'
    else result.businessModel = 'Open Source + Commercial'
  } else if (includesAny(t, ['hardware + software', 'bundle', 'device + software'])) {
    result.businessModel = 'Hardware + Software'
  } else if (includesAny(t, ['transaction fee', 'take rate'])) {
    result.businessModel = 'Transaction Fee'
  } else if (includesAny(t, ['marketplace'])) {
    result.businessModel = 'Marketplace'
  } else if (includesAny(t, ['advertis', 'ads', 'ad-driven'])) {
    result.businessModel = 'Advertising'
  } else if (includesAny(t, ['licens'])) {
    result.businessModel = 'Licensing'
  } else if (includesAny(t, ['consulting'])) {
    result.businessModel = 'Consulting'
  } else if (includesAny(t, ['government contract', 'gov contract'])) {
    result.businessModel = 'Government Contracts'
  } else if (includesAny(t, ['d2c', 'direct-to-consumer'])) {
    result.businessModel = 'D2C'
  } else if (includesAny(t, ['enterprise sales'])) {
    result.businessModel = 'Enterprise Sales'
  } else if (includesAny(t, ['manufacturing'])) {
    result.businessModel = 'Manufacturing'
  } else if (includesAny(t, ['subscription', 'retainer'])) {
    result.businessModel = 'Subscription'
  } else if (includesAny(t, ['services', 'service'])) {
    result.businessModel = 'Services'
  } else if (includesAny(t, ['hardware', 'devices', 'device'])) {
    result.businessModel = 'Hardware'
  }

  // Frontier inference (multi-select).
  const frontierMatches: FrontierValue[] = []
  function pushFrontier(v: FrontierValue) {
    if (!frontierMatches.includes(v)) frontierMatches.push(v)
  }

  if (includesAny(t, ['llm', 'foundation model', 'foundation models', 'machine learning', 'artificial intelligence', 'ai '])) {
    pushFrontier('AI')
  }
  if (includesAny(t, ['robot', 'robotics'])) pushFrontier('Robotics')
  if (includesAny(t, ['gene', 'gene editing', 'genomics', 'biotech', 'bio '])) pushFrontier('Bio')
  if (includesAny(t, ['energy', 'grid', 'power', 'solar', 'wind'])) pushFrontier('Energy')
  if (includesAny(t, ['climate', 'carbon', 'emissions', 'decarbon'])) pushFrontier('Climate')
  if (includesAny(t, ['defense', 'military', 'drone', 'weapon'])) pushFrontier('Defense')
  if (includesAny(t, ['space', 'satellite', 'launch', 'rocket'])) pushFrontier('Space')
  if (includesAny(t, ['quantum'])) pushFrontier('Quantum')
  if (includesAny(t, ['crypto', 'web3', 'blockchain'])) pushFrontier('Crypto / Web3')
  if (includesAny(t, ['fintech', 'payments', 'payment', 'wallet', 'lending'])) pushFrontier('Fintech')
  if (includesAny(t, ['healthcare', 'health', 'clinical', 'surgical'])) pushFrontier('Healthcare')
  if (includesAny(t, ['education', 'learning', 'tutoring', 'school'])) pushFrontier('Education')
  if (includesAny(t, ['enterprise'])) pushFrontier('Enterprise')
  if (includesAny(t, ['consumer', 'b2c'])) pushFrontier('Consumer')
  if (includesAny(t, ['industrial'])) pushFrontier('Industrial')
  if (includesAny(t, ['mobility', 'autonomous vehicle', 'autonomous vehicles', 'ev', 'transportation'])) pushFrontier('Mobility')

  if (frontierMatches.length > 0) result.frontier = frontierMatches
  return result
}

export function getFrontierAllValues(): FrontierValue[] {
  return [...FRONTIER_VALUES]
}

