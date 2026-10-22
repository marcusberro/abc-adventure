import { createLogger } from './logger.js'

const log = createLogger('speech')

const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
export const isSpeechSupported = Boolean(synth) && typeof SpeechSynthesisUtterance !== 'undefined'

const START_TIMEOUT_MS = 2000 // if speech has not started by then, the engine is probably stuck
const ERROR_HINTS = {
  'not-allowed': 'The browser blocked speech (it needs a tap or click on the page first).',
  'audio-busy': 'The audio output is busy.',
  'audio-hardware': 'No audio output available.',
  'synthesis-failed': 'The speech engine failed.',
  'synthesis-unavailable': 'No speech engine available.',
  'voice-unavailable': 'The chosen voice is not available.',
  'language-unavailable': 'No voice for this language is installed.',
  'text-too-long': 'The text is too long.',
  network: 'A network voice could not be reached.',
}

// ── voices (Chrome loads them asynchronously) ─────────────────

let voices = []

function loadVoices() {
  try {
    voices = synth.getVoices()
    log.debug('Voices loaded', { count: voices.length })
  } catch (error) {
    log.error('Could not load voices', error)
  }
}

if (isSpeechSupported) {
  loadVoices()
  synth.addEventListener?.('voiceschanged', loadVoices)
} else {
  log.warn('Speech synthesis is not supported in this browser')
}

function pickVoice(lang) {
  const wanted = lang.toLowerCase()
  const base = wanted.split('-')[0]
  const norm = (v) => v.lang.toLowerCase().replace('_', '-') // Android uses pt_PT
  return voices.find((v) => norm(v) === wanted) || voices.find((v) => norm(v).startsWith(base)) || null
}

// ── speaking ──────────────────────────────────────────────────

// Keep a reference while speaking: Chrome can garbage-collect a playing utterance and silently stop the sound.
let current = null
let requestId = 0

export function speak(text, lang, { retry = true } = {}) {
  if (!isSpeechSupported) return
  const id = ++requestId
  try {
    const busy = synth.speaking || synth.pending
    if (busy) synth.cancel()
    // Chrome can drop a speak() issued in the same tick as cancel(), so wait a moment.
    // If the user taps again meanwhile, only the latest request is spoken.
    setTimeout(() => {
      if (id === requestId) start(text, lang, retry)
    }, busy ? 60 : 0)
  } catch (error) {
    log.error('speak() failed before starting', error, { text, lang })
  }
}

function start(text, lang, retry) {
  try {
    if (synth.paused) {
      log.warn('Speech engine was paused; resuming it')
      synth.resume()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.85
    const voice = pickVoice(lang)
    if (voice) utterance.voice = voice
    else log.warn('No matching voice; the browser default will be used', { lang, voicesAvailable: voices.length })

    let started = false
    const watchdog = setTimeout(() => {
      if (started || current !== utterance) return
      log.warn('Speech did not start in time (the browser speech engine may be stuck)', { text, lang, willRetry: retry })
      current = null
      synth.cancel()
      if (retry) speak(text, lang, { retry: false })
      else log.error('Speech failed to start, even after a retry', { text, lang, speaking: synth.speaking, paused: synth.paused })
    }, START_TIMEOUT_MS)

    utterance.onstart = () => {
      started = true
      clearTimeout(watchdog)
      log.debug('Speech started', { text, lang, voice: voice?.name })
    }
    utterance.onend = () => {
      clearTimeout(watchdog)
      log.debug('Speech ended', { text })
      if (current === utterance) current = null
    }
    // Speech failures are reported through this event. They are NOT thrown, so try/catch never sees them.
    utterance.onerror = (event) => {
      clearTimeout(watchdog)
      // "interrupted" / "canceled" are normal: a newer speak() replaced this one.
      const expected = event.error === 'interrupted' || event.error === 'canceled'
      if (expected) log.debug('Speech replaced by a newer request', { text, reason: event.error })
      else log.error('Speech error', { text, lang, reason: event.error, hint: ERROR_HINTS[event.error] })
      if (current === utterance) current = null
    }

    current = utterance
    log.debug('Speaking', { text, lang, voice: voice?.name ?? 'default' })
    synth.speak(utterance)
  } catch (error) {
    log.error('speak() threw an exception', error, { text, lang })
  }
}
