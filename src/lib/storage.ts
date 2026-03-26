import type { BoardData, Company } from './types'
import { inferTaxonomyFromText } from './taxonomy'

const STORAGE_KEY = 'industryBoard.v1'

type OldCompany = {
  id?: unknown
  name?: unknown
  notes?: unknown
  createdAt?: unknown
  // Old controlled taxonomy fields.
  sector?: unknown
  industry?: unknown
  subIndustry?: unknown
  layer?: unknown
  businessModel?: unknown
  frontier?: unknown
}

type OldIndustry = {
  id?: unknown
  name?: unknown
  companies?: unknown
  createdAt?: unknown
}

type OldSector = {
  id?: unknown
  name?: unknown
  industries?: unknown
  createdAt?: unknown
}

type OldBoardShape = {
  version?: unknown
  sectors?: unknown
  companies?: unknown
  tags?: unknown
  layout?: unknown
}

export function loadBoardData(): BoardData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 3, companies: [], tags: [], layout: {} }

    const parsed = JSON.parse(raw) as OldBoardShape

    if (parsed?.version === 3 && Array.isArray(parsed.companies)) {
      return {
        version: 3,
        companies: parsed.companies as Company[],
        tags: Array.isArray(parsed.tags) ? (parsed.tags as string[]) : [],
        layout: parsed.layout && typeof parsed.layout === 'object' ? (parsed.layout as BoardData['layout']) : {},
      }
    }

    // Migration from old taxonomy-based board formats.
    const oldSectors: OldSector[] = Array.isArray(parsed.sectors) ? (parsed.sectors as OldSector[]) : []

    const companies: Company[] = []
    const tagsByKey = new Map<string, string>()

    function normalizeTagKey(tag: string) {
      return tag.trim().toLowerCase().replace(/\s+/g, ' ')
    }

    function maybeAddTag(tags: string[], rawTag: unknown) {
      if (typeof rawTag !== 'string') return
      const tag = rawTag.trim()
      if (!tag) return
      const key = normalizeTagKey(tag)
      if (!key) return
      // De-dupe but preserve the first-seen casing.
      if (!tagsByKey.has(key)) tagsByKey.set(key, tag)
      if (!tags.includes(tagsByKey.get(key)!)) tags.push(tagsByKey.get(key)!)
    }

    function maybeAddFrontierTags(tags: string[], rawFrontier: unknown) {
      if (!Array.isArray(rawFrontier)) return
      for (const f of rawFrontier) maybeAddTag(tags, f)
    }

    for (const sector of oldSectors) {
      const sectorIndustries: OldIndustry[] = Array.isArray(sector?.industries) ? (sector.industries as OldIndustry[]) : []
      for (const industry of sectorIndustries) {
        const industryName = typeof industry?.name === 'string' ? industry.name : undefined
        const oldCompanies: OldCompany[] = Array.isArray(industry?.companies) ? (industry.companies as OldCompany[]) : []

        for (const oldC of oldCompanies) {
          const id = String(oldC?.id ?? '')
          if (!id) continue
          const name = typeof oldC?.name === 'string' ? oldC.name : ''
          const createdAt = typeof oldC?.createdAt === 'number' ? oldC.createdAt : Date.now()

          const notes = typeof oldC?.notes === 'string' ? oldC.notes : undefined
          const maybeExtras = oldC as OldCompany & { description?: unknown; website?: unknown }
          const description = typeof maybeExtras.description === 'string' ? maybeExtras.description : undefined
          const website = typeof maybeExtras.website === 'string' ? maybeExtras.website : undefined

          const tags: string[] = []
          maybeAddTag(tags, oldC?.sector)
          maybeAddTag(tags, oldC?.industry)
          maybeAddTag(tags, oldC?.subIndustry)
          maybeAddTag(tags, oldC?.layer)
          maybeAddTag(tags, oldC?.businessModel)
          maybeAddFrontierTags(tags, oldC?.frontier)

          // Best-effort extra conversion from notes.
          if (notes && (notes.trim().length > 0 || industryName)) {
            const inferred = inferTaxonomyFromText({
              text: notes ?? '',
              parentIndustryName: industryName,
            })
            if (inferred.layer) maybeAddTag(tags, inferred.layer)
            if (inferred.businessModel) maybeAddTag(tags, inferred.businessModel)
            if (inferred.frontier) maybeAddFrontierTags(tags, inferred.frontier)
          }

          const company: Company = {
            id,
            name,
            tags,
            description,
            notes: typeof notes === 'string' && notes.trim() ? notes : undefined,
            website,
            createdAt,
          }

          companies.push(company)
        }
      }
    }

    const allTags = Array.from(tagsByKey.values())

    return {
      version: 3,
      companies,
      tags: allTags,
      layout: parsed.layout && typeof parsed.layout === 'object' ? (parsed.layout as BoardData['layout']) : {},
    }
  } catch {
    return { version: 3, companies: [], tags: [], layout: {} }
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

