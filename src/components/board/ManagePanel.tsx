import { useMemo, useState } from 'react'
import type { Company } from '../../lib/types'
import TagEditor from './TagEditor'

export type ManagePanelProps = {
  companies: Company[]
  tags: string[]
  selectedCompanyId: string | null
  onSelectCompanyId: (companyId: string) => void
  onAddTag: (tag: string) => void
  onAddCompany: (input: { name: string; tags: string[]; description?: string; notes?: string; website?: string }) => void
  onUpdateCompany: (
    companyId: string,
    patch: { name?: string; tags?: string[]; description?: string; notes?: string; website?: string }
  ) => void
  onDeleteCompany: (companyId: string) => void
}

function EditCompanyForm({
  company,
  tags,
  onUpdateCompany,
  onDeleteCompany,
}: {
  company: Company
  tags: string[]
  onUpdateCompany: ManagePanelProps['onUpdateCompany']
  onDeleteCompany: ManagePanelProps['onDeleteCompany']
}) {
  const [editName, setEditName] = useState(company.name)
  const [editTags, setEditTags] = useState<string[]>(company.tags ?? [])
  const [editDescription, setEditDescription] = useState(company.description ?? '')
  const [editNotes, setEditNotes] = useState(company.notes ?? '')
  const [editWebsite, setEditWebsite] = useState(company.website ?? '')

  return (
    <div className="sidePanel__section">
      <div className="formCard__title">Edit Selected Company</div>

      <div className="formCard">
        <label className="field">
          <span className="field__label">Company name</span>
          <input className="field__input" value={editName} onChange={(e) => setEditName(e.target.value)} />
        </label>

        <label className="field">
          <span className="field__label">Tags</span>
          <TagEditor
            value={editTags}
            availableTags={tags}
            onChange={setEditTags}
            placeholder="Add/remove tags"
            suggestionsLabel={`${tags.length} total`}
          />
        </label>

        <label className="field">
          <span className="field__label">Description (optional)</span>
          <textarea
            className="field__input field__textarea"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={3}
          />
        </label>

        <label className="field">
          <span className="field__label">Notes (optional)</span>
          <textarea
            className="field__input field__textarea"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={3}
          />
        </label>

        <label className="field">
          <span className="field__label">Website (optional)</span>
          <input
            className="field__input"
            value={editWebsite}
            onChange={(e) => setEditWebsite(e.target.value)}
            placeholder="https://example.com"
          />
        </label>

        <div className="buttonRow">
          <button
            className="btn"
            type="button"
            onClick={() =>
              onUpdateCompany(company.id, {
                name: editName,
                tags: editTags,
                description: editDescription.trim() ? editDescription : undefined,
                notes: editNotes.trim() ? editNotes : undefined,
                website: editWebsite.trim() ? editWebsite : undefined,
              })
            }
          >
            Save changes
          </button>
          <button
            className="btn btn--danger"
            type="button"
            onClick={() => {
              if (!confirm(`Delete company "${company.name}"?`)) return
              onDeleteCompany(company.id)
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManagePanel({
  companies,
  tags,
  selectedCompanyId,
  onSelectCompanyId,
  onAddTag,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
}: ManagePanelProps) {
  const selectedCompany = useMemo(
    () => (selectedCompanyId ? companies.find((c) => c.id === selectedCompanyId) ?? null : null),
    [companies, selectedCompanyId]
  )

  const [tagDraft, setTagDraft] = useState('')

  const [newName, setNewName] = useState('')
  const [newTags, setNewTags] = useState<string[]>([])
  const [newDescription, setNewDescription] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newWebsite, setNewWebsite] = useState('')

  return (
    <div className="sidePanel">
      <div className="sidePanel__header">
        <h2 className="sidePanel__title">Manage data</h2>
        <p className="sidePanel__subtitle">Add companies and assign tags. The board clusters by shared tags.</p>
      </div>

      <div className="sidePanel__section">
        <form
          className="formCard"
          onSubmit={(e) => {
            e.preventDefault()
            onAddCompany({
              name: newName,
              tags: newTags,
              description: newDescription.trim() ? newDescription : undefined,
              notes: newNotes.trim() ? newNotes : undefined,
              website: newWebsite.trim() ? newWebsite : undefined,
            })
            setNewName('')
            setNewTags([])
            setNewDescription('')
            setNewNotes('')
            setNewWebsite('')
          }}
          noValidate
        >
          <div className="formCard__title">Add Company</div>

          <label className="field">
            <span className="field__label">Company name</span>
            <input
              className="field__input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Stripe"
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Tags</span>
            <TagEditor
              value={newTags}
              availableTags={tags}
              onChange={setNewTags}
              placeholder="Type tags and press Enter (comma-separated)"
              suggestionsLabel={`${tags.length} total`}
            />
          </label>

          <label className="field">
            <span className="field__label">Description (optional)</span>
            <textarea
              className="field__input field__textarea"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What does it do?"
              rows={3}
            />
          </label>

          <label className="field">
            <span className="field__label">Notes (optional)</span>
            <textarea
              className="field__input field__textarea"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Research notes / insights"
              rows={3}
            />
          </label>

          <label className="field">
            <span className="field__label">Website (optional)</span>
            <input
              className="field__input"
              value={newWebsite}
              onChange={(e) => setNewWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </label>

          <button className="btn" type="submit" disabled={!newName.trim()}>
            Add company
          </button>
        </form>
      </div>

      <div className="sidePanel__section">
        <form
          className="formCard"
          onSubmit={(e) => {
            e.preventDefault()
            onAddTag(tagDraft)
            setTagDraft('')
          }}
          noValidate
        >
          <div className="formCard__title">Add Tag</div>

          <label className="field">
            <span className="field__label">Tag</span>
            <input
              className="field__input"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              placeholder="e.g., Robotics"
            />
          </label>

          <button className="btn" type="submit" disabled={!tagDraft.trim()}>
            Add tag
          </button>
        </form>
      </div>

      {selectedCompany ? (
        <EditCompanyForm
          key={selectedCompany.id}
          company={selectedCompany}
          tags={tags}
          onUpdateCompany={onUpdateCompany}
          onDeleteCompany={onDeleteCompany}
        />
      ) : null}

      <div className="sidePanel__section">
        <div className="sidePanel__listHeader">
          <div className="sidePanel__listTitle">Current companies</div>
          <div className="sidePanel__muted">{companies.length} companies</div>
        </div>

        {companies.length === 0 ? (
          <div className="emptyState">No data yet. Add your first company above.</div>
        ) : (
          <div className="companiesList">
            {companies
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((c) => {
                const isActive = c.id === selectedCompanyId
                const tagPreview = (c.tags ?? []).slice(0, 3)
                const meta = tagPreview.length > 0 ? tagPreview.join(', ') : c.description ? c.description : c.notes
                return (
                  <div key={c.id} className="companyRow">
                    <button
                      className={`companyRow__name ${isActive ? 'companyRow__name--active' : ''}`}
                      type="button"
                      onClick={() => onSelectCompanyId(c.id)}
                      title={c.name}
                    >
                      {c.name}
                    </button>
                    <button
                      className="companyRow__del"
                      type="button"
                      onClick={() => {
                        onSelectCompanyId(c.id)
                      }}
                      title={meta ? String(meta) : 'Edit'}
                    >
                      Edit
                    </button>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}

