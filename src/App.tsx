import { useEffect, useMemo, useState } from 'react'
import type { BoardData, Company, NodeId } from './lib/types'
import { loadBoardData, saveBoardData, clearBoardData } from './lib/storage'
import { newId } from './lib/uid'
import { buildBoardGraph, ensureLayoutForCompanies } from './lib/boardGraph'
import { nodeId } from './lib/types'
import type { SelectedEntityInfo } from './components/board/BoardSelectionContext'
import Whiteboard from './components/board/Whiteboard'
import ManagePanel from './components/board/ManagePanel'
import BrowsePanel from './components/board/BrowsePanel'

import './App.css'

type Mode = 'manage' | 'explore'

function ensureLayoutState(data: BoardData): BoardData {
  const { layout, didChange } = ensureLayoutForCompanies(data.companies, data.layout)
  return didChange ? { ...data, layout } : data
}

export default function App() {
  const [mode, setMode] = useState<Mode>('manage')
  const [boardData, setBoardData] = useState<BoardData>(() => ensureLayoutState(loadBoardData()))

  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null)

  const [autoFocusOnSelect, setAutoFocusOnSelect] = useState(true)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)

  const expectedNodeIds = useMemo(
    () => new Set(boardData.companies.map((c) => nodeId('company', c.id))),
    [boardData.companies]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveBoardData(boardData)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [boardData])

  const safeSelectedNodeId = selectedNodeId && expectedNodeIds.has(selectedNodeId) ? selectedNodeId : null

  function normalizeTagKey(tag: string) {
    return tag.trim().toLowerCase().replace(/\s+/g, ' ')
  }

  function dedupeTags(tags: string[]) {
    const out: string[] = []
    const seen = new Set<string>()
    for (const t of tags) {
      const tag = t.trim()
      if (!tag) continue
      const key = normalizeTagKey(tag)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(tag)
    }
    return out
  }

  function mergeTagLibraries(existing: string[], incoming: string[]) {
    const out = [...existing]
    const seen = new Set(existing.map((t) => normalizeTagKey(t)))
    for (const t of incoming) {
      const tag = t.trim()
      if (!tag) continue
      const key = normalizeTagKey(tag)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(tag)
    }
    return out
  }

  function selectCompany(companyIdToSelect: string | null) {
    setSelectedCompanyId(companyIdToSelect)
    setSelectedNodeId(companyIdToSelect ? nodeId('company', companyIdToSelect) : null)
  }

  function handleSelectNode(info: SelectedEntityInfo) {
    if (info.kind === 'company') {
      selectCompany(info.companyId ?? null)
      return
    }
    // Keep selection logic company-only for now.
    setSelectedNodeId(info.nodeId)
    setSelectedCompanyId(null)
  }

  function handleClearSelection() {
    selectCompany(null)
  }

  type AddCompanyInput = {
    name: string
    tags: string[]
    description?: string
    notes?: string
    website?: string
  }

  type UpdateCompanyInput = {
    name?: string
    tags?: string[]
    description?: string
    notes?: string
    website?: string
  }

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed) return
    setBoardData((prev) => ({ ...prev, tags: mergeTagLibraries(prev.tags, [trimmed]) }))
  }

  function addCompany(input: AddCompanyInput) {
    const trimmedName = input.name.trim()
    if (!trimmedName) return

    const nextTags = dedupeTags(input.tags ?? [])

    const company: Company = {
      id: newId(),
      name: trimmedName,
      tags: nextTags,
      description: input.description?.trim() ? input.description.trim() : undefined,
      notes: input.notes?.trim() ? input.notes.trim() : undefined,
      website: input.website?.trim() ? input.website.trim() : undefined,
      createdAt: Date.now(),
    }

    setBoardData((prev) =>
      ensureLayoutState({
        ...prev,
        companies: [...prev.companies, company],
        tags: mergeTagLibraries(prev.tags, nextTags),
      })
    )
    selectCompany(company.id)
  }

  function updateCompany(companyIdValue: string, patch: UpdateCompanyInput) {
    setBoardData((prev) => {
      const idx = prev.companies.findIndex((c) => c.id === companyIdValue)
      if (idx === -1) return prev
      const current = prev.companies[idx]!

      const nextTags = patch.tags ? dedupeTags(patch.tags) : current.tags
      const nextCompany: Company = {
        ...current,
        name: patch.name ? patch.name.trim() : current.name,
        tags: nextTags,
        description: patch.description !== undefined ? (patch.description.trim() ? patch.description.trim() : undefined) : current.description,
        notes: patch.notes !== undefined ? (patch.notes.trim() ? patch.notes.trim() : undefined) : current.notes,
        website: patch.website !== undefined ? (patch.website.trim() ? patch.website.trim() : undefined) : current.website,
      }

      const nextTagsLibrary = mergeTagLibraries(prev.tags, nextTags)
      const nextCompanies = prev.companies.map((c) => (c.id === companyIdValue ? nextCompany : c))
      return ensureLayoutState({ ...prev, companies: nextCompanies, tags: nextTagsLibrary })
    })
  }

  function deleteCompany(companyIdValue: string) {
    setBoardData((prev) =>
      ensureLayoutState({
        ...prev,
        companies: prev.companies.filter((c) => c.id !== companyIdValue),
      })
    )
    if (selectedCompanyId === companyIdValue) {
      selectCompany(null)
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
    () => buildBoardGraph(boardData.companies, boardData.layout),
    [boardData.companies, boardData.layout]
  )

  return (
    <div className="appRoot">
      <aside className="appSidebar">
        <div className="sidebarTop">
          <div className="brand">
            <div className="brand__name">Industry research board</div>
            <div className="brand__meta">Tags-first company graph</div>
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
              className={`modeSwitch__btn ${mode === 'explore' ? 'modeSwitch__btn--active' : ''}`}
              onClick={() => setMode('explore')}
            >
              Explore tags
            </button>
          </div>
        </div>

        <div className="sidebarBody">
          {mode === 'manage' ? (
            <ManagePanel
              companies={boardData.companies}
              tags={boardData.tags}
              selectedCompanyId={selectedCompanyId}
              onSelectCompanyId={(id) => selectCompany(id)}
              onAddTag={addTag}
              onAddCompany={addCompany}
              onUpdateCompany={updateCompany}
              onDeleteCompany={deleteCompany}
            />
          ) : (
            <BrowsePanel
              selectedCompanyId={selectedCompanyId}
              companies={boardData.companies}
              tags={boardData.tags}
              autoFocusOnSelect={autoFocusOnSelect}
              onSetAutoFocusOnSelect={setAutoFocusOnSelect}
              onSelectCompanyId={(id) => selectCompany(id)}
            />
          )}
        </div>

        <div className="sidebarFooter">
          <div className="sidebarFooter__hint">
            {selectedCompanyId ? (
              <>
                Selected company: {boardData.companies.find((c) => c.id === selectedCompanyId)?.name ?? selectedCompanyId}
              </>
            ) : (
              'Click company nodes to focus them.'
            )}
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
