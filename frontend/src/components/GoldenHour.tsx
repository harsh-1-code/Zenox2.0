import { useEffect, useState } from 'react'
import { t } from '../i18n'
import type { Lang } from '../types'

const WINDOW_SEC = 60 * 60

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
    <section className="card golden">
      <div>
        <div className="golden-label">{L.goldenHour}</div>
        <div className="clock">
          {mm}:{ss}
        </div>
        <p className="note">
          A transfer reported quickly can sometimes be held. The clock starts from the
          transaction, not from now - report immediately.
        </p>
      </div>
      <a className="call" href="tel:1930">
        Call 1930
      </a>
    </section>
  )
}
