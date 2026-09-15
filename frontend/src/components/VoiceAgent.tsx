import { useEffect, useRef, useState } from 'react'
import { assistant } from '../api'
import { t } from '../i18n'
import type { AssistantAction, Lang } from '../types'
import * as voice from '../voice'
import { Mic, Sparkle, Stop, X } from './Icons'

type Turn = { role: 'user' | 'assistant'; text: string }

/**
 * The in-app guide. Tap, speak, hear an answer, and it can drive the app for you.
 *
 * Typing always works. Speech is an enhancement layered on top - if the device has no
 * recogniser, or the permission is refused, the panel stays fully usable.
 */
export default function VoiceAgent({
  lang,
  sessionId,
  onAction,
}: {
  lang: Lang
  sessionId?: string
  onAction: (a: AssistantAction, text?: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [listening, setListening] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [hasMic, setHasMic] = useState(false)
  const [typed, setTyped] = useState('')
  const L = t(lang)
  const scroller = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    voice.micAvailable().then(setHasMic)
  }, [])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [turns, thinking])

  // Leaving the panel must never leave a voice talking to an empty room.
  useEffect(() => {
    if (!open) {
      voice.stopSpeaking()
      voice.stopListening()
      setSpeaking(false)
      setListening(false)
    }
  }, [open])

  async function send(text: string) {
    if (!text.trim()) return
    const history = turns.map((x) => ({ role: x.role, text: x.text }))
    setTurns((t) => [...t, { role: 'user', text }])
    setTyped('')
    setThinking(true)
    try {
      const r = await assistant(text, lang, sessionId, history)
      setTurns((t) => [...t, { role: 'assistant', text: r.say }])
      setThinking(false)
      setSpeaking(true)
      await voice.speak(r.say, lang)
      setSpeaking(false)
      if (r.action !== 'none') onAction(r.action, r.check_text)
      if (r.action === 'run_check') setOpen(false)
    } catch {
      setThinking(false)
      setTurns((t) => [...t, { role: 'assistant', text: L.voiceError }])
    }
  }

  async function mic() {
    if (listening) {
      await voice.stopListening()
      setListening(false)
      return
    }
    if (!(await voice.requestMic())) {
      setTurns((t) => [...t, { role: 'assistant', text: L.micDenied }])
      setHasMic(false)
      return
    }
    setListening(true)
    const heard = await voice.listen(lang)
    setListening(false)
    if (heard) send(heard)
  }

  if (!open)
    return (
      <button className="fab" onClick={() => setOpen(true)} aria-label={L.voiceOpen}>
        <Sparkle size={22} />
        <span>{L.voiceFab}</span>
      </button>
    )

  return (
    <div className="voice-sheet" role="dialog" aria-label={L.voiceOpen}>
      <div className="voice-head">
        <span className="q-avatar" style={{ color: '#fff' }}>
          <Sparkle size={15} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b>{L.voiceName}</b>
          <i>
            {listening ? L.listening : thinking ? L.thinking : speaking ? L.speaking : L.voiceIdle}
          </i>
        </div>
        {speaking && (
          <button
            className="ghost"
            onClick={() => {
              voice.stopSpeaking()
              setSpeaking(false)
            }}
          >
            <Stop size={14} />
          </button>
        )}
        <button className="ghost" onClick={() => setOpen(false)} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      <div className="voice-body" ref={scroller}>
        {turns.length === 0 && (
          <div className="voice-hint">
            <p>{L.voiceIntro}</p>
            {L.voiceExamples.map((ex) => (
              <button key={ex} className="chip" onClick={() => send(ex)}>
                {ex}
              </button>
            ))}
          </div>
        )}
        {turns.map((x, i) => (
          <div key={i} className={`bubble ${x.role}`}>
            {x.text}
          </div>
        ))}
        {thinking && (
          <div className="bubble assistant pending">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        )}
      </div>

      <div className="voice-foot">
        {hasMic && (
          <button
            className={`mic ${listening ? 'on' : ''}`}
            onClick={mic}
            aria-label={listening ? L.listening : L.tapToSpeak}
          >
            <Mic size={20} />
          </button>
        )}
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(typed)}
          placeholder={hasMic ? L.voicePlaceholder : L.voicePlaceholderNoMic}
          aria-label={L.voicePlaceholder}
        />
        <button className="primary" disabled={!typed.trim() || thinking} onClick={() => send(typed)}>
          {L.send}
        </button>
      </div>
    </div>
  )
}
