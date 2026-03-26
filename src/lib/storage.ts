import type { BoardData } from './types'
import { inferTaxonomyFromText, mapBoardIndustryNameToIndustryValue, mapBoardSectorNameToSectorValue } from './taxonomy'

const STORAGE_KEY = 'industryBoard.v1'

type CompanyV1 = {
  id: string
  name: string
  notes: string
  createdAt: number
}

type IndustryV1 = {
  id: string
  name: string
  companies: CompanyV1[]
  createdAt: number
}

type SectorV1 = {
  id: string
  name: string
  industries: IndustryV1[]
  createdAt: number
}

type BoardDataV1 = {
  version: 1
  sectors: SectorV1[]
  layout: Record<string, { x: number; y: number }>
}

export function loadBoardData(): BoardData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 2, sectors: [], layout: {} }
    const parsed: Partial<BoardData> & { version?: unknown; sectors?: unknown; layout?: unknown } = JSON.parse(raw)

    if (parsed?.version === 2) {
      return {
        version: 2,
        sectors: Array.isArray(parsed.sectors) ? (parsed.sectors as BoardData['sectors']) : [],
        layout: parsed.layout && typeof parsed.layout === 'object' ? (parsed.layout as BoardData['layout']) : {},
      }
    }

    if (parsed?.version === 1) {
      const v1 = parsed as unknown as BoardDataV1

      const sectors = Array.isArray(v1.sectors)
        ? v1.sectors.map((s) => {
            const industries = Array.isArray(s?.industries)
              ? s.industries.map((i) => {
                  const companies = Array.isArray(i?.companies)
                    ? i.companies.map((c) => {
                        const notes = typeof c.notes === 'string' ? c.notes : ''
                        const inferred = inferTaxonomyFromText({
                          text: notes,
                          parentIndustryName: i?.name,
                        })

                        const sector = mapBoardSectorNameToSectorValue(s?.name)
                        const industry = mapBoardIndustryNameToIndustryValue(i?.name)

                        const frontier = inferred.frontier && inferred.frontier.length > 0 ? inferred.frontier : undefined

                        return {
                          id: String(c?.id ?? ''),
                          name: typeof c?.name === 'string' ? c.name : '',
                          notes,
                          createdAt: typeof c?.createdAt === 'number' ? c.createdAt : Date.now(),
                          sector,
                          industry,
                          subIndustry: '',
                          layer: inferred.layer,
                          businessModel: inferred.businessModel,
                          frontier,
                        }
                      })
                    : []

                  return {
                    id: String(i?.id ?? ''),
                    name: typeof i?.name === 'string' ? i.name : '',
                    companies,
                    createdAt: typeof i?.createdAt === 'number' ? i.createdAt : Date.now(),
                  }
                })
              : []

            return {
              id: String(s?.id ?? ''),
              name: typeof s?.name === 'string' ? s.name : '',
              industries,
              createdAt: typeof s?.createdAt === 'number' ? s.createdAt : Date.now(),
            }
          })
        : []

      return {
        version: 2,
        sectors,
        layout: v1.layout && typeof v1.layout === 'object' ? (v1.layout as BoardData['layout']) : {},
      }
    }

    return { version: 2, sectors: [], layout: {} }
  } catch {
    return { version: 2, sectors: [], layout: {} }
  }
}

export function saveBoardData(data: BoardData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // If localStorage is full or blocked, we silently ignore to keep the app usable.
  }
}

export function clearBoardData() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

