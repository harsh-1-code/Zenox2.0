import { useEffect, useRef, useState } from 'react'
import * as api from './api'
import ActionPlan from './components/ActionPlan'
import Evidence from './components/Evidence'
import GoldenHour from './components/GoldenHour'
import HelpDesk from './components/HelpDesk'
import { Lock, Search, Shield, ShieldCheck } from './components/Icons'
import Intake from './components/Intake'
import LendingCheck from './components/LendingCheck'
import Question from './components/Question'
import VerdictView from './components/Verdict'
import VoiceAgent from './components/VoiceAgent'
import { t } from './i18n'
import type { AssistantAction, Lang, Verdict } from './types'

type Payload = { input_type: string; text?: string; image_b64?: string; app_name?: string }

const TRUST_ICONS = [ShieldCheck, Lock, Shield]
const TRUST_TONES = ['safe', 'sky', 'sky'] as const

export default function App() {
  const [lang, setLang] = useState<Lang>('hi')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [last, setLast] = useState<Payload | null>(null)
  const [busy, setBusy] = useState(false)
  const [researching, setResearching] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [cleared, setCleared] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [installer, setInstaller] = useState<any>(null)
  const [requestedMode, setRequestedMode] = useState<{ mode: any; n: number } | undefined>()
  const emergencyRef = useRef<HTMLDivElement | null>(null)
  const nonce = useRef(0)

  const L = t(lang)
  const shared = useRef(false)
  const lastShare = useRef<number | null>(null)
  const verdictRef = useRef<HTMLDivElement | null>(null)

  function showToast(m: string) {
    setToast(m)
    setTimeout(() => setToast(null), 3200)
  }

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstaller(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', () => setInstaller(null))
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  // Two ways a message reaches us without being typed:
  //   PWA - browser share target lands as ?text=...
  //   APK - MainActivity sets window.__shared and fires 'digi-shared'
  // Either way we assess straight away; it was shared because an answer is wanted now.
  useEffect(() => {
    const takeNative = () => {
      const p = (window as any).__shared
      if (!p) return
      if (p.id && p.id === lastShare.current) return // MainActivity fires twice on purpose
      lastShare.current = p.id
      delete (window as any).__shared
      if (p.image) onSubmit({ input_type: 'image', image_b64: p.image, text: p.text || undefined })
      else if (p.text) onSubmit({ input_type: 'text', text: p.text })
    }
    window.addEventListener('digi-shared', takeNative)
    takeNative()

    if (!shared.current) {
      shared.current = true
      const q = new URLSearchParams(window.location.search)
      const text = [q.get('title'), q.get('text'), q.get('url')].filter(Boolean).join('\n').trim()
      if (text) {
        window.history.replaceState({}, '', window.location.pathname)
        onSubmit({ input_type: 'text', text })
      }
    }
    return () => window.removeEventListener('digi-shared', takeNative)
  }, [])

  async function run(fn: () => Promise<Verdict>, flag = setBusy) {
    flag(true)
    setErr(null)
    setCleared(false)
    try {
      setVerdict(await fn())
      // The person is mid-panic; put the answer on screen without making them scroll.
      requestAnimationFrame(() =>
        verdictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      )
    } catch (e) {
      setErr(String(e))
    } finally {
      flag(false)
    }
  }

  function onSubmit(p: Payload) {
    setLast(p)
    // Fast path by default, so the verdict lands well inside the one-minute target.
    // An app name is the exception: the RBI directory is not bundled, so live research
    // is the only honest way to say anything about the app at all.
    const deep = p.input_type === 'app'
    run(() => api.analyze({ ...p, session_id: verdict?.session_id, lang, deep }))
  }

  const onResearch = () =>
    run(
      () => api.analyze({ ...last!, session_id: verdict!.session_id, lang, deep: true }),
      setResearching,
    )

  const onAnswer = (answer: string) => run(() => api.investigate(verdict!.session_id, answer, lang))

  function onAssistantAction(a: AssistantAction, text?: string | null) {
    const card: Record<string, string> = {
      open_message: 'text',
      open_screenshot: 'image',
      open_call: 'call',
      open_app: 'app',
    }
    if (a === 'run_check' && text) return onSubmit({ input_type: 'text', text })
    if (a === 'open_emergency')
      return emergencyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (card[a]) {
      setRequestedMode({ mode: card[a], n: ++nonce.current })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function reset() {
    if (verdict) await api.deleteSession(verdict.session_id)
    setVerdict(null)
    setLast(null)
    setCleared(true)
  }

  return (
    <div className="page">
      <div className="topbar">
        <div className="brand">
          <img className="brand-mark" src="/logo.png" alt="" width={38} height={38} />
          <div>
            <div className="brand-name">{L.brand}</div>
            <div className="brand-sub">{L.brandSub}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {installer && (
            <button
              className="install"
              onClick={async () => {
                installer.prompt()
                await installer.userChoice
                setInstaller(null)
              }}
            >
              {L.install}
            </button>
          )}
          <div className="lang-switch" role="group" aria-label="Language">
            <button className={lang === 'hi' ? 'on' : ''} onClick={() => setLang('hi')}>
              हिन्दी
            </button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>
              English
            </button>
          </div>
        </div>
      </div>

      <div className="private-badge">
        <Lock size={14} />
        <div>
          {L.privateTitle} · <span>{L.privateSub}</span>
        </div>
      </div>

      {!verdict && (
        <div className="hero">
          <h1>{L.heroTitle}</h1>
          <p>{L.heroSub}</p>
          <div className="trust-row">
            {L.trust.map(([title, sub], i) => {
              const Ico = TRUST_ICONS[i]
              const tone = TRUST_TONES[i]
              return (
                <div className="trust-chip" key={title}>
                  <span
                    className="trust-ico"
                    style={{
                      background: tone === 'safe' ? 'var(--safe-tint)' : 'var(--sky-tint)',
                      color: tone === 'safe' ? 'var(--safe)' : 'var(--sky)',
                    }}
                  >
                    <Ico size={14} />
                  </span>
                  <div>
                    <b>{title}</b>
                    <i>{sub}</i>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Intake
        lang={lang}
        busy={busy}
        onSubmit={onSubmit}
        compact={!!verdict}
        requestedMode={requestedMode}
        onToast={showToast}
      />

      {cleared && <p className="cleared">{L.cleared}</p>}
      {err && <p className="err">{err}</p>}

      {verdict && (
        <div ref={verdictRef} data-scroll-anchor>
          <VerdictView v={verdict} lang={lang} />

          {last && (
            <div className="research-bar">
              {verdict.researched ? (
                <span className="done">{L.researched}</span>
              ) : (
                <button className="ghost" disabled={researching} onClick={onResearch}>
                  {researching ? <span className="spin" style={{ borderTopColor: 'var(--sky)' }} /> : <Search size={15} />}
                  <span style={{ marginLeft: 7 }}>{researching ? L.researching : L.research}</span>
                </button>
              )}
            </div>
          )}

          {verdict.needs_investigation && verdict.next_question && (
            <Question question={verdict.next_question} busy={busy} lang={lang} onAnswer={onAnswer} />
          )}
          <div ref={emergencyRef} data-scroll-anchor>
            {verdict.user_state === 'money_sent' && <GoldenHour lang={lang} />}
          </div>
          <ActionPlan v={verdict} lang={lang} />
          <Evidence v={verdict} lang={lang} />
          <HelpDesk v={verdict} lang={lang} />
          <div className="research-bar">
            <button className="ghost" onClick={reset}>
              {L.reset}
            </button>
          </div>
        </div>
      )}

      {!verdict && <LendingCheck lang={lang} />}

      <footer>{L.footer}</footer>

      <VoiceAgent lang={lang} sessionId={verdict?.session_id} onAction={onAssistantAction} />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
