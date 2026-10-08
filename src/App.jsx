import { useEffect, useState } from 'react'
import { supabase, useUser, signInWithGitHub, signOut } from './supabase'
import { timeAgo } from './time'
import PostItemForm from './PostItemForm'
import ItemDetail from './ItemDetail'
import { DEFAULT_TAGS } from './tags'
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
  const user = useUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
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
    loadItems()
  }, [])

  async function signIn() {
    const { error } = await signInWithGitHub()
    if (error) setError("Couldn't sign in with GitHub: " + error.message)
  }

  const query = search.trim().toLowerCase()
  const usedTags = [...new Set(items.map((i) => i.tag).filter(Boolean))].sort()
  const tagSuggestions = [...new Set([...DEFAULT_TAGS, ...usedTags])]
  const visibleItems = items.filter(
    (item) =>
      (!tagFilter || item.tag === tagFilter) &&
      [item.title, item.description, item.location_found, item.tag]
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
        tagSuggestions={tagSuggestions}
        position={index + 1}
        total={list.length}
        prevId={list[index - 1]?.id}
        nextId={list[index + 1]?.id}
        isOwner={Boolean(user) && item.user_id === user.id}
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
        <div className="header-actions">
          {openItemId === null && (
            <button
              className="primary"
              onClick={() => (user ? setShowForm(!showForm) : signIn())}
              title={user ? undefined : 'Sign in with GitHub to post an item'}
            >
              {showForm ? 'Close' : 'Add an item'}
            </button>
          )}
          {user ? (
            <div className="account">
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="" className="avatar" />
              )}
              <span className="username">{user.user_metadata?.user_name ?? user.email}</span>
              <button className="secondary" onClick={() => { setShowForm(false); signOut() }}>
                Sign out
              </button>
            </div>
          ) : (
            <button className="github-button" onClick={signIn}>
              <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Sign in with GitHub
            </button>
          )}
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="note">Loading items…</p>
      ) : openItemId !== null ? (
        renderDetail()
      ) : (
        <>
          {showForm && user && (
            <PostItemForm
              tagSuggestions={tagSuggestions}
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

          {usedTags.length > 0 && (
            <div className="tag-filters" role="group" aria-label="Filter by tag">
              <button className={tagFilter ? 'chip' : 'chip selected'} onClick={() => setTagFilter('')}>
                All
              </button>
              {usedTags.map((tag) => (
                <button
                  key={tag}
                  className={tag === tagFilter ? 'chip selected' : 'chip'}
                  aria-pressed={tag === tagFilter}
                  onClick={() => setTagFilter(tag === tagFilter ? '' : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

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
                  {item.tag && <span className="tag-pill">{item.tag}</span>}
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
