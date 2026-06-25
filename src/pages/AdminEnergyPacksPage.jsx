import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listAdminPacks, createAdminPack, updateAdminPack, deleteAdminPack } from '../api/adminPacks'

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 400
      const scale = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bad image')) }
    img.src = url
  })
}

// ── Pack form ─────────────────────────────────────────────────────────────────
const EMPTY = {
  name: '', description: '', image_url: null,
  energy_amount: 10, price_euros: 4.99, discount_pct: 0,
  is_active: true, display_order: 0,
}

function PackForm({ initial, onSave, onCancel, saving }) {
  const [form,      setForm]      = useState(initial ?? EMPTY)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { setForm(initial ?? EMPTY) }, [initial])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleImageFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const b64 = await compressImage(file)
      set('image_url', b64)
    } catch {
      alert('Could not read image. Try another file.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const s = {
    field: { display: 'flex', flexDirection: 'column', gap: 5 },
    lbl:   { fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' },
    inp:   {
      padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14,
      outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
    },
    row: { display: 'flex', gap: 10 },
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Name */}
      <div style={s.field}>
        <label style={s.lbl}>Name *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} required
          placeholder="Starter Pack" style={s.inp} />
      </div>

      {/* Description */}
      <div style={s.field}>
        <label style={s.lbl}>Description</label>
        <input value={form.description || ''} onChange={e => set('description', e.target.value)}
          placeholder="Boost your picks this week" style={s.inp} />
      </div>

      {/* ── IMAGE UPLOAD ─────────────────────────────────────────────────────── */}
      <div style={s.field}>
        <label style={s.lbl}>Pack Image</label>

        {/* Preview */}
        {form.image_url && (
          <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', background: '#111' }}>
            <img src={form.image_url} alt="preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button type="button" onClick={() => set('image_url', null)}
              style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.75)', border: 'none', color: '#f87171', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
              ✕ Remove
            </button>
          </div>
        )}

        {/* Upload button — label wraps input directly (most reliable pattern) */}
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          width: '100%', padding: '13px 0',
          borderRadius: 12, cursor: uploading ? 'wait' : 'pointer',
          background: uploading ? '#4f46e5' : '#6366f1',
          color: '#fff', fontSize: 14, fontWeight: 700,
          boxSizing: 'border-box', userSelect: 'none',
          boxShadow: '0 2px 12px rgba(99,102,241,0.4)',
          transition: 'background 0.15s',
        }}>
          {uploading
            ? '⏳ Compressing image…'
            : <>
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {form.image_url ? '📁 Replace image from computer' : '📁 Upload image from computer'}
              </>
          }
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={handleImageFile}
            style={{ display: 'none' }}
          />
        </label>

        {/* URL fallback */}
        <input
          type="text"
          value={form.image_url?.startsWith('data:') ? '' : (form.image_url || '')}
          onChange={e => set('image_url', e.target.value || null)}
          placeholder="Or paste an image URL (https://…)"
          style={{ ...s.inp, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}
        />
      </div>

      {/* Energy + Price + Discount */}
      <div style={s.row}>
        <div style={{ ...s.field, flex: 1 }}>
          <label style={s.lbl}>Energy ⚡ *</label>
          <input type="number" min={1} max={200} value={form.energy_amount}
            onChange={e => set('energy_amount', Number(e.target.value))} required style={s.inp} />
        </div>
        <div style={{ ...s.field, flex: 1 }}>
          <label style={s.lbl}>Price €</label>
          <input type="number" min={0} step={0.01} value={form.price_euros}
            onChange={e => set('price_euros', Number(e.target.value))} style={s.inp} />
        </div>
        <div style={{ ...s.field, flex: 1 }}>
          <label style={s.lbl}>Discount %</label>
          <input type="number" min={0} max={100} value={form.discount_pct}
            onChange={e => set('discount_pct', Number(e.target.value))} style={s.inp} />
        </div>
      </div>

      {/* Order + Active */}
      <div style={s.row}>
        <div style={{ ...s.field, flex: 1 }}>
          <label style={s.lbl}>Display order</label>
          <input type="number" min={0} value={form.display_order}
            onChange={e => set('display_order', Number(e.target.value))} style={s.inp} />
        </div>
        <div style={{ ...s.field, flex: 1, justifyContent: 'flex-end' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingBottom: 2 }}>
            <input type="checkbox" checked={form.is_active}
              onChange={e => set('is_active', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#6366f1', cursor: 'pointer' }} />
            <span style={{ fontSize: 13, color: form.is_active ? '#a5b4fc' : 'rgba(255,255,255,0.3)' }}>
              Active (visible to users)
            </span>
          </label>
        </div>
      </div>

      {/* Submit / Cancel */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: saving ? 'rgba(99,102,241,0.35)' : '#6366f1', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
          {saving ? 'Saving…' : (initial ? 'Update pack' : 'Create pack')}
        </button>
      </div>
    </form>
  )
}

// ── Pack row ──────────────────────────────────────────────────────────────────
function PackRow({ pack, onEdit, onDelete, onImageChange }) {
  const [deleting,     setDeleting]     = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${pack.name}"?`)) return
    setDeleting(true)
    try { await onDelete(pack.id) } finally { setDeleting(false) }
  }

  async function handleQuickImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const b64 = await compressImage(file)
      await updateAdminPack(pack.id, { ...pack, image_url: b64 })
      onImageChange()
    } catch {
      alert('Image upload failed — try a smaller file.')
    } finally {
      setUploadingImg(false)
      e.target.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
      {/* Thumbnail */}
      <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {pack.image_url
          ? <img src={pack.image_url} alt={pack.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 24 }}>⚡</span>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pack.name}</p>
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, flexShrink: 0, background: pack.is_active ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)', color: pack.is_active ? '#6ee7b7' : 'rgba(255,255,255,0.3)' }}>
            {pack.is_active ? 'Active' : 'Hidden'}
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
          ⚡{pack.energy_amount} · €{parseFloat(pack.price_euros).toFixed(2)}
          {pack.discount_pct > 0 && <span style={{ color: '#f87171', marginLeft: 6 }}>-{pack.discount_pct}%</span>}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {/* Photo upload — label wraps input, always opens file picker */}
        <label style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.35)', background: uploadingImg ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.08)', color: '#86efac', fontSize: 12, cursor: uploadingImg ? 'wait' : 'pointer', fontWeight: 600, userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          {uploadingImg ? '⏳' : '📷'} Foto
          <input type="file" accept="image/*" disabled={uploadingImg} style={{ display: 'none' }} onChange={handleQuickImage} />
        </label>
        <button onClick={() => onEdit(pack)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Edit</button>
        <button onClick={handleDelete} disabled={deleting} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.06)', color: '#f87171', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          {deleting ? '…' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminEnergyPacksPage() {
  const navigate = useNavigate()
  const [packs,   setPacks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data } = await listAdminPacks()
      setPacks(data.packs ?? (Array.isArray(data) ? data : []))
    } catch {
      setMsg({ type: 'error', text: 'Failed to load packs — check you are logged in as admin' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(form) {
    setSaving(true); setMsg(null)
    try {
      if (editing === 'new') await createAdminPack(form)
      else                   await updateAdminPack(editing.id, form)
      setMsg({ type: 'ok', text: editing === 'new' ? 'Pack created ✓' : 'Pack updated ✓' })
      setEditing(null)
      await load()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error ?? 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try { await deleteAdminPack(id); await load() }
    catch { setMsg({ type: 'error', text: 'Delete failed' }) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d12', color: '#fff', padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Energy Packs</h1>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{packs.length} packs · admin</p>
          </div>
          {editing === null && (
            <button onClick={() => { setEditing('new'); setMsg(null); window.scrollTo(0, 0) }}
              style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              + New Pack
            </button>
          )}
        </div>

        {/* Message */}
        {msg && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, fontSize: 13, background: msg.type === 'ok' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${msg.type === 'ok' ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`, color: msg.type === 'ok' ? '#6ee7b7' : '#f87171' }}>
            {msg.text}
          </div>
        )}

        {/* Form */}
        {editing !== null && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: '20px 18px', marginBottom: 24 }}>
            <p style={{ margin: '0 0 18px', fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>
              {editing === 'new' ? '✦ New pack' : `✎ Editing: ${editing.name}`}
            </p>
            <PackForm
              initial={editing === 'new' ? null : editing}
              onSave={handleSave}
              onCancel={() => { setEditing(null); setMsg(null) }}
              saving={saving}
            />
          </div>
        )}

        {/* List */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</p>
        ) : packs.length === 0 && editing === null ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)' }}>
            <p style={{ fontSize: 40, marginBottom: 10 }}>⚡</p>
            <p style={{ fontSize: 15 }}>No packs yet</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Click <strong style={{ color: '#818cf8' }}>+ New Pack</strong> to create your first one</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {packs.map(pack => (
              <PackRow key={pack.id} pack={pack}
                onEdit={p => { setEditing(p); setMsg(null); window.scrollTo(0, 0) }}
                onDelete={handleDelete}
                onImageChange={load}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
