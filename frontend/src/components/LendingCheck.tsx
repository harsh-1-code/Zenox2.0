import { useState } from 'react'
import { checkLendingApp } from '../api'
import { t } from '../i18n'
import type { Lang, LendingResult } from '../types'

export default function LendingCheck({ lang }: { lang: Lang }) {
  const [name, setName] = useState('')
  const [res, setRes] = useState<LendingResult | null>(null)
  const L = t(lang)

  return (
    <section className="card lending">
      <h3>{L.lendingTitle}</h3>
      <div className="row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={L.lendingPlaceholder}
        />
        <button className="ghost" disabled={!name} onClick={() => checkLendingApp(name).then(setRes)}>
          Check
        </button>
      </div>
      {res && (
        <div className={`lending-result ${res.status}`}>
          <strong>{res.status.replace('_', ' ')}</strong>
          {res.matches.map((m) => (
            <div key={m.app}>
              {m.app} — {m.entity} ({m.entity_type})
            </div>
          ))}
          {res.note && <p className="note">{res.note}</p>}
          <p className="src-line">
            Source: {res.source} · last updated {res.last_updated}
          </p>
        </div>
      )}
    </section>
  )
}
