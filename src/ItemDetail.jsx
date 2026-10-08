import { useState } from 'react'
import { supabase, photoPathFromUrl } from './supabase'
import { timeAgo, fullDate } from './time'
import PostItemForm from './PostItemForm'

function goHome() {
  window.location.hash = '#/'
}

function ItemDetail({ item, tagSuggestions, position, total, prevId, nextId, isOwner, onChanged }) {
  const [editing, setEditing] = useState(false)

  async function markReturned() {
    const { error } = await supabase.from('items').update({ claimed: true }).eq('id', item.id)
    if (error) {
      alert('Could not update: ' + error.message)
      return
    }
    onChanged()
    goHome()
  }

  async function deleteItem() {
    if (!confirm(`Delete "${item.title}"? This can't be undone.`)) return
    const { error } = await supabase.from('items').delete().eq('id', item.id)
    if (error) {
      alert('Could not delete: ' + error.message)
      return
    }
    if (item.photo_url) {
      await supabase.storage.from('photos').remove([photoPathFromUrl(item.photo_url)])
    }
    onChanged()
    goHome()
  }

  return (
    <div className="detail">
      <a href="#/" className="back-button">← Back to all items</a>

      {editing ? (
        <PostItemForm
          item={item}
          tagSuggestions={tagSuggestions}
          onSaved={() => {
            setEditing(false)
            onChanged()
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <article className="detail-card">
          <div className="detail-photo">
            {item.photo_url && <img src={item.photo_url} alt={item.title} />}
          </div>
          <div className="detail-info">
            {item.tag && <span className="tag-pill">{item.tag}</span>}
            <h2>{item.title}</h2>
            {item.description && <p className="detail-description">{item.description}</p>}
            <dl>
              <dt>Found at</dt>
              <dd>{item.location_found || '—'}</dd>
              <dt>How to get it back</dt>
              <dd>{item.contact || '—'}</dd>
              <dt>Posted</dt>
              <dd>
                {fullDate(item.created_at)} <span className="muted">({timeAgo(item.created_at)})</span>
              </dd>
            </dl>
            {isOwner && (
              <div className="actions">
                <button className="secondary" onClick={() => setEditing(true)}>Edit</button>
                <button className="secondary" onClick={markReturned}>Mark as returned</button>
                <button className="danger" onClick={deleteItem}>Delete</button>
              </div>
            )}
          </div>
        </article>
      )}

      <nav className="pager" aria-label="Browse items">
        <span className="pager-count">
          {position} of {total}
        </span>
        {prevId ? (
          <a className="pager-button" href={`#/item/${prevId}`}>← Previous</a>
        ) : (
          <span className="pager-button disabled">← Previous</span>
        )}
        {nextId ? (
          <a className="pager-button" href={`#/item/${nextId}`}>Next →</a>
        ) : (
          <span className="pager-button disabled">Next →</span>
        )}
      </nav>
    </div>
  )
}

export default ItemDetail
