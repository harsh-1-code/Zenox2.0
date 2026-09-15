import { useEffect, useState } from 'react'
import { t } from '../i18n'
import type { Lang } from '../types'
import { Check, Grid, Image, Message, Phone } from './Icons'

// PS-1 multi-modal intake: message, screenshot, call description, app name.
// A call is described, not recorded - a browser cannot reach telephony audio and the PS
// asks for "a free-text description of a call".
const MODES = ['text', 'image', 'call', 'app'] as const
type Mode = (typeof MODES)[number]

const ICON = { text: Message, image: Image, call: Phone, app: Grid }
const TONE = { text: 'msg', image: 'shot', call: 'call', app: 'app' } as const

const EXAMPLES: Record<Mode, [string, string][]> = {
  text: [
    ['Bank KYC SMS', 'Dear Customer, your HDFC Bank KYC has expired. Account will be blocked today. Update now: http://hdfc-kyc-verify.in/update'],
    ['Parcel delivery', 'Your parcel is held at customs. Pay a clearance fee of Rs 45 within 12 hours to release it: bit.ly/parcel-clear'],
    ['Genuine bank SMS', 'Rs 2,340.00 debited from A/c XX4412 on 12-09-25 to SWIGGY. Not you? Call 18002026161. -Axis Bank'],
  ],
  image: [],
  call: [
    ['Digital arrest', 'A man on a video call said he is from CBI, that a parcel in my name had drugs, and that I am under digital arrest. He says I must stay on the call and transfer money to a verification account.'],
    ['Paisa bhej diya', 'I got a call saying my electricity would be cut tonight, and I paid Rs 8,000 on a link they sent. I think it was fake.'],
    ['Bank KYC call', 'Someone called saying he is from my bank and my KYC expires today. He asked me to read out the OTP I would receive.'],
  ],
  app: [],
}

export default function Intake({
  lang,
  busy,
  onSubmit,
  compact = false,
  requestedMode,
  onToast,
}: {
  lang: Lang
  busy: boolean
  compact?: boolean
  requestedMode?: { mode: Mode; n: number }
  onToast: (m: string) => void
  onSubmit: (p: { input_type: string; text?: string; image_b64?: string; app_name?: string }) => void
}) {
  const [mode, setMode] = useState<Mode>('text')
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [open, setOpen] = useState(false)
  const L = t(lang)
  const collapsed = compact && !open

  // The voice guide can say "open the call card" - honour it and expand if collapsed.
  useEffect(() => {
    if (!requestedMode) return
    setMode(requestedMode.mode)
    setOpen(true)
  }, [requestedMode?.n])

  function onFile(f: File) {
    setFileName(f.name)
    const r = new FileReader()
    r.onload = () => {
      setImage(String(r.result).split(',')[1])
      onToast(L.toastShot)
    }
    r.readAsDataURL(f)
  }

  const ready = mode === 'image' ? !!image : text.trim().length > 2

  function submit() {
    if (!ready) return onToast(L.toastEmpty)
    onSubmit({
      input_type: mode,
      text: mode === 'app' ? undefined : text || undefined,
      app_name: mode === 'app' ? text.trim() : undefined,
      image_b64: mode === 'image' ? image ?? undefined : undefined,
    })
    setOpen(false)
  }

  if (collapsed)
    return (
      <div className="card" style={{ padding: '10px 14px' }}>
        <button className="link" style={{ padding: 0 }} onClick={() => setOpen(true)}>
          {L.checkAnother}
        </button>
      </div>
    )

  return (
    <section className="card">
      <h2 className="section-h">{L.whatToCheck}</h2>

      <div className="modes">
        {MODES.map((m) => {
          const Ico = ICON[m]
          const on = mode === m
          return (
            <button
              key={m}
              className={`mode ${on ? 'on' : ''}`}
              aria-pressed={on}
              onClick={() => {
                setMode(m)
                setText('')
                setImage(null)
                setFileName('')
              }}
            >
              <span
                className="mode-ico"
                style={{
                  background: `var(--mode-${TONE[m]}-bg)`,
                  color: `var(--mode-${TONE[m]})`,
                }}
              >
                <Ico size={19} />
              </span>
              <span className="mode-t">{L.modes[m]}</span>
              <span className="mode-d">{L.modeDesc[m]}</span>
              {on && (
                <span className="mode-check">
                  <Check size={11} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        {mode === 'image' ? (
          <label className="dropzone">
            <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <Image size={26} />
            <span>{image ? fileName || L.dropDone : L.dropHint}</span>
          </label>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={L.placeholders[mode]}
            rows={mode === 'app' ? 1 : 4}
            aria-label={L.modes[mode]}
            onKeyDown={(e) => mode === 'app' && e.key === 'Enter' && submit()}
          />
        )}
      </div>

      <div className="row">
        {mode === 'call' && <span className="mode-d">{L.callHint}</span>}
        <button className="primary" disabled={busy} onClick={submit}>
          {busy ? (
            <>
              <span className="spin" />
              {L.checking}
            </>
          ) : (
            L.check
          )}
        </button>
      </div>

      {EXAMPLES[mode].length > 0 && (
        <div className="chips">
          <span>{L.tryExample}</span>
          {EXAMPLES[mode].map(([name, body]) => (
            <button key={name} className="chip" onClick={() => setText(body)}>
              {name}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
