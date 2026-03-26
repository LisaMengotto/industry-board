import { useEffect, useMemo } from 'react'
import type { Sector } from '../../lib/types'

export type BrowseStep = 0 | 1 | 2

export type BrowsePanelProps = {
  sectors: Sector[]
  browseStep: BrowseStep
  selectedSectorId: string | null
  selectedIndustryId: string | null
  selectedCompanyId: string | null
  autoFocusOnSelect: boolean
  onSetAutoFocusOnSelect: (value: boolean) => void
  onSelectSectorId: (sectorId: string) => void
  onSelectIndustryId: (industryId: string) => void
  onSelectCompanyId: (companyId: string) => void
  onSetBrowseStep: (step: BrowseStep) => void
}

export default function BrowsePanel({
  sectors,
  browseStep,
  selectedSectorId,
  selectedIndustryId,
  selectedCompanyId,
  autoFocusOnSelect,
  onSetAutoFocusOnSelect,
  onSelectSectorId,
  onSelectIndustryId,
  onSelectCompanyId,
  onSetBrowseStep,
}: BrowsePanelProps) {
  const selectedSector = useMemo(() => sectors.find((s) => s.id === selectedSectorId) ?? null, [sectors, selectedSectorId])
  const industries = selectedSector?.industries ?? []
  const selectedIndustry = useMemo(
    () => industries.find((i) => i.id === selectedIndustryId) ?? null,
    [industries, selectedIndustryId]
  )
  const companies = selectedIndustry?.companies ?? []

  useEffect(() => {
    if (browseStep !== 0) return
    if (sectors.length === 0) return
    if (!selectedSectorId) onSelectSectorId(sectors[0]!.id)
  }, [browseStep, sectors, selectedSectorId, onSelectSectorId])

  useEffect(() => {
    if (browseStep !== 1) return
    if (!selectedSector) return
    if (industries.length === 0) return
    if (!selectedIndustryId || !industries.some((i) => i.id === selectedIndustryId)) {
      onSelectIndustryId(industries[0]!.id)
    }
  }, [browseStep, selectedSector, industries, selectedIndustryId, onSelectIndustryId])

  useEffect(() => {
    if (browseStep !== 2) return
    if (!selectedIndustry) return
    if (companies.length === 0) return
    if (!selectedCompanyId || !companies.some((c) => c.id === selectedCompanyId)) {
      onSelectCompanyId(companies[0]!.id)
    }
  }, [browseStep, selectedIndustry, companies, selectedCompanyId, onSelectCompanyId])

  const selectedCompanyIndex = useMemo(() => {
    if (!selectedCompanyId) return 0
    const idx = companies.findIndex((c) => c.id === selectedCompanyId)
    return idx === -1 ? 0 : idx
  }, [companies, selectedCompanyId])

  const selectedCompany = companies[selectedCompanyIndex] ?? null

  const canNextFromSector = !!selectedSectorId
  const canNextFromIndustry = !!selectedIndustryId && industries.length > 0

  return (
    <div className="sidePanel">
      <div className="sidePanel__header">
        <h2 className="sidePanel__title">Guided browse</h2>
        <p className="sidePanel__subtitle">Follow the sector to industry to company path and focus nodes on the board.</p>
      </div>

      <div className="browseSteps" aria-label="Browse progress">
        <div className={`browseStep ${browseStep === 0 ? 'browseStep--active' : ''}`}>1. Sector</div>
        <div className={`browseStep ${browseStep === 1 ? 'browseStep--active' : ''}`}>2. Industry</div>
        <div className={`browseStep ${browseStep === 2 ? 'browseStep--active' : ''}`}>3. Company</div>
      </div>

      <label className="checkRow">
        <input
          type="checkbox"
          checked={autoFocusOnSelect}
          onChange={(e) => onSetAutoFocusOnSelect(e.target.checked)}
        />
        Auto-focus selection on the board
      </label>

      {sectors.length === 0 ? <div className="emptyState">No sectors yet. Switch to `Manage data` to add some.</div> : null}

      {browseStep === 0 ? (
        <div className="sidePanel__section">
          <label className="field">
            <span className="field__label">Choose a sector</span>
            <select
              className="field__input"
              value={selectedSectorId ?? ''}
              onChange={(e) => onSelectSectorId(e.target.value)}
            >
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <div className="buttonRow">
            <button className="btn" type="button" disabled={!canNextFromSector} onClick={() => onSetBrowseStep(1)}>
              Next: Industries
            </button>
          </div>
        </div>
      ) : null}

      {browseStep === 1 ? (
        <div className="sidePanel__section">
          {selectedSector ? (
            <label className="field">
              <span className="field__label">Choose an industry (in {selectedSector.name})</span>
              <select
                className="field__input"
                value={selectedIndustryId ?? ''}
                onChange={(e) => onSelectIndustryId(e.target.value)}
                disabled={industries.length === 0}
              >
                {industries.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="emptyState">Pick a sector first.</div>
          )}

          {industries.length === 0 ? <div className="emptyState">This sector has no industries yet.</div> : null}

          <div className="buttonRow">
            <button className="btn btn--secondary" type="button" onClick={() => onSetBrowseStep(0)}>
              Back
            </button>
            <button
              className="btn"
              type="button"
              disabled={!canNextFromIndustry}
              onClick={() => onSetBrowseStep(2)}
            >
              Next: Companies
            </button>
          </div>
        </div>
      ) : null}

      {browseStep === 2 ? (
        <div className="sidePanel__section">
          {selectedIndustry ? (
            <>
              <div className="browseIndustryHeader">
                <div className="browseIndustryHeader__title">{selectedIndustry.name}</div>
                <div className="browseIndustryHeader__meta">{companies.length} companies</div>
              </div>

              {companies.length === 0 ? <div className="emptyState">This industry has no companies yet.</div> : null}

              {companies.length > 0 ? (
                <>
                  <div className="buttonRow">
                    <button
                      className="btn btn--secondary"
                      type="button"
                      onClick={() => onSelectCompanyId(companies[Math.max(0, selectedCompanyIndex - 1)]!.id)}
                      disabled={selectedCompanyIndex <= 0}
                    >
                      Prev company
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => onSelectCompanyId(companies[Math.min(companies.length - 1, selectedCompanyIndex + 1)]!.id)}
                      disabled={selectedCompanyIndex >= companies.length - 1}
                    >
                      Next company
                    </button>
                  </div>

                  {selectedCompany ? (
                    <div className="companyFocusCard">
                      <div className="companyFocusCard__name">{selectedCompany.name}</div>
                      {selectedCompany.notes ? (
                        <div className="companyFocusCard__notes">{selectedCompany.notes}</div>
                      ) : (
                        <div className="companyFocusCard__notes companyFocusCard__notes--muted">
                          No notes. Use `Manage data` to add research notes.
                        </div>
                      )}
                      {(() => {
                        const frontierSummary =
                          selectedCompany.frontier && selectedCompany.frontier.length > 0
                            ? `Frontier: ${selectedCompany.frontier.join(', ')}`
                            : ''
                        const parts = [
                          selectedCompany.sector ? `Sector: ${selectedCompany.sector}` : '',
                          selectedCompany.industry ? `Industry: ${selectedCompany.industry}` : '',
                          selectedCompany.subIndustry ? `Sub-industry: ${selectedCompany.subIndustry}` : '',
                          selectedCompany.layer ? `Layer: ${selectedCompany.layer}` : '',
                          selectedCompany.businessModel ? `Business model: ${selectedCompany.businessModel}` : '',
                          frontierSummary,
                        ].filter(Boolean)

                        if (parts.length === 0) return null
                        return <div className="companyFocusCard__taxonomy">{parts.join(' • ')}</div>
                      })()}
                    </div>
                  ) : null}

                  <div className="companyList">
                    {companies.map((c) => {
                      const isActive = c.id === selectedCompanyId
                      return (
                        <button
                          key={c.id}
                          className={`companyChip ${isActive ? 'companyChip--active' : ''}`}
                          type="button"
                          onClick={() => onSelectCompanyId(c.id)}
                        >
                          {c.name}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="emptyState">Pick an industry first.</div>
          )}

          <div className="buttonRow">
            <button className="btn btn--secondary" type="button" onClick={() => onSetBrowseStep(1)}>
              Back
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

