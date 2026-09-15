import { t } from '../i18n'
import type { Lang, Verdict } from '../types'

export default function Evidence({ v, lang }: { v: Verdict; lang: Lang }) {
  const L = t(lang)

  const block = (
    title: string,
    tone: 'risk' | 'ok' | 'unk',
    items: { statement: string; type?: string; source_id?: string | null }[],
    empty: string,
  ) => (
    <div style={{ marginBottom: 16 }}>
      <h3 className={`group-h ${tone === 'risk' ? 'do_not' : tone === 'ok' ? 'verify' : 'preserve'}`}>
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>
          {empty}
        </p>
      ) : (
        <ul className="signal-list">
          {items.map((e, i) => (
            <li key={i} className="signal">
              <span className={`signal-n ${tone}`}>{i + 1}</span>
              <span className="signal-t">
                {e.type && <span className="tag">{e.type}</span>}
                {e.statement}
                {e.source_id && <span className="signal-src">{e.source_id}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <section className="card reveal">
      <h2 className="section-h">{L.whyFlagged}</h2>
      {block(L.scamEvidence, 'risk', v.scam_evidence, L.noneFound)}
      {block(L.legitEvidence, 'ok', v.legitimacy_evidence, L.noneFound)}
      {block(L.unknowns, 'unk', v.unknowns.map((u) => ({ statement: u })), L.nothingOutstanding)}

      {v.sources.length > 0 && (
        <div className="sources">
          <div>
            <strong>{L.sources}:</strong>{' '}
            {v.sources
              .filter((s) => !s.source_id.startsWith('WEB-'))
              .map((s) => (
                <a key={s.source_id} href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
              ))}
          </div>
          {v.researched && (
            <div className="web-sources">
              <strong>{L.checkedLive}:</strong>{' '}
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
