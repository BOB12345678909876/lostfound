import { useEffect, useState } from 'react'
import { supabase, getUserId, photoPathFromUrl } from './supabase'
import PostItemForm from './PostItemForm'
import './App.css'

function timeAgo(dateString) {
  const days = Math.floor((Date.now() - new Date(dateString)) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

function App() {
  const [items, setItems] = useState([])
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  function loadItems() {
    return supabase
      .from('items')
      .select('*')
      .eq('claimed', false)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setItems(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    getUserId()
      .then(setUserId)
      .catch((err) => setError("Couldn't sign in: " + err.message))
    loadItems()
  }, [])

  async function markReturned(item) {
    const { error } = await supabase.from('items').update({ claimed: true }).eq('id', item.id)
    if (error) alert('Could not update: ' + error.message)
    else loadItems()
  }

  async function deleteItem(item) {
    if (!confirm(`Delete "${item.title}"? This can't be undone.`)) return
    const { error } = await supabase.from('items').delete().eq('id', item.id)
    if (error) {
      alert('Could not delete: ' + error.message)
      return
    }
    if (item.photo_url) {
      await supabase.storage.from('photos').remove([photoPathFromUrl(item.photo_url)])
    }
    loadItems()
  }

  const query = search.trim().toLowerCase()
  const visibleItems = items.filter((item) =>
    [item.title, item.description, item.location_found]
      .join(' ')
      .toLowerCase()
      .includes(query),
  )

  return (
    <div className="page">
      <header className="header">
        <h1>Lost &amp; Found</h1>
        <button className="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close' : '+ I found something'}
        </button>
      </header>

      {showForm && (
        <PostItemForm
          onSaved={() => {
            setShowForm(false)
            loadItems()
          }}
        />
      )}

      <input
        className="search"
        type="search"
        placeholder="Search for your lost item (e.g. water bottle, hoodie, AirPods)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p className="note">Loading items…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && visibleItems.length === 0 && (
        <p className="note">
          {items.length === 0 ? 'Nothing has been posted yet.' : 'No items match your search.'}
        </p>
      )}

      <div className="grid">
        {visibleItems.map((item) =>
          editingId === item.id ? (
            <PostItemForm
              key={item.id}
              item={item}
              onSaved={() => {
                setEditingId(null)
                loadItems()
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <article key={item.id} className="card">
              {item.photo_url && <img src={item.photo_url} alt={item.title} />}
              <div className="card-body">
                <h2>{item.title}</h2>
                {item.description && <p>{item.description}</p>}
                <dl>
                  {item.location_found && (
                    <>
                      <dt>Found at</dt>
                      <dd>{item.location_found}</dd>
                    </>
                  )}
                  {item.contact && (
                    <>
                      <dt>Get it back</dt>
                      <dd>{item.contact}</dd>
                    </>
                  )}
                  <dt>Posted</dt>
                  <dd>{timeAgo(item.created_at)}</dd>
                </dl>
                {userId && item.user_id === userId && (
                  <div className="actions">
                    <button className="secondary" onClick={() => setEditingId(item.id)}>Edit</button>
                    <button className="secondary" onClick={() => markReturned(item)}>Returned</button>
                    <button className="danger" onClick={() => deleteItem(item)}>Delete</button>
                  </div>
                )}
              </div>
            </article>
          ),
        )}
      </div>
    </div>
  )
}

export default App
