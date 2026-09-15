import { t } from '../i18n'
import type { Lang, Verdict } from '../types'

export default function Evidence({ v, lang }: { v: Verdict; lang: Lang }) {
  const L = t(lang)
  return (
    <section className="card evidence">
      <div className="col">
        <h3 className="risk">{L.scamEvidence}</h3>
        <ul>
          {v.scam_evidence.map((e, i) => (
            <li key={i}>
              <span className="tag">{e.type}</span> {e.statement}
              {e.source_id && <span className="src">{e.source_id}</span>}
            </li>
          ))}
          {v.scam_evidence.length === 0 && <li className="muted">None found.</li>}
        </ul>
      </div>

      <div className="col">
        <h3 className="ok">{L.legitEvidence}</h3>
        <ul>
          {v.legitimacy_evidence.map((e, i) => (
            <li key={i}>
              <span className="tag">{e.type}</span> {e.statement}
            </li>
          ))}
          {v.legitimacy_evidence.length === 0 && <li className="muted">None found.</li>}
        </ul>
      </div>

      <div className="col">
        <h3 className="unk">{L.unknowns}</h3>
        <ul>
          {v.unknowns.map((u, i) => (
            <li key={i}>{u}</li>
          ))}
          {v.unknowns.length === 0 && <li className="muted">Nothing outstanding.</li>}
        </ul>
      </div>

      {v.sources.length > 0 && (
        <div className="sources">
          <div>
            <strong>{L.sources}:</strong>{' '}
            {v.sources
              .filter((s) => !s.source_id.startsWith('WEB-'))
              .map((s) => (
                <a key={s.source_id} href={s.url} target="_blank" rel="noreferrer">
                  {s.title} ({s.last_verified})
                </a>
              ))}
          </div>
          {v.researched && (
            <div className="web-sources">
              <strong>Checked live:</strong>{' '}
              {v.sources
                .filter((s) => s.source_id.startsWith('WEB-'))
                .map((s) => (
                  <a key={s.source_id} href={s.url} target="_blank" rel="noreferrer">
                    {s.title}
                  </a>
                ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
