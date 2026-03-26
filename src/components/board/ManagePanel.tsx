import { useMemo, useState } from 'react'
import type { Industry, Sector } from '../../lib/types'
import { nodeId } from '../../lib/types'
import type { SelectedEntityInfo } from './BoardSelectionContext'

export type ManagePanelProps = {
  sectors: Sector[]
  onSelectNode: (info: SelectedEntityInfo) => void
  onAddSector: (name: string) => void
  onAddIndustry: (sectorId: string, name: string) => void
  onAddCompany: (industryId: string, name: string, notes: string) => void
  onDeleteSector: (sectorId: string) => void
  onDeleteIndustry: (industryId: string) => void
  onDeleteCompany: (companyId: string) => void
}

export default function ManagePanel({
  sectors,
  onSelectNode,
  onAddSector,
  onAddIndustry,
  onAddCompany,
  onDeleteSector,
  onDeleteIndustry,
  onDeleteCompany,
}: ManagePanelProps) {
  const firstSectorId = sectors[0]?.id ?? ''

  const industriesForSelect = useMemo(() => {
    const map: Record<string, Industry[]> = {}
    for (const sector of sectors) map[sector.id] = sector.industries
    return map
  }, [sectors])

  const [newSectorName, setNewSectorName] = useState('')
  const [sectorIdForNewIndustry, setSectorIdForNewIndustry] = useState(firstSectorId)
  const [newIndustryName, setNewIndustryName] = useState('')

  const safeSectorIdForNewIndustry =
    sectorIdForNewIndustry && sectors.some((s) => s.id === sectorIdForNewIndustry)
      ? sectorIdForNewIndustry
      : firstSectorId

  const industryOptions = useMemo(() => {
    if (!safeSectorIdForNewIndustry) return []
    return industriesForSelect[safeSectorIdForNewIndustry] ?? []
  }, [industriesForSelect, safeSectorIdForNewIndustry])

  const [industryIdForNewCompany, setIndustryIdForNewCompany] = useState(industryOptions[0]?.id ?? '')
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyNotes, setNewCompanyNotes] = useState('')

  const safeIndustryIdForNewCompany =
    industryIdForNewCompany && industryOptions.some((i) => i.id === industryIdForNewCompany)
      ? industryIdForNewCompany
      : industryOptions[0]?.id ?? ''

  function selectEntity(info: SelectedEntityInfo) {
    onSelectNode(info)
  }

  return (
    <div className="sidePanel">
      <div className="sidePanel__header">
        <h2 className="sidePanel__title">Manage data</h2>
        <p className="sidePanel__subtitle">Add sectors, industries, and companies. Nodes appear automatically.</p>
      </div>

      <div className="sidePanel__section">
        <form
          className="formCard"
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = newSectorName.trim()
            if (!trimmed) return
            onAddSector(trimmed)
            setNewSectorName('')
          }}
        >
          <div className="formCard__title">Add Sector</div>
          <label className="field">
            <span className="field__label">Sector name</span>
            <input
              className="field__input"
              value={newSectorName}
              onChange={(e) => setNewSectorName(e.target.value)}
              placeholder="e.g., FinTech"
              required
            />
          </label>
          <button className="btn" type="submit">
            Add sector
          </button>
        </form>
      </div>

      <div className="sidePanel__section">
        <form
          className="formCard"
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = newIndustryName.trim()
            if (!trimmed) return
            if (!safeSectorIdForNewIndustry) return
            onAddIndustry(safeSectorIdForNewIndustry, trimmed)
            setNewIndustryName('')
          }}
        >
          <div className="formCard__title">Add Industry</div>
          <label className="field">
            <span className="field__label">Sector</span>
            <select
              className="field__input"
              value={safeSectorIdForNewIndustry}
              onChange={(e) => setSectorIdForNewIndustry(e.target.value)}
              disabled={sectors.length === 0}
              required
            >
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Industry name</span>
            <input
              className="field__input"
              value={newIndustryName}
              onChange={(e) => setNewIndustryName(e.target.value)}
              placeholder="e.g., Payments"
              required
            />
          </label>
          <button className="btn" type="submit" disabled={sectors.length === 0}>
            Add industry
          </button>
        </form>
      </div>

      <div className="sidePanel__section">
        <form
          className="formCard"
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = newCompanyName.trim()
            if (!trimmed) return
            if (!safeIndustryIdForNewCompany) return
            onAddCompany(safeIndustryIdForNewCompany, trimmed, newCompanyNotes.trim())
            setNewCompanyName('')
            setNewCompanyNotes('')
          }}
        >
          <div className="formCard__title">Add Company</div>
          <label className="field">
            <span className="field__label">Industry</span>
            <select
              className="field__input"
              value={safeIndustryIdForNewCompany}
              onChange={(e) => setIndustryIdForNewCompany(e.target.value)}
              disabled={industryOptions.length === 0}
              required
            >
              {industryOptions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Company name</span>
            <input
              className="field__input"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="e.g., Stripe"
              required
            />
          </label>
          <label className="field">
            <span className="field__label">Notes (optional)</span>
            <textarea
              className="field__input field__textarea"
              value={newCompanyNotes}
              onChange={(e) => setNewCompanyNotes(e.target.value)}
              placeholder="What to research?"
              rows={3}
            />
          </label>
          <button className="btn" type="submit" disabled={industryOptions.length === 0}>
            Add company
          </button>
        </form>
      </div>

      <div className="sidePanel__section">
        <div className="sidePanel__listHeader">
          <div className="sidePanel__listTitle">Current board</div>
          <div className="sidePanel__muted">{sectors.length} sectors</div>
        </div>

        {sectors.length === 0 ? (
          <div className="emptyState">No data yet. Add your first sector above.</div>
        ) : (
          <div className="boardTree">
            {sectors.map((sector) => (
              <div key={sector.id} className="treeNode">
                <div className="treeNode__header">
                  <button
                    className="treeNode__link"
                    type="button"
                    onClick={() =>
                      selectEntity({
                        nodeId: nodeId('sector', sector.id),
                        kind: 'sector',
                        sectorId: sector.id,
                      })
                    }
                  >
                    {sector.name}
                  </button>
                  <button
                    className="treeNode__btn treeNode__btn--danger"
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete sector "${sector.name}" and everything inside it?`)) {
                        onDeleteSector(sector.id)
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>

                {sector.industries.length === 0 ? (
                  <div className="treeNode__muted">No industries yet.</div>
                ) : (
                  <div className="treeChildren">
                    {sector.industries.map((industry) => (
                      <div key={industry.id} className="subNode">
                        <div className="subNode__header">
                          <button
                            className="treeNode__link subNode__link"
                            type="button"
                            onClick={() =>
                              selectEntity({
                                nodeId: nodeId('industry', industry.id),
                                kind: 'industry',
                                sectorId: sector.id,
                                industryId: industry.id,
                              })
                            }
                          >
                            {industry.name}
                          </button>
                          <button
                            className="treeNode__btn treeNode__btn--danger"
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete industry "${industry.name}"?`)) {
                                onDeleteIndustry(industry.id)
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>

                        {industry.companies.length === 0 ? (
                          <div className="subNode__muted">No companies yet.</div>
                        ) : (
                          <div className="companiesList">
                            {industry.companies.map((company) => (
                              <div key={company.id} className="companyRow">
                                <button
                                  className="companyRow__name"
                                  type="button"
                                  onClick={() =>
                                    selectEntity({
                                      nodeId: nodeId('company', company.id),
                                      kind: 'company',
                                      sectorId: sector.id,
                                      industryId: industry.id,
                                      companyId: company.id,
                                    })
                                  }
                                >
                                  {company.name}
                                </button>
                                <button
                                  className="companyRow__del"
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Delete company "${company.name}"?`)) {
                                      onDeleteCompany(company.id)
                                    }
                                  }}
                                >
                                  X
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

