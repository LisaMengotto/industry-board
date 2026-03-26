import { useEffect, useMemo, useState } from 'react'
import type { BoardData, Company, Industry, Sector } from './lib/types'
import { loadBoardData, saveBoardData, clearBoardData } from './lib/storage'
import { newId } from './lib/uid'
import { buildBoardGraph, ensureLayoutForSectors } from './lib/boardGraph'
import { nodeId } from './lib/types'
import type { CompanyTaxonomy } from './lib/taxonomy'
import type { SelectedEntityInfo } from './components/board/BoardSelectionContext'
import Whiteboard from './components/board/Whiteboard'
import ManagePanel from './components/board/ManagePanel'
import BrowsePanel, { type BrowseStep } from './components/board/BrowsePanel'

import './App.css'

type Mode = 'manage' | 'browse'

function ensureLayoutState(data: BoardData): BoardData {
  const { layout, didChange } = ensureLayoutForSectors(data.sectors, data.layout)
  return didChange ? { ...data, layout } : data
}

function findIndustryParent(
  sectors: Sector[],
  industryId: string
): { sectorId: string; industry: Industry } | null {
  for (const sector of sectors) {
    const found = sector.industries.find((i) => i.id === industryId)
    if (found) return { sectorId: sector.id, industry: found }
  }
  return null
}

function findCompanyParent(
  sectors: Sector[],
  companyId: string
): { sectorId: string; industryId: string; company: Company } | null {
  for (const sector of sectors) {
    for (const industry of sector.industries) {
      const found = industry.companies.find((c) => c.id === companyId)
      if (found) return { sectorId: sector.id, industryId: industry.id, company: found }
    }
  }
  return null
}

function allNodeIds(sectors: Sector[]) {
  const ids = new Set<string>()
  for (const sector of sectors) {
    ids.add(nodeId('sector', sector.id))
    for (const industry of sector.industries) {
      ids.add(nodeId('industry', industry.id))
      for (const company of industry.companies) ids.add(nodeId('company', company.id))
    }
  }
  return ids
}

export default function App() {
  const [mode, setMode] = useState<Mode>('browse')
  const [boardData, setBoardData] = useState<BoardData>(() => ensureLayoutState(loadBoardData()))

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [browseStep, setBrowseStep] = useState<BrowseStep>(0)

  const [autoFocusOnSelect, setAutoFocusOnSelect] = useState(true)
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null)
  const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)

  const expectedNodeIds = useMemo(() => allNodeIds(boardData.sectors), [boardData.sectors])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveBoardData(boardData)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [boardData])

  const safeSelectedNodeId = selectedNodeId && expectedNodeIds.has(selectedNodeId) ? selectedNodeId : null

  function handleSelectNode(info: SelectedEntityInfo) {
    setSelectedNodeId(info.nodeId)

    if (info.kind === 'sector') {
      setBrowseStep(0)
      setSelectedSectorId(info.sectorId)
      setSelectedIndustryId(null)
      setSelectedCompanyId(null)
      return
    }

    if (info.kind === 'industry') {
      setBrowseStep(1)
      setSelectedSectorId(info.sectorId)
      setSelectedIndustryId(info.industryId ?? null)
      setSelectedCompanyId(null)
      return
    }

    setBrowseStep(2)
    setSelectedSectorId(info.sectorId)
    setSelectedIndustryId(info.industryId ?? null)
    setSelectedCompanyId(info.companyId ?? null)
  }

  function selectSectorInBrowse(sectorIdToSelect: string) {
    setSelectedSectorId(sectorIdToSelect)
    const sector = boardData.sectors.find((s) => s.id === sectorIdToSelect) ?? null
    setSelectedIndustryId(sector?.industries[0]?.id ?? null)
    setSelectedCompanyId(sector?.industries[0]?.companies[0]?.id ?? null)
    setSelectedNodeId(nodeId('sector', sectorIdToSelect))
  }

  function selectIndustryInBrowse(industryIdToSelect: string) {
    const parent = findIndustryParent(boardData.sectors, industryIdToSelect)
    if (!parent) return

    setSelectedSectorId(parent.sectorId)
    setSelectedIndustryId(parent.industry.id)
    setSelectedCompanyId(parent.industry.companies[0]?.id ?? null)
    setSelectedNodeId(nodeId('industry', parent.industry.id))
  }

  function selectCompanyInBrowse(companyIdToSelect: string) {
    const parent = findCompanyParent(boardData.sectors, companyIdToSelect)
    if (!parent) return

    setSelectedSectorId(parent.sectorId)
    setSelectedIndustryId(parent.industryId)
    setSelectedCompanyId(parent.company.id)
    setSelectedNodeId(nodeId('company', parent.company.id))
  }

  function handleClearSelection() {
    setSelectedNodeId(null)
  }

  function addSector(name: string) {
    const sector: Sector = { id: newId(), name, industries: [], createdAt: Date.now() }
    setBoardData((prev) => ensureLayoutState({ ...prev, sectors: [...prev.sectors, sector] }))
  }

  function addIndustry(sectorIdValue: string, name: string) {
    const industry: Industry = { id: newId(), name, companies: [], createdAt: Date.now() }
    setBoardData((prev) =>
      ensureLayoutState({
        ...prev,
        sectors: prev.sectors.map((s) =>
          s.id === sectorIdValue ? { ...s, industries: [...s.industries, industry] } : s
        ),
      })
    )
  }

  function addCompany(industryIdValue: string, name: string, notes: string, taxonomy: CompanyTaxonomy) {
    const company: Company = { id: newId(), name, notes, createdAt: Date.now(), ...taxonomy }
    setBoardData((prev) =>
      ensureLayoutState({
        ...prev,
        sectors: prev.sectors.map((s) => ({
          ...s,
          industries: s.industries.map((i) =>
            i.id === industryIdValue ? { ...i, companies: [...i.companies, company] } : i
          ),
        })),
      })
    )
  }

  function deleteSector(sectorIdValue: string) {
    setBoardData((prev) => ensureLayoutState({ ...prev, sectors: prev.sectors.filter((s) => s.id !== sectorIdValue) }))
    if (selectedSectorId === sectorIdValue) {
      setSelectedSectorId(null)
      setSelectedIndustryId(null)
      setSelectedCompanyId(null)
      setSelectedNodeId(null)
    }
  }

  function deleteIndustry(industryIdValue: string) {
    setBoardData((prev) =>
      ensureLayoutState({
        ...prev,
        sectors: prev.sectors.map((s) => ({
          ...s,
          industries: s.industries.filter((i) => i.id !== industryIdValue),
        })),
      })
    )
    if (selectedIndustryId === industryIdValue) {
      setSelectedIndustryId(null)
      setSelectedCompanyId(null)
      setSelectedNodeId(null)
    }
  }

  function deleteCompany(companyIdValue: string) {
    setBoardData((prev) =>
      ensureLayoutState({
        ...prev,
        sectors: prev.sectors.map((s) => ({
          ...s,
          industries: s.industries.map((i) => ({
            ...i,
            companies: i.companies.filter((c) => c.id !== companyIdValue),
          })),
        })),
      })
    )
    if (selectedCompanyId === companyIdValue) {
      setSelectedCompanyId(null)
      setSelectedNodeId(null)
    }
  }

  function handleNodePositionChange(nodeIdValue: string, position: { x: number; y: number }) {
    setBoardData((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        [nodeIdValue]: { x: position.x, y: position.y },
      },
    }))
  }

  function handleResetLayout() {
    setBoardData((prev) => ensureLayoutState({ ...prev, layout: {} }))
  }

  function handleResetBoard() {
    if (!confirm('Reset the entire board and clear localStorage?')) return
    clearBoardData()
    window.location.reload()
  }

  const { nodes, edges } = useMemo(
    () => buildBoardGraph(boardData.sectors, boardData.layout),
    [boardData.sectors, boardData.layout]
  )

  return (
    <div className="appRoot">
      <aside className="appSidebar">
        <div className="sidebarTop">
          <div className="brand">
            <div className="brand__name">Industry research board</div>
            <div className="brand__meta">Sectors to industries to companies</div>
          </div>

          <div className="modeSwitch" role="tablist" aria-label="Board mode">
            <button
              type="button"
              className={`modeSwitch__btn ${mode === 'manage' ? 'modeSwitch__btn--active' : ''}`}
              onClick={() => setMode('manage')}
            >
              Manage data
            </button>
            <button
              type="button"
              className={`modeSwitch__btn ${mode === 'browse' ? 'modeSwitch__btn--active' : ''}`}
              onClick={() => setMode('browse')}
            >
              Guided browse
            </button>
          </div>
        </div>

        <div className="sidebarBody">
          {mode === 'manage' ? (
            <ManagePanel
              sectors={boardData.sectors}
              onSelectNode={(info) => {
                handleSelectNode(info)
              }}
              onAddSector={addSector}
              onAddIndustry={addIndustry}
              onAddCompany={addCompany}
              onDeleteSector={deleteSector}
              onDeleteIndustry={deleteIndustry}
              onDeleteCompany={deleteCompany}
            />
          ) : (
            <BrowsePanel
              sectors={boardData.sectors}
              browseStep={browseStep}
              selectedSectorId={selectedSectorId}
              selectedIndustryId={selectedIndustryId}
              selectedCompanyId={selectedCompanyId}
              autoFocusOnSelect={autoFocusOnSelect}
              onSetAutoFocusOnSelect={setAutoFocusOnSelect}
              onSelectSectorId={(id) => {
                setBrowseStep(0)
                selectSectorInBrowse(id)
              }}
              onSelectIndustryId={(id) => {
                setBrowseStep(1)
                selectIndustryInBrowse(id)
              }}
              onSelectCompanyId={(id) => {
                setBrowseStep(2)
                selectCompanyInBrowse(id)
              }}
              onSetBrowseStep={(step) => setBrowseStep(step)}
            />
          )}
        </div>

        <div className="sidebarFooter">
          <div className="sidebarFooter__hint">
            {safeSelectedNodeId ? `Selected node: ${safeSelectedNodeId}` : 'Click nodes on the board to focus them.'}
          </div>
          <button className="btn btn--danger btn--full" type="button" onClick={handleResetBoard}>
            Reset board data
          </button>
        </div>
      </aside>

      <main className="appCanvas">
        <Whiteboard
          nodes={nodes}
          edges={edges}
          selectedNodeId={safeSelectedNodeId}
          autoFocusOnSelect={autoFocusOnSelect}
          onSelectNode={handleSelectNode}
          onClearSelection={handleClearSelection}
          onNodePositionChange={handleNodePositionChange}
          onResetLayout={handleResetLayout}
        />
      </main>
    </div>
  )
}
