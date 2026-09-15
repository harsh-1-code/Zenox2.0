import { t } from '../i18n'
import type { Lang, Verdict } from '../types'
import RiskGauge from './RiskGauge'

const ACRONYMS = new Set(['sms', 'otp', 'upi', 'kyc', 'cbi', 'pin', 'apk', 'ncrp', 'rbi'])

/** kyc_expiry -> KYC expiry · sms -> SMS · bank -> Bank */
export function humanise(v: string): string {
  return v
    .split(/[_\s]+/)
    .map((w, i) =>
      ACRONYMS.has(w.toLowerCase())
        ? w.toUpperCase()
        : i === 0
          ? w.charAt(0).toUpperCase() + w.slice(1)
          : w,
    )
    .join(' ')
}

const DNA_KEYS = ['impersonation', 'urgency', 'credential_risk', 'link_app_risk'] as const

export default function VerdictView({ v, lang }: { v: Verdict; lang: Lang }) {
  const L = t(lang)
  return (
    <section className={`card reveal risk-card ${v.risk_state}`}>
      <div className="risk-head">
        <div className="risk-main">
          <div className="risk-state">{L.risk[v.risk_state]}</div>
          {v.scam_dna.claim_type && (
            <div className="risk-pattern">
              {L.likely} {L.claim[v.scam_dna.claim_type] ?? humanise(v.scam_dna.claim_type)}
            </div>
          )}
        </div>
        <RiskGauge state={v.risk_state} label={L.risk[v.risk_state]} />
      </div>

      <div className="risk-body">
        <p className="summary">{v.summary}</p>

        {v.lending && (
          <div className={`lending-result ${v.lending.status}`}>
            <strong>
              {L.referenceList}: {humanise(v.lending.status)}
            </strong>
            {v.lending.matches.map((m) => (
              <div key={m.app}>
                {m.app} — {m.entity} ({m.entity_type})
              </div>
            ))}
            {v.lending.note && <p className="note">{v.lending.note}</p>}
            <p className="src-line">
              {v.lending.source} · {L.lastUpdated} {v.lending.last_updated}
            </p>
          </div>
        )}

        <div className="dna">
          {DNA_KEYS.map((k) => {
            const label = L.dna[k]
            const val = v.scam_dna[k]
            if (!val || val === 'none' || val === 'unknown') return null
            return (
              <div key={k} className="dna-cell">
                <span className="dna-k">{label}</span>
                <span className="dna-v">{humanise(String(val))}</span>
              </div>
            )
          })}
          {v.scam_dna.requested_action.length > 0 && (
            <div className="dna-cell">
              <span className="dna-k">{L.dna.requested_action}</span>
              <span className="dna-v">{v.scam_dna.requested_action.map(humanise).join(', ')}</span>
            </div>
          )}
          {v.scam_dna.manipulation.length > 0 && (
            <div className="dna-cell">
              <span className="dna-k">{L.dna.manipulation}</span>
              <span className="dna-v">{v.scam_dna.manipulation.map(humanise).join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
