import { useCallback, useEffect, useRef, useState } from 'react'
import { assistant } from '../api'
import { t } from '../i18n'
import type { AssistantAction, Lang } from '../types'
import * as voice from '../voice'
import { Keyboard, Mic, MicOff, Sparkle, X } from './Icons'

type Turn = { role: 'user' | 'assistant'; text: string }
type Phase = 'idle' | 'listening' | 'thinking' | 'speaking'

/**
 * Hands-free voice mode.
 *
 * One continuous conversation: it listens, answers aloud, then listens again without
 * anyone tapping. Tap the orb at any point to interrupt — barge-in matters more than
 * animation, because a person mid-panic should never have to wait out a sentence.
 *
 * Typing stays available underneath. Speech is an enhancement; a device without a
 * recogniser still gets the whole assistant.
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
  const [phase, setPhase] = useState<Phase>('idle')
  const [turns, setTurns] = useState<Turn[]>([])
  const [hasMic, setHasMic] = useState(false)
  const [handsFree, setHandsFree] = useState(false)
  const [typed, setTyped] = useState('')
  const [muted, setMuted] = useState(false)
  const [level, setLevel] = useState(0)
  const [hasLevel, setHasLevel] = useState(false)
  // Which language the recogniser listens in. Android cannot auto-detect, and listening
  // in the wrong one transliterates speech into gibberish - so it is an explicit choice.
  const [sttLang, setSttLang] = useState<Lang>(lang)
  const [keyboard, setKeyboard] = useState(false)
  const L = t(lang)

  // A ref, not state: the async loop below must see the live value, not a stale closure.
  const running = useRef(false)
  const turnsRef = useRef<Turn[]>([])
  const stopMeter = useRef<(() => void) | null>(null)
  const misses = useRef(0)
  turnsRef.current = turns

  useEffect(() => {
    voice.micAvailable().then(setHasMic)
  }, [])

  const stopAll = useCallback(async () => {
    running.current = false
    stopMeter.current?.()
    stopMeter.current = null
    setLevel(0)
    setHandsFree(false)
    await voice.stopSpeaking()
    await voice.stopListening()
    setPhase('idle')
  }, [])

  useEffect(() => {
    if (!open) stopAll()
  }, [open, stopAll])

  /** One exchange. Returns the reply so the loop can decide whether to continue. */
  const exchange = useCallback(
    async (text: string) => {
      setTurns((t) => [...t, { role: 'user', text }])
      setPhase('thinking')
      const history = turnsRef.current.map((x) => ({ role: x.role, text: x.text }))

      let reply
      try {
        reply = await assistant(text, lang, sessionId, history)
      } catch {
        setTurns((t) => [...t, { role: 'assistant', text: L.voiceError }])
        setPhase('idle')
        return null
      }

      setTurns((t) => [...t, { role: 'assistant', text: reply.say }])
      setPhase('speaking')
      // Speak in the language the model actually replied in, not the UI toggle.
      await voice.speak(reply.say, reply.reply_lang)
      setPhase('idle')

      if (reply.action !== 'none') onAction(reply.action, reply.check_text)
      return reply
    },
    [lang, sessionId, onAction, L.voiceError],
  )

  /** Listen -> answer -> listen again, until interrupted or the check is running. */
  const loop = useCallback(async () => {
    while (running.current) {
      setPhase('listening')
      // Real amplitude drives the orb. If the recogniser holds the mic exclusively this
      // returns null and the orb keeps its own motion - never a blocker.
      stopMeter.current = await voice.meter(setLevel)
      setHasLevel(!!stopMeter.current)
      const heard = await voice.listen(sttLang)
      stopMeter.current?.()
      stopMeter.current = null
      setLevel(0)
      if (!running.current) break
      if (!heard) {
        // One miss is normal - background noise, a short pause. Two in a row means it is
        // not working, and asking them to repeat a third time is just nagging.
        misses.current += 1
        if (misses.current >= 2) {
          setTurns((t) => [...t, { role: 'assistant', text: L.notHearing }])
          setPhase('idle')
          running.current = false
          setHandsFree(false)
          break
        }
        continue
      }
      misses.current = 0
      const reply = await exchange(heard)
      if (!running.current) break
      // Once the check is running, the answer is on the main screen, not in here.
      if (reply?.action === 'run_check') {
        running.current = false
        setHandsFree(false)
        setOpen(false)
        break
      }
    }
    setPhase('idle')
  }, [sttLang, exchange, L.notHearing])

  async function tapOrb() {
    if (muted) return
    if (phase === 'speaking' || phase === 'listening') return stopAll()
    if (!(await voice.requestMic())) {
      setHasMic(false)
      setTurns((t) => [...t, { role: 'assistant', text: L.micDenied }])
      return
    }
    misses.current = 0
    running.current = true
    setHandsFree(true)
    loop()
  }

  async function sendTyped() {
    if (!typed.trim()) return
    const text = typed
    setTyped('')
    const reply = await exchange(text)
    if (reply?.action === 'run_check') setOpen(false)
  }

  if (!open)
    return (
      <button className="fab" onClick={() => setOpen(true)} aria-label={L.voiceOpen}>
        <span className="fab-orb orb idle" aria-hidden="true">
          <span className="orb-blob b1" />
          <span className="orb-blob b2" />
          <span className="orb-blob b3" />
          <span className="orb-blob b4" />
        </span>
      </button>
    )

  const last = [...turns].reverse().find((x) => x.role === 'assistant')
  const lastUser = [...turns].reverse().find((x) => x.role === 'user')
  const status =
    muted || !hasMic ? L.muted
    : phase === 'listening' ? L.listening
    : phase === 'thinking' ? L.thinking
    : phase === 'speaking' ? L.speaking
    : handsFree ? L.voiceIdle
    : L.tapToSpeak
  const orbPhase = muted || !hasMic ? 'muted' : phase

  return (
    <div className="vmode" role="dialog" aria-label={L.voiceOpen}>
      <div className="vmode-top">
        <div className="vmode-name">{L.voiceName}</div>
      </div>

      <div className="vmode-stage">
        <div className="vmode-controls">
          <button
            className={`orb ${orbPhase} ${hasLevel ? '' : 'no-level'}`}
            style={{ ['--level' as any]: level.toFixed(3) }}
            onClick={tapOrb}
            aria-label={phase === 'idle' ? L.tapToSpeak : L.stopLabel}
            disabled={phase === 'thinking' || muted || !hasMic}
          >
            <span className="orb-blob b1" />
            <span className="orb-blob b2" />
            <span className="orb-blob b3" />
            <span className="orb-blob b4" />
            <span className="orb-core">
              {orbPhase === 'muted' && <MicOff size={26} />}
              {orbPhase === 'idle' && <Mic size={26} />}
              {orbPhase === 'listening' && (
                <span className="bars">
                  <i /><i /><i /><i /><i />
                </span>
              )}
              {orbPhase === 'thinking' && <span className="orb-spin" />}
              {orbPhase === 'speaking' && (
                <span className="wave">
                  <i /><i /><i /><i /><i /><i /><i />
                </span>
              )}
            </span>
          </button>
        </div>

        <div className="vmode-status" aria-live="polite">{status}</div>

        {(phase === 'speaking' || phase === 'listening') && (
          <button className="stop-btn" onClick={stopAll}>
            {L.stopNow}
          </button>
        )}

        <div className="stt-pick" role="group" aria-label={L.speakIn}>
          <span>{L.speakIn}</span>
          <button className={sttLang === 'hi' ? 'on' : ''} onClick={() => setSttLang('hi')}>
            हिन्दी
          </button>
          <button className={sttLang === 'en' ? 'on' : ''} onClick={() => setSttLang('en')}>
            English
          </button>
        </div>

        <div className="vmode-transcript">
          {lastUser && phase !== 'listening' && <p className="said">&ldquo;{lastUser.text}&rdquo;</p>}
          {last && <p className="reply">{last.text}</p>}
          {turns.length === 0 && (
            <>
              <p className="reply">{L.voiceIntro}</p>
              <div className="chips" style={{ justifyContent: 'center' }}>
                {L.voiceExamples.map((ex) => (
                  <button key={ex} className="chip" onClick={() => exchange(ex)}>
                    {ex}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="vmode-foot">
        <input
          className={keyboard || !hasMic ? '' : 'hidden'}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendTyped()}
          placeholder={L.voicePlaceholder}
          aria-label={L.voicePlaceholder}
        />
        {typed.trim() && (
          <button className="primary" disabled={phase === 'thinking'} onClick={sendTyped}>
            {L.send}
          </button>
        )}
        {!typed.trim() && <div style={{ flex: 1 }} />}

        <button
          className={`side-btn ${keyboard ? 'active' : ''}`}
          onClick={() => setKeyboard((k) => !k)}
          aria-pressed={keyboard}
          aria-label={L.typeInstead}
        >
          <Keyboard size={19} />
        </button>
        <button
          className={`side-btn ${muted ? 'muted' : ''}`}
          onClick={() => {
            setMuted((m) => !m)
            if (!muted) stopAll()
          }}
          aria-pressed={muted}
          aria-label={muted ? L.unmute : L.mute}
          disabled={!hasMic}
        >
          {muted || !hasMic ? <MicOff size={19} /> : <Mic size={19} />}
        </button>
        <button className="side-btn close-btn" onClick={() => setOpen(false)} aria-label="Close">
          <X size={19} />
        </button>
      </div>
    </div>
  )
}
