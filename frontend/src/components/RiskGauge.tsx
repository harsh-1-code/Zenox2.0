import { useEffect, useState } from 'react'
import type { RiskState } from '../types'

/**
 * Semicircle risk meter.
 *
 * Deliberately NOT a percentage. PS-1's reference architecture forbids fake precision
 * ("97% scam") unless the number comes from a calibrated evaluation, and we do not have
 * one. The arc encodes the four interpretable states; the label states the level in
 * words so the meaning never depends on colour alone.
 */
const FILL: Record<RiskState, number> = {
  LIKELY_LEGIT: 0.2,
  UNCERTAIN: 0.45,
  SUSPICIOUS: 0.68,
  HIGH_RISK: 0.95,
}
const COLOUR: Record<RiskState, string> = {
  LIKELY_LEGIT: '#0b8f57',
  UNCERTAIN: '#6b7c93',
  SUSPICIOUS: '#b26a00',
  HIGH_RISK: '#d64545',
}

export default function RiskGauge({ state, label }: { state: RiskState; label: string }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setT(FILL[state]))
    return () => cancelAnimationFrame(id)
  }, [state])

  const R = 34
  const LEN = Math.PI * R // half circumference

  return (
    <div className="gauge">
      <svg width="92" height="56" viewBox="0 0 92 56" role="img" aria-label={label}>
        <path
          d="M12 48a34 34 0 0 1 68 0"
          fill="none"
          stroke="#e4eaf3"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M12 48a34 34 0 0 1 68 0"
          fill="none"
          stroke={COLOUR[state]}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={LEN}
          strokeDashoffset={LEN * (1 - t)}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,0.9,0.32,1)' }}
        />
      </svg>
      <div className="gauge-label" style={{ color: COLOUR[state] }}>
        {label}
      </div>
    </div>
  )
}
