/**
 * Tiny, dependency-free logger for the browser.
 *
 *   import { createLogger } from './lib/logger.js'
 *   const log = createLogger('speech')
 *   log.debug('Voices loaded', { count: 12 })
 *   log.error('Something failed', error, { extra: 'context' })
 *
 * Levels (low -> high): debug, info, warn, error, silent
 * Default level: "debug" in development, "warn" in production builds.
 *
 * Change the level at runtime (no rebuild needed):
 *   - URL:      https://your-site/?log=debug          (remembered in this browser)
 *               ?log=info,speech:debug                 (per-namespace levels)
 *               ?log=reset                             (back to the default)
 *   - Console:  abcLog.setLevel('debug')   abcLog.reset()   abcLog.history()
 * See LOGGING.md for the full guide.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 }
const STORAGE_KEY = 'abc:log'
const HISTORY_SIZE = 200
const DEFAULT_LEVEL = import.meta.env?.DEV ? 'debug' : 'warn'

// ── configuration ─────────────────────────────────────────────

let config = { default: DEFAULT_LEVEL, namespaces: {} }
let currentSpec = ''

/** "info,speech:debug" -> { default: 'info', namespaces: { speech: 'debug' } } */
function parseSpec(spec) {
  const parsed = { default: DEFAULT_LEVEL, namespaces: {} }
  String(spec || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const [first, second] = part.split(':')
      if (second === undefined && first in LEVELS) parsed.default = first
      else if (second in LEVELS) parsed.namespaces[first] = second
      else console.warn(`[logger] Ignoring unknown log setting "${part}". Levels: ${Object.keys(LEVELS).join(', ')}`)
    })
  return parsed
}

function storage() {
  try {
    return window.localStorage
  } catch {
    return null // private mode or blocked storage: logging still works, it just isn't remembered
  }
}

function readInitialSpec() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('log')
    if (fromUrl !== null) {
      if (fromUrl === 'reset') storage()?.removeItem(STORAGE_KEY)
      else storage()?.setItem(STORAGE_KEY, fromUrl)
      return fromUrl === 'reset' ? '' : fromUrl
    }
    return storage()?.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

/** Sets the level(s) and remembers them. Example: setLevel('info,speech:debug') */
export function setLevel(spec) {
  currentSpec = String(spec || '')
  config = parseSpec(currentSpec)
  try {
    if (currentSpec) storage()?.setItem(STORAGE_KEY, currentSpec)
    else storage()?.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
  return getLevel()
}

export function getLevel() {
  return { default: config.default, namespaces: { ...config.namespaces }, spec: currentSpec }
}

export const resetLevel = () => setLevel('')

/** A namespace inherits from its parent: "game.round" uses the "game" setting if it has none. */
function levelFor(namespace) {
  for (let n = namespace; n; n = n.includes('.') ? n.slice(0, n.lastIndexOf('.')) : '') {
    if (config.namespaces[n]) return config.namespaces[n]
  }
  return config.default
}

// ── history (last entries, handy for bug reports) ─────────────

const history = []
export const getHistory = () => [...history]
export const clearHistory = () => { history.length = 0 }

// ── transport (optional: send warn/error to a service) ────────

let transport = null
let sending = false

/**
 * Plug in a remote service (Sentry, Datadog, your own endpoint...).
 *   setTransport((entry) => navigator.sendBeacon('/log', JSON.stringify(entry)), { minLevel: 'error' })
 * Runs even when the console level is "silent". A failing transport never breaks the app.
 */
export function setTransport(send, { minLevel = 'warn' } = {}) {
  transport = send ? { send, min: LEVELS[minLevel] ?? LEVELS.warn } : null
}

// ── core ──────────────────────────────────────────────────────

function serialize(value) {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack, cause: value.cause }
  }
  return value
}

function print(entry, details) {
  const time = entry.time.slice(11, 23)
  // console.debug is hidden by Chrome's default filter ("Verbose"), so debug uses console.log.
  const method = entry.level === 'debug' ? 'log' : entry.level
  console[method](`${time} ${entry.level.toUpperCase()} [${entry.ns}]`, entry.message, ...details)
}

function emit(ns, level, message, details) {
  try {
    const value = LEVELS[level]
    const toConsole = value >= LEVELS[levelFor(ns)]
    const toTransport = transport !== null && value >= transport.min
    if (!toConsole && !toTransport) return

    const entry = { time: new Date().toISOString(), level, ns, message, details: details.map(serialize) }

    if (toConsole) {
      history.push(entry)
      if (history.length > HISTORY_SIZE) history.shift()
      print(entry, details)
    }
    if (toTransport && !sending) {
      sending = true
      try { transport.send(entry) } finally { sending = false }
    }
  } catch {
    // Logging must never break the app.
  }
}

export function createLogger(namespace) {
  const make = (level) => (message, ...details) => emit(namespace, level, message, details)
  return {
    debug: make('debug'),
    info: make('info'),
    warn: make('warn'),
    error: make('error'),
    child: (name) => createLogger(`${namespace}.${name}`),
  }
}

// ── global safety nets + console helper ───────────────────────

export function installGlobalHandlers() {
  const log = createLogger('errors')
  window.addEventListener('error', (event) => {
    log.error('Uncaught error', event.error ?? event.message, { file: event.filename, line: event.lineno })
  })
  window.addEventListener('unhandledrejection', (event) => {
    log.error('Unhandled promise rejection', event.reason)
  })
  window.abcLog = {
    setLevel,
    getLevel,
    reset: resetLevel,
    history: getHistory, // try: console.table(abcLog.history())
    clear: clearHistory,
    levels: Object.keys(LEVELS),
  }
}

// Apply the saved / URL level as soon as the module loads.
{
  currentSpec = readInitialSpec()
  config = parseSpec(currentSpec)
}
