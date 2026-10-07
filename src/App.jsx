import { useEffect, useState } from 'react'
import { supabase, getUserId } from './supabase'
import { timeAgo } from './time'
import PostItemForm from './PostItemForm'
import ItemDetail from './ItemDetail'
import logo from './assets/logo.png'
import './App.css'

function useHash() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    function onChange() {
      setHash(window.location.hash)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

function App() {
  const [items, setItems] = useState([])
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const hash = useHash()

  const match = hash.match(/^#\/item\/(\d+)$/)
  const openItemId = match ? Number(match[1]) : null

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

  const query = search.trim().toLowerCase()
  const visibleItems = items.filter((item) =>
    [item.title, item.description, item.location_found]
      .join(' ')
      .toLowerCase()
      .includes(query),
  )

  function renderDetail() {
    const list = visibleItems.some((i) => i.id === openItemId) ? visibleItems : items
    const index = list.findIndex((i) => i.id === openItemId)
    if (index === -1) {
      return (
        <div className="detail">
          <a href="#/" className="back-button">← Back to all items</a>
          <p className="note">This item isn't available anymore. It may have been returned or deleted.</p>
        </div>
      )
    }
    const item = list[index]
    return (
      <ItemDetail
        key={item.id}
        item={item}
        position={index + 1}
        total={list.length}
        prevId={list[index - 1]?.id}
        nextId={list[index + 1]?.id}
        isOwner={Boolean(userId) && item.user_id === userId}
        onChanged={loadItems}
      />
    )
  }

  return (
    <div className="page">
      <header className="header">
        <a href="#/" className="brand" aria-label="Back to all items">
          <img src={logo} alt="" className="logo" />
          <h1>Canyon Crest Academy Lost and Found</h1>
        </a>
        {openItemId === null && (
          <button className="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Close' : 'Add an item'}
          </button>
        )}
      </header>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="note">Loading items…</p>
      ) : openItemId !== null ? (
        renderDetail()
      ) : (
        <>
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

          {!error && visibleItems.length === 0 && (
            <p className="note">
              {items.length === 0 ? 'Nothing has been posted yet.' : 'No items match your search.'}
            </p>
          )}

          <div className="grid">
            {visibleItems.map((item) => (
              <a key={item.id} href={`#/item/${item.id}`} className="card">
                <div className="card-photo">
                  {item.photo_url && <img src={item.photo_url} alt={item.title} />}
                </div>
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
                    <dt>Posted</dt>
                    <dd>{timeAgo(item.created_at)}</dd>
                  </dl>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default App
