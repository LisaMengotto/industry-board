export type NodeKind = 'sector' | 'industry' | 'company'

export type LayoutPosition = { x: number; y: number }
export type LayoutMap = Record<string, LayoutPosition>

export type Id = string

export type Company = {
  id: Id
  name: string
  notes: string
  // Controlled taxonomy fields (used for consistent tagging and filtering).
  sector?: import('./taxonomy').SectorValue
  industry?: import('./taxonomy').IndustryValue
  subIndustry?: string
  layer?: import('./taxonomy').LayerValue
  businessModel?: import('./taxonomy').BusinessModelValue
  frontier?: import('./taxonomy').FrontierValue[]
  createdAt: number
}

export type Industry = {
  id: Id
  name: string
  companies: Company[]
  createdAt: number
}

export type Sector = {
  id: Id
  name: string
  industries: Industry[]
  createdAt: number
}

export type BoardData = {
  version: 2
  sectors: Sector[]
  layout: LayoutMap
}

export type NodeId = `${NodeKind}:${Id}`

export function nodeId(kind: NodeKind, id: Id): NodeId {
  return `${kind}:${id}`
}

export function parseNodeId(id: string): { kind: NodeKind; entityId: string } | null {
  const parts = id.split(':')
  if (parts.length !== 2) return null
  const [kind, entityId] = parts
  if (kind !== 'sector' && kind !== 'industry' && kind !== 'company') return null
  return { kind, entityId }
}

