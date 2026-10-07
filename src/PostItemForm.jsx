import { useState } from 'react'
import { supabase, photoPathFromUrl } from './supabase'

const MAX_PHOTO_MB = 5

function PostItemForm({ item, onSaved, onCancel }) {
  const editing = Boolean(item)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(item?.photo_url ?? '')
  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [location, setLocation] = useState(item?.location_found ?? '')
  const [contact, setContact] = useState(item?.contact ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function choosePhoto(e) {
    const file = e.target.files[0]
    setError('')
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image.')
      return
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setError(`Photo must be under ${MAX_PHOTO_MB} MB.`)
      return
    }
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!photo && !editing) {
      setError('Please add a photo of the item.')
      return
    }
    setSaving(true)
    setError('')

    let photoUrl = item?.photo_url
    if (photo) {
      const extension = photo.name.split('.').pop().toLowerCase()
      const path = `${crypto.randomUUID()}.${extension}`
      const upload = await supabase.storage.from('photos').upload(path, photo)
      if (upload.error) {
        setError('Photo upload failed: ' + upload.error.message)
        setSaving(false)
        return
      }
      photoUrl = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
    }

    const fields = {
      title: title.trim(),
      description: description.trim(),
      location_found: location.trim(),
      contact: contact.trim(),
      photo_url: photoUrl,
    }
    const result = editing
      ? await supabase.from('items').update(fields).eq('id', item.id).select()
      : await supabase.from('items').insert(fields).select()

    setSaving(false)
    if (result.error) {
      setError('Saving failed: ' + result.error.message)
      return
    }
    if (result.data.length === 0) {
      setError("Couldn't save. You can only edit items you posted.")
      return
    }
    if (editing && photo && item.photo_url) {
      await supabase.storage.from('photos').remove([photoPathFromUrl(item.photo_url)])
    }
    onSaved()
  }

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <h2>{editing ? 'Edit item' : 'Post a found item'}</h2>

      <label className="photo-picker">
        {preview ? <img src={preview} alt="Preview" /> : <span>Tap to take or choose a photo</span>}
        <input type="file" accept="image/*" capture="environment" onChange={choosePhoto} hidden />
      </label>
      {editing && <p className="hint">Tap the photo to replace it.</p>}

      <label>
        What is it? *
        <input required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Blue Hydro Flask" />
      </label>

      <label>
        Description
        <textarea maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Has stickers on it, dent near the bottom" />
      </label>

      <label>
        Where did you find it? *
        <input required maxLength={100} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Gym bleachers" />
      </label>

      <label>
        How can the owner get it back? *
        <input required maxLength={150} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Turned in to the front office" />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="actions">
        <button className="primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Post item'}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default PostItemForm
