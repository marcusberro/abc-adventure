import { speak } from '../lib/speak.js'

export default function WordCard({ word, emoji, color, speech }) {
  return (
    <button className="word" style={{ background: color }} onClick={() => speak(word, speech)}>
      <span className="e">{emoji}</span>
      <span className="w">
        <b>{word.charAt(0)}</b>
        {word.slice(1)}
      </span>
    </button>
  )
}
