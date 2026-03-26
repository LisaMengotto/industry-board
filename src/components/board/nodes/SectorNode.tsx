import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import type { BoardNodeData } from '../../../lib/boardGraph'
import type { NodeId } from '../../../lib/types'
import { useBoardSelection } from '../BoardSelectionContext'

export default function SectorNode({ id, data }: NodeProps<BoardNodeData>) {
  const { selectedNodeId, onSelect } = useBoardSelection()
  const selected = selectedNodeId === id

  return (
    <div
      className={`boardNode boardNode--sector ${selected ? 'boardNode--selected' : ''}`}
      style={{ width: data.width, height: data.height }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect({ nodeId: id as NodeId, kind: 'sector', sectorId: data.sectorId })
      }}
      role="button"
      aria-label={`Sector: ${data.label}`}
    >
      <div className="boardNode__title">{data.label}</div>
      {data.meta ? <div className="boardNode__meta">{data.meta}</div> : null}
      <Handle type="source" position={Position.Bottom} id="out" className="boardNode__handle" />
    </div>
  )
}

