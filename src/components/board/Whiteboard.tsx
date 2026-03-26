import { useEffect, useMemo, useRef } from 'react'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import type { ReactFlowInstance } from 'reactflow'
import type { Edge, Node } from 'reactflow'
import type { BoardNodeData } from '../../lib/boardGraph'
import type { NodeId } from '../../lib/types'
import BoardSelectionContext, { type SelectedEntityInfo } from './BoardSelectionContext'
import CompanyNode from './nodes/CompanyNode'

import { BackgroundVariant } from '@reactflow/background'
import 'reactflow/dist/style.css'
import './Whiteboard.css'

export type WhiteboardProps = {
  nodes: Node<BoardNodeData>[]
  edges: Edge[]
  selectedNodeId: NodeId | null
  autoFocusOnSelect: boolean
  onSelectNode: (info: SelectedEntityInfo) => void
  onClearSelection: () => void
  onNodePositionChange: (nodeId: string, position: { x: number; y: number }) => void
  onResetLayout: () => void
}

export default function Whiteboard({
  nodes,
  edges,
  selectedNodeId,
  autoFocusOnSelect,
  onSelectNode,
  onClearSelection,
  onNodePositionChange,
  onResetLayout,
}: WhiteboardProps) {
  const rfInstanceRef = useRef<ReactFlowInstance<BoardNodeData, unknown> | null>(null)
  const hasFitOnInitRef = useRef(false)

  const nodeTypes = useMemo(
    () => ({
      company: CompanyNode,
    }),
    []
  )

  useEffect(() => {
    if (!autoFocusOnSelect) return
    if (!selectedNodeId) return
    const rf = rfInstanceRef.current
    if (!rf) return

    rf.fitView({
      nodes: [{ id: selectedNodeId }],
      padding: 0.25,
      duration: 500,
      minZoom: 0.35,
      maxZoom: 1.4,
    })
  }, [autoFocusOnSelect, selectedNodeId])

  return (
    <div className="whiteboardWrap">
      <BoardSelectionContext.Provider value={{ selectedNodeId, onSelect: onSelectNode }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          nodesFocusable={false}
          edgesFocusable={false}
          nodeOrigin={[0, 0]}
          proOptions={{ hideAttribution: true }}
          onInit={(instance) => {
            rfInstanceRef.current = instance
            if (!hasFitOnInitRef.current && nodes.length > 0) {
              hasFitOnInitRef.current = true
              instance.fitView({ padding: 0.25, duration: 400 })
            }
          }}
          onPaneClick={() => onClearSelection()}
          onNodeClick={(_evt, node) => {
            // Nodes handle click themselves via BoardSelectionContext, so we only clear on empty pane.
            // Still keep this handler to prevent default React Flow selection behavior from interfering.
            _evt.stopPropagation()
            void node
          }}
          onNodeDragStop={(_evt, node) => {
            onNodePositionChange(node.id, node.position)
          }}
        >
          <Background gap={26} size={1} variant={BackgroundVariant.Dots} />
          <MiniMap nodeColor={() => 'rgb(34 197 94)'} />
          <Controls showInteractive={false} />
        </ReactFlow>

        <div className="whiteboardOverlay" aria-label="Whiteboard actions">
          <button
            className="whiteboardOverlay__btn"
            type="button"
            onClick={() => rfInstanceRef.current?.fitView({ padding: 0.25, duration: 350 })}
            disabled={nodes.length === 0}
          >
            Fit view
          </button>
          <button
            className="whiteboardOverlay__btn whiteboardOverlay__btn--danger"
            type="button"
            onClick={onResetLayout}
            disabled={nodes.length === 0}
          >
            Reset layout
          </button>
        </div>
      </BoardSelectionContext.Provider>
    </div>
  )
}

