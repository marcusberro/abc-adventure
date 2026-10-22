import { TILE_COLORS } from '../lib/colors.js'

export default function LetterGrid({ letters, onSelect }) {
  return (
    <main className="grid">
      {letters.map((c, i) => (
        <button
          key={c}
          className="tile"
          style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}
          onClick={() => onSelect(c)}
        >
          {c}
          <small>{c.toLowerCase()}</small>
        </button>
      ))}
    </main>
  )
}
