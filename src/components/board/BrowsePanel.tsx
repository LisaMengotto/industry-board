import { useMemo, useState } from 'react'
import type { Company } from '../../lib/types'
import { computeCompanySimilarity, getRelatedCompanies } from '../../lib/related'

export type BrowsePanelProps = {
  companies: Company[]
  tags: string[]
  selectedCompanyId: string | null
  autoFocusOnSelect: boolean
  onSetAutoFocusOnSelect: (value: boolean) => void
  onSelectCompanyId: (companyId: string) => void
}

function overlapCount(a: string[], b: string[]) {
  if (!a?.length || !b?.length) return 0
  const keys = new Set(a.map((t) => t.trim().toLowerCase()))
  let count = 0
  for (const t of b) if (keys.has(t.trim().toLowerCase())) count++
  return count
}

export default function BrowsePanel({
  companies,
  tags,
  selectedCompanyId,
  autoFocusOnSelect,
  onSetAutoFocusOnSelect,
  onSelectCompanyId,
}: BrowsePanelProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortMode, setSortMode] = useState<'sharedTags' | 'name'>('sharedTags')

  const selectedCompany = useMemo(
    () => (selectedCompanyId ? companies.find((c) => c.id === selectedCompanyId) ?? null : null),
    [companies, selectedCompanyId]
  )

  const matching = useMemo(() => {
    if (companies.length === 0) return []
    const filterTags = selectedTags

    const list = companies
      .map((c) => {
        const shared = overlapCount(c.tags, filterTags)
        return { c, shared }
      })
      .filter(({ shared }) => (filterTags.length > 0 ? shared > 0 : true))

    list.sort((a, b) => {
      if (sortMode === 'name') return a.c.name.localeCompare(b.c.name)
      // sharedTags
      if (b.shared !== a.shared) return b.shared - a.shared
      // tie-break with semantic similarity to selected company if we have one
      if (selectedCompany) {
        const simA = computeCompanySimilarity(selectedCompany, a.c)
        const simB = computeCompanySimilarity(selectedCompany, b.c)
        if (simB.tagOverlapCount !== simA.tagOverlapCount) return simB.tagOverlapCount - simA.tagOverlapCount
        return simB.score - simA.score
      }
      return a.c.name.localeCompare(b.c.name)
    })

    return list.map((x) => x.c)
  }, [companies, selectedTags, sortMode, selectedCompany])

  const similar = useMemo(() => {
    if (!selectedCompanyId) return []
    return getRelatedCompanies({ companies, companyId: selectedCompanyId, maxResults: 8 })
  }, [companies, selectedCompanyId])

  return (
    <div className="sidePanel">
      <div className="sidePanel__header">
        <h2 className="sidePanel__title">Explore tags</h2>
        <p className="sidePanel__subtitle">Filter, sort, and find related companies via shared tags + similarity.</p>
      </div>

      <div className="sidePanel__section">
        <label className="checkRow">
          <input
            type="checkbox"
            checked={autoFocusOnSelect}
            onChange={(e) => onSetAutoFocusOnSelect(e.target.checked)}
          />
          Auto-focus selection on the board
        </label>
      </div>

      <div className="sidePanel__section">
        <div className="sidePanel__listHeader">
          <div className="sidePanel__listTitle">Filter by tags</div>
          <div className="sidePanel__muted">{selectedTags.length > 0 ? `${selectedTags.length} selected` : 'No filter'}</div>
        </div>

        {tags.length === 0 ? <div className="emptyState">No tags yet.</div> : null}

        {tags.length > 0 ? (
          <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                <select
                  className="field__input"
                  value={sortMode}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === 'sharedTags' || v === 'name') setSortMode(v)
                  }}
                >
                  <option value="sharedTags">Sort by shared tags</option>
                  <option value="name">Sort by name</option>
                </select>
                <button className="btn btn--secondary" type="button" onClick={() => setSelectedTags([])}>
                  Clear
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tags
                  .slice()
                  .sort((a, b) => a.localeCompare(b))
                  .map((t) => {
                    const active = selectedTags.some((x) => x.trim().toLowerCase() === t.trim().toLowerCase())
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`companyChip ${active ? 'companyChip--active' : ''}`}
                        onClick={() => {
                          setSelectedTags((prev) => {
                            const key = t.trim().toLowerCase()
                            const already = prev.some((x) => x.trim().toLowerCase() === key)
                            if (already) return prev.filter((x) => x.trim().toLowerCase() !== key)
                            return [...prev, t]
                          })
                        }}
                      >
                        {t}
                      </button>
                    )
                  })}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="sidePanel__section">
        <div className="sidePanel__listHeader">
          <div className="sidePanel__listTitle">Matching companies</div>
          <div className="sidePanel__muted">{matching.length} results</div>
        </div>

        {matching.length === 0 ? (
          <div className="emptyState">No companies match the current tag filter.</div>
        ) : (
          <div className="companiesList">
            {matching.slice(0, 30).map((c) => {
              const shared = selectedTags.length > 0 ? overlapCount(c.tags, selectedTags) : 0
              const isActive = c.id === selectedCompanyId
              return (
                <div key={c.id} className="companyRow">
                  <button
                    className={`companyRow__name ${isActive ? 'companyRow__name--active' : ''}`}
                    type="button"
                    onClick={() => onSelectCompanyId(c.id)}
                    title={c.name}
                  >
                    {c.name}
                    {selectedTags.length > 0 ? <span style={{ marginLeft: 8, opacity: 0.7 }}>({shared} shared)</span> : null}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedCompany ? (
        <div className="sidePanel__section">
          <div className="sidePanel__listHeader">
            <div className="sidePanel__listTitle">Similar companies</div>
            <div className="sidePanel__muted">Top tag/text matches</div>
          </div>

          {similar.length === 0 ? (
            <div className="emptyState">No similar companies found.</div>
          ) : (
            <div className="companiesList">
              {similar.map((c) => {
                const sim = computeCompanySimilarity(selectedCompany, c)
                return (
                  <div key={c.id} className="companyRow">
                    <button
                      className="companyRow__name"
                      type="button"
                      onClick={() => onSelectCompanyId(c.id)}
                      title={c.name}
                    >
                      {c.name}
                      {sim.tagOverlapCount > 0 ? (
                        <span style={{ marginLeft: 8, opacity: 0.7 }}>
                          ({sim.tagOverlapCount} shared)
                        </span>
                      ) : null}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

