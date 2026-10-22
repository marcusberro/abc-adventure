import { useEffect, useState } from 'react'
import { TILE_COLORS } from '../lib/colors.js'
import { speak } from '../lib/speak.js'
import { createLogger } from '../lib/logger.js'

const log = createLogger('game.round')

export default function GameRound({ round, lang, onDone }) {
  const [wrong, setWrong] = useState([])
  const [solved, setSolved] = useState(false)
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Say the letter when the round starts.
  useEffect(() => {
    log.debug('Round started', { target: round.target, options: round.options })
    speak(round.target, lang.speech)
  }, [round, lang])

  // After a right answer, wait a moment, then go to the next round.
  useEffect(() => {
    if (!solved) return
    const timer = setTimeout(() => onDone(wrong.length === 0), 1400)
    return () => clearTimeout(timer)
  }, [solved])

  function choose(letter) {
    if (solved || wrong.includes(letter)) return
    if (letter === round.target) {
      log.debug('Round solved', { target: round.target, misses: wrong.length })
      setSolved(true)
      speak(lang.ui.great, lang.speech)
    } else {
      log.debug('Wrong answer', { target: round.target, chosen: letter })
      setWrong((w) => [...w, letter])
    }
  }

  return (
    <section className="round">
      <div className="prompt">
        <button className="btn speaker" aria-label={lang.ui.listen} onClick={() => speak(round.target, lang.speech)}>
          🔊
        </button>
        <p>
          {lang.ui.findLetter}
          {/* Without speech support, show the letter so the game still works. */}
          {!canSpeak && <strong className="fallback"> {round.target}</strong>}
        </p>
      </div>

      <div className="choices">
        {round.options.map((letter, i) => {
          const isTarget = letter === round.target
          const classes = ['tile', 'choice']
          if (wrong.includes(letter)) classes.push('miss')
          if (solved && isTarget) classes.push('win')
          if (!solved && isTarget && wrong.length >= 2) classes.push('hint')
          return (
            <button
              key={letter}
              className={classes.join(' ')}
              style={{ background: TILE_COLORS[(round.target.charCodeAt(0) + i * 3) % TILE_COLORS.length] }}
              disabled={wrong.includes(letter)}
              onClick={() => choose(letter)}
            >
              {letter}
              <small>{letter.toLowerCase()}</small>
            </button>
          )
        })}
      </div>

      <p className="cheer" aria-live="polite">{solved ? `⭐ ${lang.ui.great}` : '\u00a0'}</p>
    </section>
  )
}
