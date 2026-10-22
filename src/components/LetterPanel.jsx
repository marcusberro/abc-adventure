import { useEffect } from 'react'
import WordCard from './WordCard.jsx'
import { TILE_COLORS, CARD_COLORS } from '../lib/colors.js'
import { speak } from '../lib/speak.js'

export default function LetterPanel({ lang, letters, letter, onSelect, onClose }) {
  const index = letters.indexOf(letter)
  const words = lang.words[letter] || []
  const go = (d) => onSelect(letters[(index + d + letters.length) % letters.length])

  // Keyboard: Esc closes, arrows move between letters.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="btn close" aria-label="Close" onClick={onClose}>✕</button>

        <button
          className="big"
          style={{ color: TILE_COLORS[index % TILE_COLORS.length] }}
          onClick={() => speak(letter, lang.speech)}
        >
          {letter}{letter.toLowerCase()}
        </button>

        <h2>{lang.ui.examples} {letter} 👇</h2>

        <div className="words">
          {words.map(([word, emoji], k) => (
            <WordCard
              key={word}
              word={word}
              emoji={emoji}
              speech={lang.speech}
              color={CARD_COLORS[(index + k) % CARD_COLORS.length]}
            />
          ))}
        </div>

        <div className="nav">
          <button className="btn" onClick={() => go(-1)}>◀ {lang.ui.prev}</button>
          <button className="btn" onClick={() => go(1)}>{lang.ui.next} ▶</button>
        </div>
      </div>
    </div>
  )
}
