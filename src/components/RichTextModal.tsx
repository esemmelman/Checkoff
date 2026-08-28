import DOMPurify from 'dompurify'
import { useEffect, useRef, useState } from 'react'
import type { CheckoffItem } from '../types'

type Props = { item: CheckoffItem; onClose: () => void; onSave: (html: string) => Promise<void> }

export function RichTextModal({ item, onClose, onSave }: Props) {
  const editor = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editor.current) editor.current.innerHTML = DOMPurify.sanitize(item.checkoff_rich_text_html)
  }, [item])

  function format(command: string, value?: string) {
    editor.current?.focus()
    document.execCommand(command, false, value)
  }

  async function save() {
    setSaving(true)
    await onSave(DOMPurify.sanitize(editor.current?.innerHTML ?? ''))
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="notes-title">
        <div className="modal-heading">
          <div><p className="eyebrow">NOTES FOR</p><h2 id="notes-title">{item.checkoff_name}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="toolbar" aria-label="Text formatting">
          <button onClick={() => format('bold')}><strong>B</strong></button>
          <button onClick={() => format('italic')}><em>I</em></button>
          <button onClick={() => format('underline')}><u>U</u></button>
          <button onClick={() => format('insertUnorderedList')}>• List</button>
          <button onClick={() => format('formatBlock', 'h3')}>Heading</button>
          <button onClick={() => format('removeFormat')}>Clear style</button>
        </div>
        <div ref={editor} className="editor" contentEditable suppressContentEditableWarning data-placeholder="Add notes, links, details, or anything useful…" />
        <div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save notes'}</button></div>
      </section>
    </div>
  )
}
