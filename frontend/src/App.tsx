import { useState } from 'react'
import * as api from './api'
import ActionPlan from './components/ActionPlan'
import Evidence from './components/Evidence'
import GoldenHour from './components/GoldenHour'
import Intake from './components/Intake'
import LendingCheck from './components/LendingCheck'
import Question from './components/Question'
import VerdictView from './components/Verdict'
import { t } from './i18n'
import type { Lang, Verdict } from './types'

type Payload = { input_type: string; text?: string; image_b64?: string }

export default function App() {
  const [lang, setLang] = useState<Lang>('en')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [last, setLast] = useState<Payload | null>(null)
  const [busy, setBusy] = useState(false)
  const [researching, setResearching] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [cleared, setCleared] = useState(false)
  const L = t(lang)

  async function run(fn: () => Promise<Verdict>, flag = setBusy) {
    flag(true)
    setErr(null)
    setCleared(false)
    try {
      setVerdict(await fn())
    } catch (e) {
      setErr(String(e))
    } finally {
      flag(false)
    }
  }

  function onSubmit(p: Payload) {
    setLast(p)
    // Fast path: no web search, so the verdict lands well inside the one-minute target.
    run(() => api.analyze({ ...p, session_id: verdict?.session_id, lang }))
  }

  const onResearch = () =>
    run(
      () => api.analyze({ ...last!, session_id: verdict!.session_id, lang, deep: true }),
      setResearching,
    )

  const onAnswer = (answer: string) =>
    run(() => api.investigate(verdict!.session_id, answer, lang))

  async function reset() {
    if (verdict) await api.deleteSession(verdict.session_id)
    setVerdict(null)
    setLast(null)
    setCleared(true)
  }

  return (
    <div className="page">
      <header>
        <div>
          <h1>{L.title}</h1>
          <p className="sub">{L.subtitle}</p>
        </div>
        <div className="head-right">
          <button className="ghost" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>
          {verdict && (
            <button className="ghost" onClick={reset}>
              {L.reset}
            </button>
          )}
        </div>
      </header>

      <Intake lang={lang} busy={busy} onSubmit={onSubmit} />

      {cleared && <p className="cleared">{L.cleared}</p>}
      {err && <p className="err">{err}</p>}

      {verdict && (
        <>
          <VerdictView v={verdict} lang={lang} />

          {last && (
            <div className="research-bar">
              {verdict.researched ? (
                <span className="done">{L.researched}</span>
              ) : (
                <button className="ghost" disabled={researching} onClick={onResearch}>
                  {researching ? L.researching : L.research}
                </button>
              )}
            </div>
          )}

          {verdict.needs_investigation && verdict.next_question && (
            <Question question={verdict.next_question} busy={busy} onAnswer={onAnswer} />
          )}
          {verdict.user_state === 'money_sent' && <GoldenHour lang={lang} />}
          <ActionPlan v={verdict} lang={lang} />
          <Evidence v={verdict} lang={lang} />
        </>
      )}

      <LendingCheck lang={lang} />

      <footer>
        Advisory only. Nothing you enter is stored beyond this session. This tool never asks
        for an OTP, PIN or password, and never reports on your behalf.
      </footer>
    </div>
  )
}
