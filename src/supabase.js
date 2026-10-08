import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

// Current signed-in user (null when signed out), kept in sync with Supabase auth
export function useUser() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])
  return user
}

export function signInWithGitHub() {
  // Come back to this exact page (works on localhost and on /lostfound/ in production)
  return supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.origin + window.location.pathname },
  })
}

export function signOut() {
  return supabase.auth.signOut()
}

export function photoPathFromUrl(url) {
  return url ? url.split('/photos/').pop() : null
}
