import { t } from '../i18n'
import type { Action, Lang, Verdict } from '../types'

const ORDER: Action['kind'][] = ['do_now', 'do_not', 'verify', 'preserve']

export default function ActionPlan({ v, lang }: { v: Verdict; lang: Lang }) {
  const L = t(lang)
  const label: Record<Action['kind'], string> = {
    do_now: L.doNow,
    do_not: L.doNot,
    verify: L.verify,
    preserve: L.preserve,
  }

  return (
    <section className="card reveal actions">
      <h2 className="section-h">{L.whatNow}</h2>
      {ORDER.map((kind) => {
        const items = v.actions.filter((a) => a.kind === kind)
        if (!items.length) return null
        return (
          <div key={kind} className="group">
            <h3 className={`group-h ${kind}`}>{label[kind]}</h3>
            {items.map((a, i) => (
              <div key={i} className={`step ${kind}`}>
                <span className="step-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="step-t">
                  {a.text}
                  {a.deadline_minutes && (
                    <span className="deadline">
                      {L.within} {a.deadline_minutes} {L.min}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )
      })}
    </section>
  )
}
