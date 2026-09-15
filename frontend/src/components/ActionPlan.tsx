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
    <section className="card actions">
      {ORDER.map((kind) => {
        const items = v.actions.filter((a) => a.kind === kind)
        if (!items.length) return null
        return (
          <div key={kind} className={`group ${kind}`}>
            <h3>{label[kind]}</h3>
            <ol>
              {items.map((a, i) => (
                <li key={i}>
                  {a.text}
                  {a.deadline_minutes && (
                    <span className="deadline">within {a.deadline_minutes} min</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )
      })}
    </section>
  )
}
