# Logging guide

All logging goes through `src/lib/logger.js`. Never call `console.log` directly in app code.

## Quick start

    import { createLogger } from '../lib/logger.js'
    const log = createLogger('speech')            // one namespace per feature / file

    log.debug('Voices loaded', { count: 12 })     // details for developers
    log.info('Game started', { rounds: 10 })      // normal milestones
    log.warn('No voice for language', { lang })   // unexpected, but the app keeps working
    log.error('Speech failed', error, { text })   // something is broken

Output looks like: `10:32:11.123 WARN [speech] No voice for language {lang: 'nl-NL'}`

## Levels

| Level   | Use it for                                              | Shown by default in |
|---------|---------------------------------------------------------|---------------------|
| debug   | step-by-step detail (taps, rounds, speech start/end)    | development         |
| info    | milestones (app start, language change, game finished)  | development         |
| warn    | something unexpected that the app survives              | development + production |
| error   | a failure a developer must look at                      | development + production |
| silent  | nothing at all                                          | -                   |

A level shows itself and everything above it (`info` shows info, warn and error).

## Turn logs on and off (no rebuild needed)

| How | Example |
|-----|---------|
| URL (remembered in that browser) | `https://your-site/?log=debug` |
| One feature only | `?log=speech:debug` or `?log=warn,speech:debug,game:info` |
| Silence everything | `?log=silent` |
| Back to the default | `?log=reset` |
| Browser console | `abcLog.setLevel('debug')`, `abcLog.reset()` |

Other console helpers: `abcLog.getLevel()`, `console.table(abcLog.history())` (last 200 entries,
handy to copy into a bug report), `abcLog.clear()`.

Namespaces used today: `app`, `speech`, `data`, `game`, `game.round`, `errors`.
A child such as `game.round` follows `game` unless it has its own setting.

Chrome tip: in DevTools > Console, make sure "Info" and "Warnings" are ticked in the level filter.
Debug logs are printed with `console.log`, so they show without enabling "Verbose".

Change the build-time default in `logger.js` (`DEFAULT_LEVEL`).

## Good practices

1. **One logger per file/feature**, named after it: `createLogger('speech')`.
2. **Message = short fixed sentence, data = second argument.**
   Good: `log.warn('No matching voice', { lang })`. Avoid: `log.warn('No voice for ' + lang)`.
   Fixed messages are searchable and groupable in tools like Sentry.
3. **Pass the Error object itself**: `log.error('Could not load voices', error)` keeps the stack trace.
4. **Never swallow errors.** An empty `catch {}` is a bug. At minimum `log.error(...)` or `log.warn(...)`.
5. **Pick the level by who must act**: nobody -> debug/info, maybe someone -> warn, someone must -> error.
6. **Expected events are not errors.** Speech being replaced by a newer tap is `debug`, not `error`.
7. **No personal data.** This app is for children: never log names, emails, free text typed by a user,
   or anything identifying. Log ids and counts instead.
8. **Do not log in tight loops or on every render.** Log events (a tap, a round), not frames.
9. **Remove noise, keep signal.** If a debug line never helped, delete it.
10. **Events that can fail silently need an explicit hook.** Browser speech reports failures through
    `utterance.onerror`, not exceptions, so a `try/catch` alone sees nothing.

## Sending logs to a service later

    import { setTransport } from './lib/logger.js'
    setTransport((entry) => fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry), keepalive: true }),
                 { minLevel: 'error' })

The transport receives entries at or above `minLevel` (default `warn`), even when the console is silent.
If it throws, the app is not affected. To use Sentry or Datadog, call their SDK inside the function.

## What is already logged

- `app`: start-up, language and mode changes, letters opened (debug)
- `speech`: voices loaded, every utterance start / end / error, stuck-engine detection and retry
- `data`: validation of `alphabet.json` at start-up (missing texts, empty letters, words on the wrong letter)
- `game`, `game.round`: game start and finish, rounds, wrong and right answers
- `errors`: uncaught errors, unhandled promise rejections, and crashed React components
  (the child sees a friendly "Oops" screen instead of a blank page)
