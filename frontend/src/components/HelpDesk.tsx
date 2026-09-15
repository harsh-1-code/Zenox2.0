import { useState } from 'react'
import { helpdesk } from '../api'
import { t } from '../i18n'
import type { HelpdeskResult, Lang, Verdict } from '../types'

export default function HelpDesk({ v, lang }: { v: Verdict; lang: Lang }) {
  const [r, setR] = useState<HelpdeskResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const L = t(lang)

  async function open() {
    setBusy(true)
    try {
      setR(await helpdesk(v))
    } finally {
      setBusy(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(r!.case_summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!r)
    return (
      <div className="research-bar">
        <button className="ghost" disabled={busy} onClick={open}>
          {busy ? '...' : L.helpdesk}
        </button>
      </div>
    )

  return (
    <section className="card helpdesk">
      <h3>{L.helpdeskTitle}</h3>
      <pre>{r.case_summary}</pre>
      <div className="row">
        <button className="ghost" onClick={copy}>
          {copied ? L.copied : L.copy}
        </button>
        <button className="ghost" onClick={() => window.print()}>
          {L.print}
        </button>
      </div>

      <h3 className="script-h">{L.script}</h3>
      <div className="script">
        <p>
          <strong>{r.reporting_script.call}</strong> ·{' '}
          <a href={r.reporting_script.portal} target="_blank" rel="noreferrer">
            {r.reporting_script.portal}
          </a>
        </p>
        <p className="say">“{r.reporting_script.say_this}”</p>
        <p className="note">{L.theyAsk}</p>
        <ol>
          {r.reporting_script.they_will_ask.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
        <p className="note">{r.reporting_script.reminder}</p>
      </div>
    </section>
  )
}
