import { useEffect, useState } from 'react'
import { t } from '../i18n'
import type { Lang } from '../types'
import { Phone } from './Icons'

const WINDOW_SEC = 60 * 60

/** Emergency assistance, kept calm: a countdown and two real routes, no flashing. */
export default function GoldenHour({ lang }: { lang: Lang }) {
  const [left, setLeft] = useState(WINDOW_SEC)
  const L = t(lang)

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  return (
    <section className="card reveal emergency">
      <h3>{L.emergencyTitle}</h3>
      <p>{L.emergencySub}</p>

      <div className="clock-wrap">
        <span className="clock" role="timer" aria-live="off">
          {mm}:{ss}
        </span>
        <span className="clock-label">{L.goldenHour}</span>
      </div>

      <div className="emergency-actions">
        <a className="call-1930" href="tel:1930">
          <Phone size={18} />
          {L.call1930}
        </a>
        <a className="ncrp" href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer">
          {L.reportOnline}
        </a>
      </div>
      <p className="note">{L.goldenNote}</p>
    </section>
  )
}
