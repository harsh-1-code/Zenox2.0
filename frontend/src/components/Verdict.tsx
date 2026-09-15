import { t } from '../i18n'
import type { Lang, Verdict } from '../types'

const DNA_ROWS: [keyof Verdict['scam_dna'], string][] = [
  ['impersonation', 'Pretending to be'],
  ['urgency', 'Pressure'],
  ['claim_type', 'Claim'],
  ['credential_risk', 'Asks for credentials'],
  ['link_app_risk', 'Link / app risk'],
  ['channel', 'Channel'],
]

export default function VerdictView({ v, lang }: { v: Verdict; lang: Lang }) {
  const L = t(lang)
  return (
    <section className={`card verdict ${v.risk_state}`}>
      <div className="risk-state">{L.risk[v.risk_state]}</div>
      <p className="summary">{v.summary}</p>

      <h3>{L.scamDna}</h3>
      <div className="dna">
        {DNA_ROWS.map(([k, label]) => {
          const val = v.scam_dna[k]
          if (!val || val === 'none' || val === 'unknown') return null
          return (
            <div key={k} className="dna-cell">
              <span className="dna-k">{label}</span>
              <span className="dna-v">{String(val)}</span>
            </div>
          )
        })}
        {v.scam_dna.requested_action.length > 0 && (
          <div className="dna-cell">
            <span className="dna-k">They want you to</span>
            <span className="dna-v">{v.scam_dna.requested_action.join(', ')}</span>
          </div>
        )}
        {v.scam_dna.manipulation.length > 0 && (
          <div className="dna-cell">
            <span className="dna-k">Tactics</span>
            <span className="dna-v">{v.scam_dna.manipulation.join(', ')}</span>
          </div>
        )}
      </div>
    </section>
  )
}
