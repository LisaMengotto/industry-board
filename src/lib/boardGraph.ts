import type { LayoutMap, LayoutPosition, NodeKind } from './types'
import { nodeId } from './types'
import type { Node, Edge } from 'reactflow'
import type { Company } from './types'
import { computeCompanySimilarity } from './related'

export type BoardNodeData = {
  kind: NodeKind
  label: string
  meta?: string
  companyId?: string
  tags?: string[]
  description?: string
  notes?: string
  website?: string
  // Legacy fields (kept optional so older node components still typecheck).
  sectorId?: string
  industryId?: string
  width: number
  height: number
}

const SIZES = {
  company: { width: 190, height: 62 },
} as const

function computeClusterFallbackLayout(companies: Company[]): Map<string, LayoutPosition> {
  const CLUSTER_GAP_X = 360
  const ROW_GAP_Y = 72
  const MAX_ROWS_PER_CLUSTER = 9

  const stable = [...companies].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt
    return a.name.localeCompare(b.name)
  })

  const tagCounts = new Map<string, number>()
  for (const c of stable) {
    for (const t of c.tags ?? []) {
      const key = t.trim()
      if (!key) continue
      tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1)
    }
  }

  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 8)

  const withinClusterIndex = new Map<number, number>()

  const positions = new Map<string, LayoutPosition>()
  for (const c of stable) {
    const primaryTagIndex = (c.tags ?? [])
      .map((t) => topTags.indexOf(t.trim()))
      .filter((idx) => idx >= 0)
      .sort((a, b) => a - b)[0]

    const clusterIndex = typeof primaryTagIndex === 'number' ? primaryTagIndex : topTags.length
    const withinIdx = withinClusterIndex.get(clusterIndex) ?? 0
    withinClusterIndex.set(clusterIndex, withinIdx + 1)

    const x = clusterIndex * CLUSTER_GAP_X
    const y = Math.floor(withinIdx / MAX_ROWS_PER_CLUSTER) * ROW_GAP_Y + (withinIdx % MAX_ROWS_PER_CLUSTER) * 26

    positions.set(nodeId('company', c.id), { x, y })
  }

  return positions
}

export function ensureLayoutForCompanies(companies: Company[], layout: LayoutMap): { layout: LayoutMap; didChange: boolean } {
  const expected = new Map<string, { x: number; y: number }>()
  const fallbackPositions = computeClusterFallbackLayout(companies)

  for (const c of companies) {
    const nid = nodeId('company', c.id)
    const fallback = fallbackPositions.get(nid) ?? { x: 0, y: 0 }
    expected.set(nid, fallback)
  }

  const nextLayout: LayoutMap = {}
  let didChange = false

  for (const [nid, pos] of expected.entries()) {
    if (layout[nid]) nextLayout[nid] = layout[nid]
    else {
      nextLayout[nid] = pos
      didChange = true
    }
  }

  // Prune nodes that no longer exist.
  for (const nid of Object.keys(layout)) {
    if (!expected.has(nid)) {
      didChange = true
      continue
    }
    nextLayout[nid] = layout[nid]
  }

  return { layout: nextLayout, didChange }
}

export function buildBoardGraph(companies: Company[], layout: LayoutMap): { nodes: Node<BoardNodeData>[]; edges: Edge[] } {
  const nodes: Node<BoardNodeData>[] = []
  const edges: Edge[] = []

  const fallbackPositions = computeClusterFallbackLayout(companies)
  const getPos = (nid: string) => layout[nid] ?? fallbackPositions.get(nid) ?? { x: 0, y: 0 }

  for (const c of companies) {
    const nid = nodeId('company', c.id)
    const tagsPreview = c.tags?.slice(0, 3) ?? []
    const more = (c.tags?.length ?? 0) > tagsPreview.length ? ` +${c.tags.length - tagsPreview.length}` : ''
    const meta = tagsPreview.length > 0 ? `${tagsPreview.join(', ')}${more}` : c.description ? c.description : c.notes ? 'Has notes' : undefined

    nodes.push({
      id: nid,
      type: 'company',
      position: getPos(nid),
      data: {
        kind: 'company',
        label: c.name,
        companyId: c.id,
        tags: c.tags ?? [],
        description: c.description,
        notes: c.notes,
        website: c.website,
        meta,
        width: SIZES.company.width,
        height: SIZES.company.height,
      },
      draggable: true,
      selectable: true,
    })
  }

  // Lightweight related-company edges (avoid O(n^2) edges explosion).
  const edgesPerCompany = 3
  const n = companies.length
  const edgeIds = new Set<string>()

  for (let i = 0; i < n; i++) {
    const candidates: Array<{ j: number; simScore: number; tagOverlapCount: number }> = []
    for (let j = 0; j < n; j++) {
      if (i === j) continue
      const similarity = computeCompanySimilarity(companies[i], companies[j])
      if (similarity.tagOverlapCount === 0 && similarity.score < 0.12) continue
      candidates.push({ j, simScore: similarity.score, tagOverlapCount: similarity.tagOverlapCount })
    }

    candidates.sort((a, b) => {
      if (a.tagOverlapCount !== b.tagOverlapCount) return b.tagOverlapCount - a.tagOverlapCount
      return b.simScore - a.simScore
    })

    const taken = candidates.slice(0, edgesPerCompany)
    for (const t of taken) {
      const aId = companies[i].id
      const bId = companies[t.j].id
      const eid = `e:${aId}:${bId}`
      // De-dupe: keep only one direction per unordered pair.
      const unorderedEid = i < t.j ? `e:${aId}:${bId}` : `e:${bId}:${aId}`
      if (edgeIds.has(unorderedEid)) continue
      edgeIds.add(unorderedEid)

      const similarity = computeCompanySimilarity(companies[i], companies[t.j])
      const opacity = Math.max(0.16, Math.min(0.72, 0.14 + similarity.tagJaccard * 0.6))
      const strokeWidth = 1 + similarity.tagOverlapCount * 0.35

      edges.push({
        id: eid,
        source: nodeId('company', companies[i].id),
        target: nodeId('company', companies[t.j].id),
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'smoothstep',
        animated: false,
        style: { stroke: `rgba(34, 197, 94, ${opacity})`, strokeWidth },
      })
    }
  }

  return { nodes, edges }
}

