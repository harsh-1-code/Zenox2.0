import { useState } from 'react'
import { t } from '../i18n'
import type { Lang } from '../types'

const EXAMPLES = [
  ['Genuine bank SMS', 'Rs 2,340.00 debited from A/c XX4412 on 12-09-25 to SWIGGY. Not you? Call 18002026161. -Axis Bank'],
  ['KYC scam', 'Dear Customer, your bank KYC has expired. Your account will be blocked today. Update immediately: http://kyc-update-verify.in/hdfc'],
  ['Digital arrest', 'A man on a video call said he is from CBI, that a parcel in my name had drugs, and I am under digital arrest. He says I must transfer money to a verification account.'],
  ['Money already sent', 'I got a call saying my electricity would be cut, and I paid Rs 8,000 on a link they sent. I think it was fake.'],
]

export default function Intake({
  lang,
  busy,
  onSubmit,
}: {
  lang: Lang
  busy: boolean
  onSubmit: (p: { input_type: string; text?: string; image_b64?: string }) => void
}) {
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const L = t(lang)

  function onFile(f: File) {
    const r = new FileReader()
    r.onload = () => setImage(String(r.result).split(',')[1])
    r.readAsDataURL(f)
  }

  return (
    <section className="card intake">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={L.placeholder}
        rows={4}
      />
      <div className="row">
        <label className="ghost file">
          Screenshot
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>
        {image && <span className="pill">image attached</span>}
        <button
          className="primary"
          disabled={busy || (!text && !image)}
          onClick={() =>
            onSubmit({
              input_type: image ? 'image' : 'text',
              text: text || undefined,
              image_b64: image ?? undefined,
            })
          }
        >
          {busy ? L.checking : L.check}
        </button>
      </div>
      <div className="examples">
        <span>{L.tryExample}:</span>
        {EXAMPLES.map(([name, body]) => (
          <button key={name} className="link" onClick={() => setText(body)}>
            {name}
          </button>
        ))}
      </div>
    </section>
  )
}
