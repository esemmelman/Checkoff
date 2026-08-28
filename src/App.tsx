import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { RichTextModal } from './components/RichTextModal'
import { CHECKOFF_TABLE, supabase } from './supabase'
import type { CheckoffItem, Filter } from './types'

export default function App() {
  const [items, setItems] = useState<CheckoffItem[]>([])
  const [name, setName] = useState('')
  const [filter, setFilter] = useState<Filter>('unchecked')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [notesItem, setNotesItem] = useState<CheckoffItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(async () => {
    const { data, error: loadError } = await supabase.from(CHECKOFF_TABLE).select('*').order('checkoff_created_at', { ascending: false })
    if (loadError) setError(loadError.message)
    else {
      const alphabetical = ((data ?? []) as CheckoffItem[]).sort((a, b) =>
        a.checkoff_name.localeCompare(b.checkoff_name, undefined, { sensitivity: 'base' }),
      )
      setItems(alphabetical)
      setError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    setLoading(true)
    loadItems()
    const channel = supabase.channel('checkoff_items_sync_shared_v1')
      .on('postgres_changes', { event: '*', schema: 'public', table: CHECKOFF_TABLE }, loadItems)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadItems])

  const counts = useMemo(() => ({
    unchecked: items.filter((item) => !item.checkoff_check_yn).length,
    checked: items.filter((item) => item.checkoff_check_yn).length,
  }), [items])

  const shown = items.filter((item) => filter === 'all' || item.checkoff_check_yn === (filter === 'checked'))

  async function addItem(event: FormEvent) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) return
    const { error: addError } = await supabase.from(CHECKOFF_TABLE).insert({ checkoff_name: cleanName, checkoff_user_id: null })
    if (addError) setError(addError.code === '23505' ? 'That name is already on your list.' : addError.message)
    else { setName(''); await loadItems() }
  }

  async function update(id: string, changes: Partial<CheckoffItem>) {
    setItems((current) => current.map((item) => item.checkoff_id === id ? { ...item, ...changes } : item))
    const { error: updateError } = await supabase.from(CHECKOFF_TABLE).update(changes).eq('checkoff_id', id)
    if (updateError) { setError(updateError.message); await loadItems() }
  }

  async function saveName(id: string) {
    const cleanName = editingName.trim()
    if (!cleanName) return
    await update(id, { checkoff_name: cleanName })
    setEditingId(null)
  }

  async function remove(item: CheckoffItem) {
    if (!window.confirm(`Delete “${item.checkoff_name}”?`)) return
    setItems((current) => current.filter((row) => row.checkoff_id !== item.checkoff_id))
    const { error: deleteError } = await supabase.from(CHECKOFF_TABLE).delete().eq('checkoff_id', item.checkoff_id)
    if (deleteError) { setError(deleteError.message); await loadItems() }
  }

  async function clearChecks() {
    const checked = items.filter((item) => item.checkoff_check_yn)
    if (!checked.length) return
    setItems((current) => current.map((item) => ({ ...item, checkoff_check_yn: false })))
    const { error: clearError } = await supabase.from(CHECKOFF_TABLE).update({ checkoff_check_yn: false }).eq('checkoff_check_yn', true)
    if (clearError) { setError(clearError.message); await loadItems() }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <form className="add-form" onSubmit={addItem}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} placeholder="Add a new item…" aria-label="New item name" />
          <button className="primary" disabled={!name.trim()}><span>＋</span> Add item</button>
        </form>
      </section>

      <section className="list-card">
        <div className="controls">
          <div className="filters" role="group" aria-label="Filter list">
            <button className={filter === 'unchecked' ? 'active' : ''} onClick={() => setFilter('unchecked')}>To do <span>{counts.unchecked}</span></button>
            <button className={filter === 'checked' ? 'active' : ''} onClick={() => setFilter('checked')}>Checked <span>{counts.checked}</span></button>
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All <span>{items.length}</span></button>
          </div>
          <button className="clear-button" onClick={clearChecks} disabled={!counts.checked}>↺ Clear all checks</button>
        </div>

        {error && <div className="error" role="alert">{error}<button onClick={() => setError('')}>×</button></div>}
        {loading ? <p className="empty">Loading your list…</p> : shown.length === 0 ? (
          <div className="empty"><span>✓</span><h3>{filter === 'checked' ? 'Nothing checked yet' : 'You’re all caught up'}</h3><p>{filter === 'checked' ? 'Completed items will appear here.' : 'Add an item above when something comes to mind.'}</p></div>
        ) : (
          <ul className="items">
            {shown.map((item) => (
              <li key={item.checkoff_id} className={item.checkoff_check_yn ? 'done' : ''}>
                <input className="check" type="checkbox" checked={item.checkoff_check_yn} onChange={() => update(item.checkoff_id, { checkoff_check_yn: !item.checkoff_check_yn })} aria-label={`Mark ${item.checkoff_name} ${item.checkoff_check_yn ? 'unchecked' : 'checked'}`} />
                <div className="item-main">
                  {editingId === item.checkoff_id ? (
                    <form className="edit-form" onSubmit={(e) => { e.preventDefault(); saveName(item.checkoff_id) }}>
                      <input autoFocus value={editingName} maxLength={200} onChange={(e) => setEditingName(e.target.value)} onBlur={() => saveName(item.checkoff_id)} />
                    </form>
                  ) : <button className="item-name" onClick={() => setNotesItem(item)}>{item.checkoff_name}</button>}
                  {item.checkoff_rich_text_html && <span className="notes-dot" title="Has notes">Notes</span>}
                </div>
                <div className="item-actions">
                  <button onClick={() => setNotesItem(item)} title="Open rich-text notes" aria-label={`Notes for ${item.checkoff_name}`}>▤</button>
                  <button onClick={() => { setEditingId(item.checkoff_id); setEditingName(item.checkoff_name) }} title="Edit name" aria-label={`Edit ${item.checkoff_name}`}>✎</button>
                  <button className="delete" onClick={() => remove(item)} title="Delete" aria-label={`Delete ${item.checkoff_name}`}>⌫</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <footer><span className="sync-dot" /> Changes sync automatically across your devices <span className="version">v1.1.1</span></footer>
      {notesItem && <RichTextModal item={notesItem} onClose={() => setNotesItem(null)} onSave={async (html) => { await update(notesItem.checkoff_id, { checkoff_rich_text_html: html }); setNotesItem(null) }} />}
    </main>
  )
}
