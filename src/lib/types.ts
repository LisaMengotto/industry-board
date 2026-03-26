export type NodeKind = 'sector' | 'industry' | 'company'

export type LayoutPosition = { x: number; y: number }
export type LayoutMap = Record<string, LayoutPosition>

export type Id = string

export type Company = {
  id: Id
  name: string
  // Main classification system: multi-value tags (Notion/Obsidian style).
  tags: string[]
  description?: string
  notes?: string
  website?: string
  createdAt: number
}

export type BoardData = {
  version: 3
  companies: Company[]
  // Global tag library (used for quick filtering + tag suggestions).
  tags: string[]
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

