import { useState } from 'react'
import { t } from '../i18n'
import type { Lang } from '../types'

// PS-1 multi-modal intake: image, text, app name, or a free-text description of a call.
// A call is described, not recorded - the browser has no access to telephony audio and
// the PS does not ask for it.
const MODES = ['text', 'image', 'call', 'app'] as const
type Mode = (typeof MODES)[number]

const EXAMPLES: Record<Mode, [string, string][]> = {
  text: [
    [
      'Genuine bank SMS',
      'Rs 2,340.00 debited from A/c XX4412 on 12-09-25 to SWIGGY. Not you? Call 18002026161. -Axis Bank',
    ],
    [
      'KYC scam',
      'Dear Customer, your HDFC Bank KYC has expired. Account will be blocked today. Update now: http://hdfc-kyc-verify.in/update',
    ],
    [
      'Parcel fee',
      'Your parcel is held at customs. Pay a clearance fee of Rs 45 within 12 hours to release it: bit.ly/parcel-clear',
    ],
  ],
  image: [],
  call: [
    [
      'Digital arrest',
      'A man on a video call said he is from CBI, that a parcel in my name had drugs, and that I am under digital arrest. He says I must stay on the call and transfer money to a verification account.',
    ],
    [
      'Money already sent',
      'I got a call saying my electricity would be cut tonight, and I paid Rs 8,000 on a link they sent. I think it was fake.',
    ],
    [
      'Bank KYC call',
      'Someone called saying he is from my bank and my KYC will expire today. He asked me to read out the OTP I would receive.',
    ],
  ],
  app: [],
}

export default function Intake({
  lang,
  busy,
  onSubmit,
}: {
  lang: Lang
  busy: boolean
  onSubmit: (p: {
    input_type: string
    text?: string
    image_b64?: string
    app_name?: string
  }) => void
}) {
  const [mode, setMode] = useState<Mode>('text')
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const L = t(lang)

  function onFile(f: File) {
    setFileName(f.name)
    const r = new FileReader()
    r.onload = () => setImage(String(r.result).split(',')[1])
    r.readAsDataURL(f)
  }

  function submit() {
    onSubmit({
      input_type: mode,
      text: mode === 'app' ? undefined : text || undefined,
      app_name: mode === 'app' ? text.trim() : undefined,
      image_b64: mode === 'image' ? image ?? undefined : undefined,
    })
  }

  const ready = mode === 'image' ? !!image : text.trim().length > 2
  const examples = EXAMPLES[mode]

  return (
    <section className="card intake">
      <div className="tabs">
        {MODES.map((m) => (
          <button
            key={m}
            className={`tab ${mode === m ? 'on' : ''}`}
            onClick={() => {
              setMode(m)
              setText('')
              setImage(null)
              setFileName('')
            }}
          >
            {L.modes[m]}
          </button>
        ))}
      </div>

      {mode === 'image' ? (
        <label className="dropzone">
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          {image ? (
            <span className="pill">{fileName || 'image attached'}</span>
          ) : (
            <span>{L.dropHint}</span>
          )}
        </label>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={L.placeholders[mode]}
          rows={mode === 'app' ? 1 : 4}
          onKeyDown={(e) => mode === 'app' && e.key === 'Enter' && ready && submit()}
        />
      )}

      <div className="row">
        {mode === 'call' && <span className="hint">{L.callHint}</span>}
        <button className="primary" disabled={busy || !ready} onClick={submit}>
          {busy ? L.checking : L.check}
        </button>
      </div>

      {examples.length > 0 && (
        <div className="examples">
          <span>{L.tryExample}:</span>
          {examples.map(([name, body]) => (
            <button key={name} className="link" onClick={() => setText(body)}>
              {name}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
