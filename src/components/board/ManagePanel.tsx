import { useMemo, useState } from 'react'
import type { Industry, Sector } from '../../lib/types'
import { nodeId } from '../../lib/types'
import type { SelectedEntityInfo } from './BoardSelectionContext'
import {
  BUSINESS_MODEL_VALUES,
  FRONTIER_VALUES,
  INDUSTRY_VALUES,
  LAYER_VALUES,
  SECTOR_VALUES,
  getFieldHelp,
  mapBoardIndustryNameToIndustryValue,
  mapBoardSectorNameToSectorValue,
  type BusinessModelValue,
  type CompanyTaxonomy,
  type FrontierValue,
  type IndustryValue,
  type LayerValue,
  type SectorValue,
} from '../../lib/taxonomy'

export type ManagePanelProps = {
  sectors: Sector[]
  onSelectNode: (info: SelectedEntityInfo) => void
  onAddSector: (name: string) => void
  onAddIndustry: (sectorId: string, name: string) => void
  onAddCompany: (industryId: string, name: string, notes: string, taxonomy: CompanyTaxonomy) => void
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
  const firstSectorId = sectors.find((s) => !!s.id)?.id ?? ''

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
  const [sectorValueForNewCompany, setSectorValueForNewCompany] = useState<SectorValue | ''>(() => {
    const boardSectorName = sectors.find((s) => s.id === safeSectorIdForNewIndustry)?.name ?? ''
    return mapBoardSectorNameToSectorValue(boardSectorName) ?? ''
  })
  const [industryValueForNewCompany, setIndustryValueForNewCompany] = useState<IndustryValue | ''>(() => {
    const boardIndustryName = industryOptions[0]?.name ?? ''
    return mapBoardIndustryNameToIndustryValue(boardIndustryName) ?? ''
  })
  const [subIndustryForNewCompany, setSubIndustryForNewCompany] = useState('')
  const [layerValueForNewCompany, setLayerValueForNewCompany] = useState<LayerValue | ''>('')
  const [businessModelValueForNewCompany, setBusinessModelValueForNewCompany] = useState<BusinessModelValue | ''>('')
  const [frontierValuesForNewCompany, setFrontierValuesForNewCompany] = useState<FrontierValue[]>([])

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
          noValidate
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
          noValidate
        >
          <div className="formCard__title">Add Industry</div>
          <label className="field">
            <span className="field__label">Sector</span>
            <select
              className="field__input"
              value={safeSectorIdForNewIndustry}
              onChange={(e) => {
                const nextSectorId = e.target.value
                setSectorIdForNewIndustry(nextSectorId)
                const nextSector = sectors.find((s) => s.id === nextSectorId)
                const nextIndustry = nextSector?.industries[0]
                setIndustryIdForNewCompany(nextIndustry?.id ?? '')
                setSectorValueForNewCompany(mapBoardSectorNameToSectorValue(nextSector?.name) ?? '')
                setIndustryValueForNewCompany(mapBoardIndustryNameToIndustryValue(nextIndustry?.name) ?? '')
              }}
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
          <button className="btn" type="submit" disabled={sectors.length === 0 || !safeSectorIdForNewIndustry}>
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
            const taxonomy: CompanyTaxonomy = {
              sector: sectorValueForNewCompany || undefined,
              industry: industryValueForNewCompany || undefined,
              subIndustry: subIndustryForNewCompany.trim() || undefined,
              layer: layerValueForNewCompany || undefined,
              businessModel: businessModelValueForNewCompany || undefined,
              frontier: frontierValuesForNewCompany.length > 0 ? frontierValuesForNewCompany : undefined,
            }
            onAddCompany(safeIndustryIdForNewCompany, trimmed, newCompanyNotes.trim(), taxonomy)
            setNewCompanyName('')
            setNewCompanyNotes('')

            const boardSectorName = sectors.find((s) => s.id === safeSectorIdForNewIndustry)?.name ?? ''
            const boardIndustryName = industryOptions.find((i) => i.id === safeIndustryIdForNewCompany)?.name ?? ''
            setSectorValueForNewCompany(mapBoardSectorNameToSectorValue(boardSectorName) ?? '')
            setIndustryValueForNewCompany(mapBoardIndustryNameToIndustryValue(boardIndustryName) ?? '')

            setSubIndustryForNewCompany('')
            setLayerValueForNewCompany('')
            setBusinessModelValueForNewCompany('')
            setFrontierValuesForNewCompany([])
          }}
          noValidate
        >
          <div className="formCard__title">Add Company</div>
          <label className="field">
            <span className="field__label">Industry</span>
            <select
              className="field__input"
              value={safeIndustryIdForNewCompany}
              onChange={(e) => {
                const nextIndustryId = e.target.value
                setIndustryIdForNewCompany(nextIndustryId)

                const nextIndustryName = industryOptions.find((i) => i.id === nextIndustryId)?.name ?? ''
                const boardSectorName = sectors.find((s) => s.id === safeSectorIdForNewIndustry)?.name ?? ''

                setIndustryValueForNewCompany(mapBoardIndustryNameToIndustryValue(nextIndustryName) ?? '')
                setSectorValueForNewCompany(mapBoardSectorNameToSectorValue(boardSectorName) ?? '')
              }}
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
            <span className="field__label">Sector (taxonomy)</span>
            <select
              className="field__input"
              value={sectorValueForNewCompany}
              onChange={(e) => setSectorValueForNewCompany(e.target.value as SectorValue | '')}
            >
              <option value="">Unspecified</option>
              {SECTOR_VALUES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {getFieldHelp('sector') ? <div className="field__help">{getFieldHelp('sector')}</div> : null}
          </label>
          <label className="field">
            <span className="field__label">Industry (taxonomy)</span>
            <select
              className="field__input"
              value={industryValueForNewCompany}
              onChange={(e) => setIndustryValueForNewCompany(e.target.value as IndustryValue | '')}
            >
              <option value="">Unspecified</option>
              {INDUSTRY_VALUES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {getFieldHelp('industry') ? <div className="field__help">{getFieldHelp('industry')}</div> : null}
          </label>
          <label className="field">
            <span className="field__label">Sub-industry</span>
            <input
              className="field__input"
              value={subIndustryForNewCompany}
              onChange={(e) => setSubIndustryForNewCompany(e.target.value)}
              placeholder="e.g., Foundation models, Fraud detection, Payments infrastructure"
            />
            {getFieldHelp('subIndustry') ? <div className="field__help">{getFieldHelp('subIndustry')}</div> : null}
          </label>
          <label className="field">
            <span className="field__label">Layer</span>
            <select
              className="field__input"
              value={layerValueForNewCompany}
              onChange={(e) => setLayerValueForNewCompany(e.target.value as LayerValue | '')}
            >
              <option value="">Unspecified</option>
              {LAYER_VALUES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {getFieldHelp('layer') ? <div className="field__help">{getFieldHelp('layer')}</div> : null}
          </label>
          <label className="field">
            <span className="field__label">Business model</span>
            <select
              className="field__input"
              value={businessModelValueForNewCompany}
              onChange={(e) => setBusinessModelValueForNewCompany(e.target.value as BusinessModelValue | '')}
            >
              <option value="">Unspecified</option>
              {BUSINESS_MODEL_VALUES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {getFieldHelp('businessModel') ? (
              <div className="field__help">{getFieldHelp('businessModel')}</div>
            ) : null}
          </label>
          <label className="field">
            <span className="field__label">Frontier</span>
            <select
              multiple
              size={6}
              className="field__input"
              value={frontierValuesForNewCompany}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((o) => o.value) as FrontierValue[]
                setFrontierValuesForNewCompany(selected)
              }}
            >
              {FRONTIER_VALUES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {getFieldHelp('frontier') ? <div className="field__help">{getFieldHelp('frontier')}</div> : null}
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
          <button
            className="btn"
            type="submit"
            disabled={industryOptions.length === 0 || !safeIndustryIdForNewCompany}
          >
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

