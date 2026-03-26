import { useMemo, useId, useState } from 'react'

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

function parseTagCandidates(text: string) {
  return text
    .split(/[,\n]/g)
    .map((t) => t.trim())
    .filter(Boolean)
}

export type TagEditorProps = {
  value: string[]
  availableTags: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  suggestionsLabel?: string
}

export default function TagEditor({ value, availableTags, onChange, placeholder, suggestionsLabel }: TagEditorProps) {
  const [draft, setDraft] = useState('')
  const datalistId = useId()

  const canonicalValue = useMemo(() => dedupeTags(value ?? []), [value])

  function addFromDraft() {
    const candidates = parseTagCandidates(draft)
    if (candidates.length === 0) return
    const next = dedupeTags([...canonicalValue, ...candidates])
    onChange(next)
    setDraft('')
  }

  return (
    <div>
      <datalist id={datalistId}>
        {availableTags.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <div className="tagEditor__inputRow">
        <input
          className="field__input"
          style={{ flex: '1 1 auto' }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder ?? 'Type tags and press Enter (comma-separated)'}
          list={datalistId}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addFromDraft()
            }
          }}
        />
        <button
          className="btn"
          type="button"
          style={{ flex: '0 0 auto', padding: '9px 10px' }}
          onClick={addFromDraft}
        >
          Add
        </button>
      </div>

      <div className="tagEditor__chips">
        {canonicalValue.length === 0 ? (
          <div className="tagEditor__muted">No tags yet.</div>
        ) : (
          canonicalValue.map((tag) => (
            <div key={tag} className="tagChip" title={tag}>
              <span className="tagChip__label">{tag}</span>
              <button
                type="button"
                className="tagChip__remove"
                aria-label={`Remove tag ${tag}`}
                onClick={() => onChange(canonicalValue.filter((t) => t !== tag))}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {suggestionsLabel && availableTags.length > 0 ? (
        <div className="tagEditor__help">
          Suggestions available: {suggestionsLabel}
        </div>
      ) : null}
    </div>
  )
}

