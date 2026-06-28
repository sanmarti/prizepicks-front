import { useEffect, useRef, useState, useCallback } from 'react'
import { PRIVACY_POLICY, TERMS_OF_USE } from '../../legal/legalContent'

// ── Cookie preference helpers ─────────────────────────────────────────────────

const COOKIE_KEY = 'oddsrivals_cookie_prefs'

function loadCookiePrefs() {
  try {
    const stored = localStorage.getItem(COOKIE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { analytics: false, marketing: false }
}

function saveCookiePrefs(prefs) {
  localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs))
}

// ── Keyframes injected once ───────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes legal-backdrop-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes legal-modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
`

let keyframesInjected = false
function ensureKeyframes() {
  if (keyframesInjected) return
  const s = document.createElement('style')
  s.textContent = KEYFRAMES
  document.head.appendChild(s)
  keyframesInjected = true
}

// ── Content renderer ──────────────────────────────────────────────────────────

function Placeholder({ text }) {
  if (!text.includes('[')) return <>{text}</>
  const parts = text.split(/(\[[^\]]+\])/g)
  return (
    <>
      {parts.map((p, i) =>
        /^\[.+\]$/.test(p) ? (
          <span key={i} style={{
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: 4, padding: '1px 5px',
            color: '#fbbf24', fontSize: '0.9em', fontStyle: 'italic',
          }}>{p}</span>
        ) : p
      )}
    </>
  )
}

function ContentBlocks({ blocks }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {blocks.map((block, i) => {
        if (block.type === 'p') return (
          <p key={i} style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace" }}>
            <Placeholder text={block.text} />
          </p>
        )
        if (block.type === 'sub') return (
          <p key={i} style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
            {block.text}
          </p>
        )
        if (block.type === 'ul') return (
          <ul key={i} style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {block.items.map((item, j) => (
              <li key={j} style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, fontFamily: "'IBM Plex Mono', monospace" }}>
                <Placeholder text={item} />
              </li>
            ))}
          </ul>
        )
        if (block.type === 'kv') return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' }}>
            {block.rows.map((row, j) => (
              <div key={j} style={{ display: 'flex', gap: 12, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', minWidth: 130, flexShrink: 0 }}>{row.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.65)' }}><Placeholder text={row.value} /></span>
              </div>
            ))}
          </div>
        )
        return null
      })}
    </div>
  )
}

function LegalContent({ doc }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace" }}>
        <Placeholder text={doc.intro} />
      </p>
      {doc.sections.map((sec, i) => (
        <div key={i}>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#22c55e', fontFamily: "'Syne', sans-serif", letterSpacing: '0.02em' }}>
            {sec.heading}
          </h3>
          <ContentBlocks blocks={sec.blocks} />
        </div>
      ))}
    </div>
  )
}

// ── Cookie settings content ───────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled, id, label }) {
  return (
    <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <input
        type="checkbox" id={id} checked={checked} onChange={onChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <div
        role="switch" aria-checked={checked} aria-disabled={disabled}
        onClick={() => !disabled && onChange({ target: { checked: !checked } })}
        onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !disabled) onChange({ target: { checked: !checked } }) }}
        tabIndex={disabled ? -1 : 0}
        style={{
          width: 40, height: 22, borderRadius: 99, flexShrink: 0,
          background: checked ? '#22c55e' : 'rgba(255,255,255,0.12)',
          border: `1.5px solid ${checked ? '#16a34a' : 'rgba(255,255,255,0.15)'}`,
          position: 'relative', transition: 'background 0.2s, border-color 0.2s',
          opacity: disabled ? 0.45 : 1,
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        aria-label={label}
      >
        <div style={{
          position: 'absolute', top: 2, left: checked ? 20 : 2,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </label>
  )
}

function CookieCard({ title, desc, status, checked, onChange, disabled, id }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '16px 18px',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'Syne', sans-serif" }}>{title}</p>
          {status && (
            <span style={{ fontSize: 9, letterSpacing: '0.12em', color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 99, padding: '2px 7px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
              {status}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, fontFamily: "'IBM Plex Mono', monospace" }}>{desc}</p>
      </div>
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        <Toggle id={id} checked={checked} onChange={onChange} disabled={disabled} label={title} />
      </div>
    </div>
  )
}

function CookieContent({ onSave, onReject }) {
  const [prefs, setPrefs] = useState(loadCookiePrefs)

  const toggle = (key) => (e) => setPrefs(p => ({ ...p, [key]: e.target.checked }))

  function handleSave() {
    saveCookiePrefs(prefs)
    onSave(prefs)
  }

  function handleReject() {
    const rejected = { analytics: false, marketing: false }
    saveCookiePrefs(rejected)
    setPrefs(rejected)
    onReject()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: '0 0 8px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace" }}>
        OddsRivals uses essential cookies and similar technologies to keep the Service working securely. Optional analytics and marketing technologies are only used where permitted and based on user choice.
      </p>

      <CookieCard
        id="cookie-essential"
        title="Essential Cookies"
        desc="Required for core features such as sign-in, security, session management, fraud prevention and saving essential preferences."
        status="Always active"
        checked={true}
        disabled={true}
        onChange={() => {}}
      />
      <CookieCard
        id="cookie-analytics"
        title="Analytics Cookies"
        desc="Help us understand how players use OddsRivals so we can improve performance, gameplay flows and user experience."
        checked={prefs.analytics}
        onChange={toggle('analytics')}
      />
      <CookieCard
        id="cookie-marketing"
        title="Marketing Cookies"
        desc="Help us measure campaigns and show more relevant communications or advertising where applicable."
        checked={prefs.marketing}
        onChange={toggle('marketing')}
      />

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={handleSave} style={{
          padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', color: '#fff',
          background: 'linear-gradient(90deg, #16a34a 0%, #22c55e 100%)',
          boxShadow: '0 4px 18px rgba(34,197,94,0.3)',
        }}>SAVE SETTINGS</button>
        <button onClick={handleReject} style={{
          padding: '11px 0', borderRadius: 12, cursor: 'pointer',
          fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 12, letterSpacing: '0.06em',
          color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>REJECT OPTIONAL COOKIES</button>
      </div>

      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.22)', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6 }}>
        You can change your cookie preferences at any time from this link.
      </p>
    </div>
  )
}

// ── Modal shell ───────────────────────────────────────────────────────────────

const DOCS = {
  privacy: PRIVACY_POLICY,
  terms:   TERMS_OF_USE,
}

export default function LegalModal({ type, onClose, triggerRef }) {
  const containerRef   = useRef(null)
  const closeButtonRef = useRef(null)
  const isCookies      = type === 'cookies'
  const doc            = DOCS[type]

  ensureKeyframes()

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Focus first element on mount
  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  // Restore focus on unmount
  useEffect(() => {
    return () => { triggerRef?.current?.focus() }
  }, [triggerRef])

  // Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Focus trap
  const handleTabKey = useCallback((e) => {
    if (e.key !== 'Tab') return
    const el = containerRef.current
    if (!el) return
    const focusable = Array.from(el.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
    ))
    if (!focusable.length) return
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus() }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }, [])

  const title       = isCookies ? 'Cookie Settings' : doc.title
  const lastUpdated = isCookies ? '[DATE]' : doc.lastUpdated

  return (
    <div
      role="presentation"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'legal-backdrop-in 0.2s ease both',
        overflowY: 'auto',
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        onKeyDown={handleTabKey}
        style={{
          width: '100%', maxWidth: 720, maxHeight: '90dvh',
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(160deg, #0a0e1a 0%, #070b14 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
          animation: 'legal-modal-in 0.25s cubic-bezier(0.34,1.3,0.64,1) both',
          overflow: 'hidden',
          margin: 'auto',
        }}
      >
        {/* Sticky header */}
        <div style={{
          flexShrink: 0, padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <h2 id="legal-modal-title" style={{
              margin: '0 0 4px', fontFamily: "'Syne', sans-serif",
              fontWeight: 700, fontSize: 20, color: '#fff', letterSpacing: '-0.01em',
            }}>{title}</h2>
            <p style={{
              margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.25)',
              fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.06em',
            }}>Last updated: <Placeholder text={lastUpdated} /></p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close modal"
            style={{
              flexShrink: 0, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99,
              width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', minHeight: 0 }}>
          {isCookies
            ? <CookieContent onSave={onClose} onReject={onClose} />
            : <LegalContent doc={doc} />
          }
        </div>

        {/* Sticky footer — only for legal docs, not cookies (which has its own buttons) */}
        {!isCookies && (
          <div style={{
            flexShrink: 0, padding: '14px 24px 18px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', justifyContent: 'flex-end',
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 28px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
                fontSize: 12, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
            >CLOSE</button>
          </div>
        )}
      </div>
    </div>
  )
}
