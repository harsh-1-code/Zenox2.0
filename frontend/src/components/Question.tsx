import { useState } from 'react'
import { t } from '../i18n'
import type { Lang } from '../types'
import { Sparkle } from './Icons'

export default function Question({
  question,
  busy,
  lang,
  onAnswer,
}: {
  question: string
  busy: boolean
  lang: Lang
  onAnswer: (a: string) => void
}) {
  const [a, setA] = useState('')
  const L = t(lang)

  return (
    <section className="card reveal question">
      <div className="q-head">
        <span className="q-avatar" style={{ color: '#fff' }}>
          <Sparkle size={16} />
        </span>
        <p className="q">{question}</p>
      </div>
      <div className="row" style={{ marginTop: 0 }}>
        <input
          value={a}
          onChange={(e) => setA(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && a && onAnswer(a)}
          placeholder={L.yourAnswer}
          aria-label={question}
        />
        <button className="primary" disabled={busy || !a} onClick={() => onAnswer(a)}>
          {busy ? <span className="spin" /> : null}
          {L.answer}
        </button>
      </div>
      <p className="note">{L.questionNote}</p>
    </section>
  )
}
