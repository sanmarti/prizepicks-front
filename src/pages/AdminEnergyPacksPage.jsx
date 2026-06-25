import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listAdminPacks, createAdminPack, updateAdminPack, deleteAdminPack } from '../api/adminPacks'

// ── Image compression (same approach as profile avatar) ───────────────────────
function compressImage(file, maxPx = 400) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
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

// ── Shared styles ─────────────────────────────────────────────────────────────
const INP = {
  width: '100%', padding: '10px 12px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
}
const LBL = { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5, letterSpacing: '0.05em' }
const ROW = { display: 'flex', gap: 10 }

// ── Image picker ──────────────────────────────────────────────────────────────
function ImagePicker({ value, onChange }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)
  const [urlMode, setUrlMode] = useState(!value?.startsWith('data:') && !!value)

  async function handleFile(file) {
    setUploading(true)
    try {
      const base64 = await compressImage(file, 400)
      onChange(base64)
      setUrlMode(false)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={LBL}>PACK IMAGE</label>

      {/* Current image preview (if any) */}
      {value && (
        <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', background: '#111' }}>
          <img src={value} alt="pack preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button
            type="button"
            onClick={() => { onChange(null); setUrlMode(false) }}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#f87171', borderRadius: 6, padding: '4px 10px',
              fontSize: 11, cursor: 'pointer', fontWeight: 600,
            }}
          >
            ✕ Remove
          </button>
          {value?.startsWith('data:') && (
            <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 8px', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
              Uploaded · ~{Math.round(value.length / 1024)} KB
            </div>
          )}
        </div>
      )}

      {/* Upload button — always visible and prominent */}
      <button
        type="button"
        onClick={() => ref.current.click()}
        disabled={uploading}
        style={{
          width: '100%', padding: '13px 0',
          border: '1.5px dashed rgba(99,102,241,0.45)',
          background: uploading ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.08)',
          color: '#818cf8', borderRadius: 12,
          fontSize: 14, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = 'rgba(99,102,241,0.15)' }}
        onMouseLeave={e => { if (!uploading) e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
      >
        {uploading ? (
          <>
            <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="4"/>
              <path fill="#818cf8" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Compressing…
          </>
        ) : (
          <>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {value ? 'Replace image from computer' : 'Upload image from computer'}
          </>
        )}
      </button>

      {/* URL alternative */}
      <div>
        <button
          type="button"
          onClick={() => setUrlMode(m => !m)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer', padding: 0, marginBottom: urlMode ? 6 : 0 }}
        >
          {urlMode ? '▾ Use URL instead' : '▸ Or paste an image URL instead'}
        </button>
        {urlMode && (
          <input
            type="text"
            value={value?.startsWith('data:') ? '' : (value || '')}
            onChange={e => onChange(e.target.value || null)}
            placeholder="https://example.com/image.jpg"
            style={{ ...INP, fontSize: 13 }}
            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        )}
      </div>

      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = '' }}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Pack form ─────────────────────────────────────────────────────────────────
const EMPTY = { name: '', description: '', image_url: null, energy_amount: 10, price_euros: 4.99, discount_pct: 0, is_active: true, display_order: 0 }

function PackForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Reset when switching between packs
  useEffect(() => { setForm(initial ?? EMPTY) }, [initial])

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave(form) }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div>
        <label style={LBL}>NAME *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Starter Pack"
          style={INP} onFocus={e => e.target.style.borderColor='rgba(99,102,241,0.6)'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
      </div>

      <div>
        <label style={LBL}>DESCRIPTION</label>
        <input value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Boost your picks this week"
          style={INP} onFocus={e => e.target.style.borderColor='rgba(99,102,241,0.6)'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
      </div>

      <ImagePicker value={form.image_url} onChange={v => set('image_url', v)} />

      <div style={ROW}>
        <div style={{ flex: 1 }}>
          <label style={LBL}>ENERGY ⚡ *</label>
          <input type="number" min={1} max={100} value={form.energy_amount} onChange={e => set('energy_amount', Number(e.target.value))} required
            style={INP} onFocus={e => e.target.style.borderColor='rgba(99,102,241,0.6)'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={LBL}>PRICE (€)</label>
          <input type="number" min={0} step={0.01} value={form.price_euros} onChange={e => set('price_euros', Number(e.target.value))}
            style={INP} onFocus={e => e.target.style.borderColor='rgba(99,102,241,0.6)'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={LBL}>DISCOUNT %</label>
          <input type="number" min={0} max={100} value={form.discount_pct} onChange={e => set('discount_pct', Number(e.target.value))}
            style={INP} onFocus={e => e.target.style.borderColor='rgba(99,102,241,0.6)'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
        </div>
      </div>

      <div style={ROW}>
        <div style={{ flex: 1 }}>
          <label style={LBL}>DISPLAY ORDER</label>
          <input type="number" min={0} value={form.display_order} onChange={e => set('display_order', Number(e.target.value))}
            style={INP} onFocus={e => e.target.style.borderColor='rgba(99,102,241,0.6)'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <label style={{ ...LBL, marginBottom: 10 }}>ACTIVE</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#6366f1' }} />
            <span style={{ color: form.is_active ? '#a5b4fc' : 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              {form.is_active ? 'Visible to users' : 'Hidden'}
            </span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13 }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: saving ? 'rgba(99,102,241,0.3)' : '#6366f1', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13 }}>
          {saving ? 'Saving…' : (initial ? 'Update Pack' : 'Create Pack')}
        </button>
      </div>
    </form>
  )
}

// ── Pack row ──────────────────────────────────────────────────────────────────
function PackRow({ pack, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${pack.name}"?`)) return
    setDeleting(true)
    try { await onDelete(pack.id) } finally { setDeleting(false) }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
    }}>
      {/* Thumbnail */}
      <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {pack.image_url
          ? <img src={pack.image_url} alt={pack.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 24 }}>⚡</span>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pack.name}</p>
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
            background: pack.is_active ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
            color: pack.is_active ? '#6ee7b7' : 'rgba(255,255,255,0.3)',
          }}>
            {pack.is_active ? 'Active' : 'Hidden'}
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
          ⚡{pack.energy_amount} · €{parseFloat(pack.price_euros).toFixed(2)}
          {pack.discount_pct > 0 && <span style={{ color: '#f87171', marginLeft: 6 }}>-{pack.discount_pct}%</span>}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={() => onEdit(pack)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          Edit
        </button>
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
  const [editing, setEditing] = useState(null)   // null=closed | 'new' | pack object
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const { data } = await listAdminPacks(); setPacks(data.packs ?? data ?? []) }
    catch { setMsg({ type: 'error', text: 'Failed to load packs' }) }
    finally { setLoading(false) }
  }

  async function handleSave(form) {
    setSaving(true); setMsg(null)
    try {
      if (editing === 'new') {
        await createAdminPack(form)
        setMsg({ type: 'ok', text: 'Pack created ✓' })
      } else {
        await updateAdminPack(editing.id, form)
        setMsg({ type: 'ok', text: 'Pack updated ✓' })
      }
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
    <div style={{ minHeight: '100vh', background: '#0a0d12', color: '#fff', padding: '24px 16px 60px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20 }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Energy Packs</h1>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{packs.length} packs · admin panel</p>
          </div>
          {editing === null && (
            <button
              onClick={() => { setEditing('new'); setMsg(null) }}
              style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              + New Pack
            </button>
          )}
        </div>

        {/* Inline message */}
        {msg && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: msg.type === 'ok' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
            border: `1px solid ${msg.type === 'ok' ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
            color: msg.type === 'ok' ? '#6ee7b7' : '#f87171',
          }}>
            {msg.text}
          </div>
        )}

        {/* Create / edit form */}
        {editing !== null && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>
              {editing === 'new' ? '✦ New pack' : `Editing: ${editing.name}`}
            </p>
            <PackForm
              initial={editing === 'new' ? null : editing}
              onSave={handleSave}
              onCancel={() => { setEditing(null); setMsg(null) }}
              saving={saving}
            />
          </div>
        )}

        {/* Pack list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        ) : packs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)' }}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>⚡</p>
            <p>No packs yet. Create your first one.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {packs.map(pack => (
              <PackRow
                key={pack.id}
                pack={pack}
                onEdit={p => { setEditing(p); setMsg(null); window.scrollTo(0, 0) }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Preview note */}
        {packs.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 24 }}>
            Images uploaded from your computer are stored securely · visible in the Energy Store
          </p>
        )}
      </div>
    </div>
  )
}
