import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import type { BoardNodeData } from '../../../lib/boardGraph'
import { useBoardSelection } from '../BoardSelectionContext'

export default function IndustryNode({ id, data }: NodeProps<BoardNodeData>) {
  const { selectedNodeId, onSelect } = useBoardSelection()
  const selected = selectedNodeId === id

  return (
    <div
      className={`boardNode boardNode--industry ${selected ? 'boardNode--selected' : ''}`}
      style={{ width: data.width, height: data.height }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect({
          nodeId: id,
          kind: 'industry',
          sectorId: data.sectorId,
          industryId: data.industryId,
        })
      }}
      role="button"
      aria-label={`Industry: ${data.label}`}
    >
      <div className="boardNode__title">{data.label}</div>
      {data.meta ? <div className="boardNode__meta">{data.meta}</div> : null}
      <Handle type="target" position={Position.Top} id="in" className="boardNode__handle" />
      <Handle type="source" position={Position.Bottom} id="out" className="boardNode__handle" />
    </div>
  )
}

