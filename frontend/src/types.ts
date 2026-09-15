// Mirrors backend/app/schemas.py. Change there first.

export type RiskState = 'LIKELY_LEGIT' | 'SUSPICIOUS' | 'HIGH_RISK' | 'UNCERTAIN'
export type EvidenceType = 'OBSERVED' | 'VERIFIED' | 'INFERRED' | 'UNKNOWN' | 'CONFLICTING'
export type UserState =
  | 'nothing_done'
  | 'clicked_or_installed'
  | 'credentials_shared'
  | 'money_sent'
export type Lang = 'en' | 'hi'

export interface ScamDNA {
  impersonation: string | null
  urgency: 'none' | 'low' | 'medium' | 'high'
  requested_action: string[]
  payment_request: boolean
  credential_risk: 'none' | 'possible' | 'explicit'
  link_app_risk: 'none' | 'suspicious' | 'high'
  manipulation: string[]
  claim_type: string | null
  channel: string
}

export interface Evidence {
  type: EvidenceType
  statement: string
  source_id: string | null
}

export interface Action {
  text: string
  kind: 'do_not' | 'do_now' | 'verify' | 'preserve'
  deadline_minutes: number | null
}

export interface Verdict {
  session_id: string
  scam_dna: ScamDNA
  scam_evidence: Evidence[]
  legitimacy_evidence: Evidence[]
  unknowns: string[]
  claims: string[]
  risk_state: RiskState
  user_state: UserState
  needs_investigation: boolean
  next_question: string | null
  summary: string
  actions: Action[]
  researched: boolean
  lending: LendingResult | null
  sources: { source_id: string; title: string; publisher: string; url: string; last_verified: string }[]
}

export interface LendingResult {
  status: 'MATCHED' | 'NOT_FOUND' | 'AMBIGUOUS' | 'DIRECTORY_NOT_LOADED'
  matches: { app: string; entity: string; entity_type: string }[]
  source: string
  source_url: string
  last_updated: string
  note: string
}

export interface HelpdeskResult {
  case_summary: string
  reporting_script: {
    call: string
    portal: string
    say_this: string
    they_will_ask: string[]
    reminder: string
  }
}
