import { useId, useRef, useState } from 'react'
import { DEFAULT_TAGS } from './tags'

// Text box with a dropdown of tags: tap the arrow to see all, or type to filter.
// Typing something not in the list lets you use it as a new tag.
function TagPicker({ value, onChange, suggestions = DEFAULT_TAGS, required }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef(null)
  const listId = useId()

  const query = value.trim().toLowerCase()
  const matches = suggestions.filter((tag) => tag.toLowerCase().includes(query))
  const exact = suggestions.some((tag) => tag.toLowerCase() === query)
  const options = query && !exact ? [...matches, value.trim()] : matches

  function choose(tag) {
    onChange(tag)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && active >= 0) {
      e.preventDefault()
      choose(options[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="tag-picker" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <div className="tag-input-wrap">
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          required={required}
          maxLength={40}
          value={value}
          placeholder="Pick or type a tag"
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="tag-toggle"
          aria-label={open ? 'Hide tags' : 'Show all tags'}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setOpen(!open)
            inputRef.current.focus()
          }}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className={open ? 'flip' : ''}>
            <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && options.length > 0 && (
        <ul className="tag-list" id={listId} role="listbox">
          {options.map((tag, i) => (
            <li
              key={tag + i}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(tag)}
            >
              {i === matches.length ? <>Use “{tag}”</> : tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default TagPicker
