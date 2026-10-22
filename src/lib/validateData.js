import { createLogger } from './logger.js'

const log = createLogger('data')
const LANGUAGE_FIELDS = ['name', 'flag', 'speech', 'ui', 'words']
// "Árvore" should count as starting with "A"
const plain = (text) => text.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()
const UI_KEYS = [
  'title', 'tap', 'examples', 'prev', 'next', 'play', 'learn', 'findLetter',
  'great', 'listen', 'playAgain', 'backToAlphabet', 'wellDone', 'score',
]

/** Checks alphabet.json after hand edits and reports problems in the console. */
export function validateData(data) {
  const languages = data?.languages
  if (!languages || typeof languages !== 'object') {
    log.error('alphabet.json has no "languages" object')
    return false
  }
  let ok = true
  for (const [key, lang] of Object.entries(languages)) {
    for (const field of LANGUAGE_FIELDS) {
      if (!lang?.[field]) { log.error(`Language "${key}" is missing "${field}"`); ok = false }
    }
    for (const k of UI_KEYS) {
      if (!lang?.ui?.[k]) log.warn(`Language "${key}" is missing the text ui.${k}`)
    }
    for (const [letter, list] of Object.entries(lang?.words ?? {})) {
      if (!Array.isArray(list) || list.length === 0) {
        log.warn(`Language "${key}", letter "${letter}" has no words`)
        continue
      }
      list.forEach((entry, i) => {
        if (!Array.isArray(entry) || !entry[0] || !entry[1]) {
          log.warn(`Language "${key}", letter "${letter}", word #${i + 1} must look like ["Word", "emoji"]`, entry)
        } else if (!plain(entry[0]).startsWith(plain(letter))) {
          log.warn(`Language "${key}": "${entry[0]}" does not start with "${letter}"`)
        }
      })
    }
  }
  log.info('Data checked', { languages: Object.keys(languages), ok })
  return ok
}
