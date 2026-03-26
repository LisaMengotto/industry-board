import type { LayoutMap, NodeKind, Sector } from './types'
import { nodeId } from './types'
import type { Node, Edge } from 'reactflow'

export type BoardNodeData = {
  kind: NodeKind
  label: string
  meta?: string
  sectorId: string
  industryId?: string
  companyId?: string
  notes?: string
  width: number
  height: number
}

const SIZES = {
  sector: { width: 230, height: 88 },
  industry: { width: 210, height: 74 },
  company: { width: 190, height: 62 },
} as const

function getDefaultLayoutForNode(params: {
  kind: NodeKind
  sectorIndex: number
  industryIndex: number
  companyIndex: number
  numCompanies: number
}): { x: number; y: number } {
  const { kind, sectorIndex, industryIndex, companyIndex, numCompanies } = params
  const SECTOR_GAP_X = 420
  const INDUSTRY_X_OFFSET = 110
  const INDUSTRY_GAP_Y = 180
  const INDUSTRY_Y_START = 170
  const COMPANY_Y_OFFSET = 140
  const COMPANY_GAP_X = 160

  const sectorX = sectorIndex * SECTOR_GAP_X

  if (kind === 'sector') return { x: sectorX, y: 0 }

  if (kind === 'industry') {
    // Stack industries vertically under each sector.
    return {
      x: sectorX + INDUSTRY_X_OFFSET,
      y: INDUSTRY_Y_START + industryIndex * INDUSTRY_GAP_Y,
    }
  }

  // kind === 'company'
  const industryPos = getDefaultLayoutForNode({
    kind: 'industry',
    sectorIndex,
    industryIndex,
    companyIndex: 0,
    numCompanies,
  })
  const companiesCenteredOffset = (numCompanies - 1) / 2
  return {
    x: industryPos.x + (companyIndex - companiesCenteredOffset) * COMPANY_GAP_X,
    y: industryPos.y + COMPANY_Y_OFFSET,
  }
}

export function ensureLayoutForSectors(
  sectors: Sector[],
  layout: LayoutMap
): { layout: LayoutMap; didChange: boolean } {
  const expected = new Map<string, { x: number; y: number }>()

  sectors.forEach((sector, sectorIndex) => {
    const sectorNodeId = nodeId('sector', sector.id)
    expected.set(
      sectorNodeId,
      getDefaultLayoutForNode({
        kind: 'sector',
        sectorIndex,
        industryIndex: 0,
        companyIndex: 0,
        numCompanies: 0,
      })
    )

    sector.industries.forEach((industry, industryIndex) => {
      const industryNodeId = nodeId('industry', industry.id)
      expected.set(
        industryNodeId,
        getDefaultLayoutForNode({
          kind: 'industry',
          sectorIndex,
          industryIndex,
          companyIndex: 0,
          numCompanies: industry.companies.length,
        })
      )

      industry.companies.forEach((company, companyIndex) => {
        const companyNodeId = nodeId('company', company.id)
        expected.set(
          companyNodeId,
          getDefaultLayoutForNode({
            kind: 'company',
            sectorIndex,
            industryIndex,
            companyIndex,
            numCompanies: industry.companies.length,
          })
        )
      })
    })
  })

  const nextLayout: LayoutMap = {}
  let didChange = false

  // Add/update expected nodes.
  for (const [nid, pos] of expected.entries()) {
    if (layout[nid]) nextLayout[nid] = layout[nid]
    else {
      nextLayout[nid] = pos
      didChange = true
    }
  }

  // Prune nodes that no longer exist.
  for (const nid of Object.keys(layout)) {
    if (!expected.has(nid)) didChange = true
  }

  return { layout: nextLayout, didChange }
}

export function buildBoardGraph(
  sectors: Sector[],
  layout: LayoutMap
): { nodes: Node<BoardNodeData>[]; edges: Edge[] } {
  const nodes: Node<BoardNodeData>[] = []
  const edges: Edge[] = []

  const getPos = (nid: string, fallback: { x: number; y: number }) => layout[nid] ?? fallback

  sectors.forEach((sector, sectorIndex) => {
    const sectorNid = nodeId('sector', sector.id)
    const sectorPos = getPos(
      sectorNid,
      getDefaultLayoutForNode({
        kind: 'sector',
        sectorIndex,
        industryIndex: 0,
        companyIndex: 0,
        numCompanies: 0,
      })
    )

    nodes.push({
      id: sectorNid,
      type: 'sector',
      position: sectorPos,
      data: {
        kind: 'sector',
        label: sector.name,
        meta: `${sector.industries.length} industr${sector.industries.length === 1 ? 'y' : 'ies'}`,
        sectorId: sector.id,
        width: SIZES.sector.width,
        height: SIZES.sector.height,
        notes: '',
      },
      draggable: true,
      selectable: true,
    })

    sector.industries.forEach((industry, industryIndex) => {
      const industryNid = nodeId('industry', industry.id)
      const industryPos = getPos(
        industryNid,
        getDefaultLayoutForNode({
          kind: 'industry',
          sectorIndex,
          industryIndex,
          companyIndex: 0,
          numCompanies: industry.companies.length,
        })
      )

      nodes.push({
        id: industryNid,
        type: 'industry',
        position: industryPos,
        data: {
          kind: 'industry',
          label: industry.name,
          meta: `${industry.companies.length} compan${industry.companies.length === 1 ? 'y' : 'ies'}`,
          sectorId: sector.id,
          industryId: industry.id,
          width: SIZES.industry.width,
          height: SIZES.industry.height,
          notes: '',
        },
        draggable: true,
        selectable: true,
      })

      edges.push({
        id: `e:${sector.id}:${industry.id}`,
        source: sectorNid,
        target: industryNid,
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'smoothstep',
        animated: false,
        style: { stroke: 'rgba(140, 140, 170, 0.55)', strokeWidth: 1.4 },
      })

      industry.companies.forEach((company, companyIndex) => {
        const companyNid = nodeId('company', company.id)
        const companyPos = getPos(
          companyNid,
          getDefaultLayoutForNode({
            kind: 'company',
            sectorIndex,
            industryIndex,
            companyIndex,
            numCompanies: industry.companies.length,
          })
        )

        nodes.push({
          id: companyNid,
          type: 'company',
          position: companyPos,
          data: {
            kind: 'company',
            label: company.name,
            meta: company.notes ? 'Has notes' : undefined,
            sectorId: sector.id,
            industryId: industry.id,
            companyId: company.id,
            notes: company.notes,
            width: SIZES.company.width,
            height: SIZES.company.height,
          },
          draggable: true,
          selectable: true,
        })

        edges.push({
          id: `e:${industry.id}:${company.id}`,
          source: industryNid,
          target: companyNid,
          sourceHandle: 'out',
          targetHandle: 'in',
          type: 'smoothstep',
          animated: false,
          style: { stroke: 'rgba(140, 140, 170, 0.55)', strokeWidth: 1.2 },
        })
      })
    })
  })

  return { nodes, edges }
}

