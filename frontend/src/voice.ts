/**
 * Speech in and out, with one interface over two very different runtimes.
 *
 * In the APK we use the native Android engines through Capacitor - the system WebView
 * cannot be relied on for speech recognition. In a browser we fall back to the Web
 * Speech API. Either can be unavailable, so every call reports failure rather than
 * throwing: the assistant must still work by typing.
 */

import { Capacitor } from '@capacitor/core'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'
import { TextToSpeech } from '@capacitor-community/text-to-speech'

const native = Capacitor.isNativePlatform()
const BCP = { hi: 'hi-IN', en: 'en-IN' } as const
export type VLang = keyof typeof BCP

// ---------- speaking ----------

let webVoices: SpeechSynthesisVoice[] = []
if (!native && typeof speechSynthesis !== 'undefined') {
  const load = () => (webVoices = speechSynthesis.getVoices())
  load()
  speechSynthesis.onvoiceschanged = load
}

export async function speak(text: string, lang: VLang): Promise<void> {
  if (!text) return
  try {
    if (native) {
      await TextToSpeech.stop().catch(() => {})
      await TextToSpeech.speak({ text, lang: BCP[lang], rate: 1.0, pitch: 1.0, category: 'ambient' })
      return
    }
    if (typeof speechSynthesis === 'undefined') return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = BCP[lang]
    const v = webVoices.find((x) => x.lang === BCP[lang]) ?? webVoices.find((x) => x.lang.startsWith(lang))
    if (v) u.voice = v
    // Resolve only when it has finished, so the caller can listen again straight after.
    await new Promise<void>((done) => {
      u.onend = () => done()
      u.onerror = () => done()
      speechSynthesis.speak(u)
    })
  } catch {
    /* a silent guide is still a working guide */
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    if (native) await TextToSpeech.stop()
    else speechSynthesis?.cancel()
  } catch {
    /* nothing to stop */
  }
}

// ---------- listening ----------

export async function micAvailable(): Promise<boolean> {
  try {
    if (native) return (await SpeechRecognition.available()).available
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  } catch {
    return false
  }
}

export async function requestMic(): Promise<boolean> {
  try {
    if (!native) return true // the browser prompts on first use
    const p = await SpeechRecognition.requestPermissions()
    return p.speechRecognition === 'granted'
  } catch {
    return false
  }
}

/** Resolves with the transcript, or null if nothing usable was heard. */
export async function listen(lang: VLang): Promise<string | null> {
  await stopSpeaking() // never record our own voice

  if (native) {
    try {
      const r = await SpeechRecognition.start({
        language: BCP[lang],
        maxResults: 1,
        partialResults: false,
        popup: false,
      })
      return r?.matches?.[0]?.trim() || null
    } catch {
      return null
    }
  }

  const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
  if (!Ctor) return null
  return new Promise((resolve) => {
    const rec = new Ctor()
    rec.lang = BCP[lang]
    rec.interimResults = false
    rec.maxAlternatives = 1
    let done = false
    const finish = (v: string | null) => {
      if (done) return
      done = true
      resolve(v)
    }
    rec.onresult = (e: any) => finish(String(e.results[0][0].transcript).trim() || null)
    rec.onerror = () => finish(null)
    rec.onend = () => finish(null)
    rec.start()
  })
}

export async function stopListening(): Promise<void> {
  try {
    if (native) await SpeechRecognition.stop()
  } catch {
    /* already stopped */
  }
}

// ---------- live input level ----------

/**
 * Real microphone amplitude, so the orb reacts to the actual voice instead of
 * looping a canned animation.
 *
 * The native recogniser may hold the mic exclusively on some devices; if
 * getUserMedia is refused we return null and the caller keeps its idle motion.
 * Returns a stop function.
 */
export async function meter(onLevel: (v: number) => void): Promise<(() => void) | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const Ctx = (window as any).AudioContext ?? (window as any).webkitAudioContext
    const ctx: AudioContext = new Ctx()
    const src = ctx.createMediaStreamSource(stream)
    const node = ctx.createAnalyser()
    node.fftSize = 512
    node.smoothingTimeConstant = 0.75
    src.connect(node)

    const buf = new Uint8Array(node.frequencyBinCount)
    let raf = 0
    let alive = true

    const tick = () => {
      if (!alive) return
      node.getByteFrequencyData(buf)
      // Speech energy sits low in the spectrum; averaging the whole range washes it out.
      let sum = 0
      const n = Math.floor(buf.length * 0.4)
      for (let i = 0; i < n; i++) sum += buf[i]
      const avg = sum / n / 255
      onLevel(Math.min(1, avg * 2.6)) // scale so normal speech reaches most of the range
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      stream.getTracks().forEach((t) => t.stop())
      ctx.close().catch(() => {})
      onLevel(0)
    }
  } catch {
    return null
  }
}
