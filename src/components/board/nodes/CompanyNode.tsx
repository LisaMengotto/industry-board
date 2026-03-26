import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import type { BoardNodeData } from '../../../lib/boardGraph'
import type { NodeId } from '../../../lib/types'
import { useBoardSelection } from '../BoardSelectionContext'

function truncate(s: string, maxLen: number) {
  if (s.length <= maxLen) return s
  return `${s.slice(0, Math.max(0, maxLen - 1))}...`
}

export default function CompanyNode({ id, data }: NodeProps<BoardNodeData>) {
  const { selectedNodeId, onSelect } = useBoardSelection()
  const selected = selectedNodeId === id

  const tagsPreview = (data.tags ?? []).slice(0, 4)
  const tagsMeta =
    tagsPreview.length > 0 ? `${tagsPreview.join(', ')}${(data.tags?.length ?? 0) > tagsPreview.length ? '…' : ''}` : ''
  const fallbackMeta = [tagsMeta, data.description ? truncate(data.description, 38) : '', data.notes ? truncate(data.notes, 38) : '']
    .filter(Boolean)
    .join(' | ')

  return (
    <div
      className={`boardNode boardNode--company ${selected ? 'boardNode--selected' : ''}`}
      style={{ width: data.width, height: data.height }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect({
          nodeId: id as NodeId,
          kind: 'company',
          companyId: data.companyId,
        })
      }}
      role="button"
      aria-label={`Company: ${data.label}`}
    >
      <div className="boardNode__title">{data.label}</div>
      {data.notes ? <div className="boardNode__meta">{truncate(data.notes, 44)}</div> : null}
      {!data.notes && fallbackMeta ? <div className="boardNode__meta">{truncate(fallbackMeta, 44)}</div> : null}
      <Handle type="target" position={Position.Top} id="in" className="boardNode__handle" />
      <Handle type="source" position={Position.Bottom} id="out" className="boardNode__handle" />
    </div>
  )
}

