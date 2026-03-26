/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'
import type { NodeId, NodeKind } from '../../lib/types'

export type SelectedEntityInfo = {
  nodeId: NodeId
  kind: NodeKind
  sectorId?: string
  industryId?: string
  companyId?: string
}

type BoardSelectionContextValue = {
  selectedNodeId: NodeId | null
  onSelect: (info: SelectedEntityInfo) => void
}

const BoardSelectionContext = createContext<BoardSelectionContextValue | null>(null)

export function useBoardSelection() {
  const ctx = useContext(BoardSelectionContext)
  if (!ctx) throw new Error('useBoardSelection must be used within BoardSelectionContext.Provider')
  return ctx
}

export default BoardSelectionContext

