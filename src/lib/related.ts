import type { Company } from './types'

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'our',
  'that',
  'the',
  'their',
  'to',
  'with',
  'you',
  'your',
])

function normalizeWhitespace(s: string) {
  return s.replace(/\s+/g, ' ').trim()
}

function normalizeTagKey(tag: string) {
  return normalizeWhitespace(tag).toLowerCase()
}

function tokenize(text: string) {
  const lower = text.toLowerCase()
  const raw = lower.split(/[^a-z0-9]+/g)
  const tokens = raw.map((t) => t.trim()).filter((t) => t.length > 1 && !STOPWORDS.has(t))
  return new Set(tokens)
}

function charTrigrams(s: string) {
  const clean = normalizeWhitespace(s).toLowerCase().replace(/[^a-z0-9]/g, '')
  if (clean.length < 3) return new Set([clean].filter(Boolean))
  const set = new Set<string>()
  for (let i = 0; i <= clean.length - 3; i++) {
    set.add(clean.slice(i, i + 3))
  }
  return set
}

function jaccardSize<T>(a: Set<T>, b: Set<T>) {
  if (a.size === 0 && b.size === 0) return 0
  let intersection = 0
  for (const x of a) if (b.has(x)) intersection++
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

export type CompanySimilarity = {
  score: number
  tagOverlapCount: number
  sharedTags: string[]
  tagJaccard: number
  semanticJaccard: number
}

export function computeCompanySimilarity(a: Company, b: Company): CompanySimilarity {
  const aTags = a.tags ?? []
  const bTags = b.tags ?? []

  const aTagKeys = new Map<string, string>() // key -> original
  for (const t of aTags) aTagKeys.set(normalizeTagKey(t), t)
  const bTagKeys = new Map<string, string>()
  for (const t of bTags) bTagKeys.set(normalizeTagKey(t), t)

  const aTagSet = new Set(aTagKeys.keys())
  const bTagSet = new Set(bTagKeys.keys())

  const sharedKeys: string[] = []
  for (const key of aTagSet) if (bTagSet.has(key)) sharedKeys.push(key)

  const sharedTags = sharedKeys.map((k) => aTagKeys.get(k) ?? k)
  const tagOverlapCount = sharedTags.length

  const tagJaccard = jaccardSize(aTagSet, bTagSet)

  const aText = [
    a.name,
    a.description ?? '',
    a.notes ?? '',
    a.website ?? '',
    a.tags.join(' '),
  ].join(' ')
  const bText = [
    b.name,
    b.description ?? '',
    b.notes ?? '',
    b.website ?? '',
    b.tags.join(' '),
  ].join(' ')

  const aTokens = tokenize(aText)
  const bTokens = tokenize(bText)
  const tokenJaccard = jaccardSize(aTokens, bTokens)

  const aTrigrams = charTrigrams(aText)
  const bTrigrams = charTrigrams(bText)
  const trigramJaccard = jaccardSize(aTrigrams, bTrigrams)

  // "Semantic-ish" similarity from tokens + char trigrams.
  const semanticJaccard = Math.max(tokenJaccard, trigramJaccard)

  // Final blended score.
  const score = 0.65 * tagJaccard + 0.35 * semanticJaccard

  return { score, tagOverlapCount, sharedTags, tagJaccard, semanticJaccard }
}

export function getRelatedCompanies(params: {
  companies: Company[]
  companyId: string
  maxResults: number
}): Company[] {
  const { companies, companyId, maxResults } = params
  const base = companies.find((c) => c.id === companyId)
  if (!base) return []

  const scored: Array<{ id: string; score: CompanySimilarity }> = []
  for (const c of companies) {
    if (c.id === companyId) continue
    const similarity = computeCompanySimilarity(base, c)
    scored.push({ id: c.id, score: similarity })
  }

  scored.sort((x, y) => {
    // Prefer stronger shared-tag overlap; then overall score.
    if (x.score.tagOverlapCount !== y.score.tagOverlapCount) return y.score.tagOverlapCount - x.score.tagOverlapCount
    return y.score.score - x.score.score
  })

  const results: Company[] = []
  for (const s of scored) {
    const c = companies.find((cc) => cc.id === s.id)
    if (!c) continue
    // Avoid returning completely unrelated items when we have tags.
    if (base.tags.length > 0 && s.score.tagOverlapCount === 0 && s.score.score < 0.12) continue
    results.push(c)
    if (results.length >= maxResults) break
  }

  return results
}

export function getSimilarityForEdges(params: {
  companies: Company[]
  aIndex: number
  bIndex: number
}) {
  const { companies, aIndex, bIndex } = params
  if (aIndex === bIndex) return null
  return computeCompanySimilarity(companies[aIndex], companies[bIndex])
}

