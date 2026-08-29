import DOMPurify from 'dompurify'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import type { CheckoffItem } from '../types'

type Props = { item: CheckoffItem; onClose: () => void; onSave: (html: string) => Promise<void> }

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>]+/gi
const TRAILING_PUNCTUATION = /[.,!?;:)}\]]+$/

function linkify(html: string) {
  const document = new DOMParser().parseFromString(DOMPurify.sanitize(html), 'text/html')
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []

  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    if (!node.parentElement?.closest('a')) textNodes.push(node)
  }

  for (const node of textNodes) {
    const text = node.data
    const fragment = document.createDocumentFragment()
    let lastIndex = 0
    let foundUrl = false

    for (const match of text.matchAll(URL_PATTERN)) {
      const matchedText = match[0]
      const url = matchedText.replace(TRAILING_PUNCTUATION, '')
      if (!url) continue

      foundUrl = true
      const index = match.index ?? 0
      fragment.append(text.slice(lastIndex, index))

      const anchor = document.createElement('a')
      anchor.href = url.startsWith('www.') ? `https://${url}` : url
      anchor.textContent = url
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      fragment.append(anchor, matchedText.slice(url.length))
      lastIndex = index + matchedText.length
    }

    if (foundUrl) {
      fragment.append(text.slice(lastIndex))
      node.replaceWith(fragment)
    }
  }

  return DOMPurify.sanitize(document.body.innerHTML, { ADD_ATTR: ['target'] })
}

export function RichTextModal({ item, onClose, onSave }: Props) {
  const editor = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editor.current) editor.current.innerHTML = linkify(item.checkoff_rich_text_html)
  }, [item])

  function format(command: string, value?: string) {
    editor.current?.focus()
    document.execCommand(command, false, value)
  }

  async function save() {
    setSaving(true)
    const html = linkify(editor.current?.innerHTML ?? '')
    if (editor.current) editor.current.innerHTML = html
    await onSave(html)
    setSaving(false)
  }

  function linkifyEditor() {
    if (editor.current) editor.current.innerHTML = linkify(editor.current.innerHTML)
  }

  function openLink(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement).closest('a')
    if (!anchor) return

    event.preventDefault()
    window.open(anchor.href, '_blank', 'noopener,noreferrer')
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
        <div ref={editor} className="editor" contentEditable suppressContentEditableWarning onBlur={linkifyEditor} onClick={openLink} data-placeholder="Add notes, links, details, or anything useful…" />
        <div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save notes'}</button></div>
      </section>
    </div>
  )
}
