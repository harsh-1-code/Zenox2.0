import { useState } from 'react'

export default function Question({
  question,
  busy,
  onAnswer,
}: {
  question: string
  busy: boolean
  onAnswer: (a: string) => void
}) {
  const [a, setA] = useState('')
  return (
    <section className="card question">
      <p className="q">{question}</p>
      <div className="row">
        <input
          value={a}
          onChange={(e) => setA(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && a && onAnswer(a)}
          placeholder="Your answer"
        />
        <button className="primary" disabled={busy || !a} onClick={() => onAnswer(a)}>
          Answer
        </button>
      </div>
      <p className="note">
        We only ask what changes the advice. We will never ask for an OTP, PIN or password.
      </p>
    </section>
  )
}
