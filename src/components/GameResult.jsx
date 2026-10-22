export default function GameResult({ lang, score, total, onAgain, onExit }) {
  const line = lang.ui.score.replace('{n}', score).replace('{total}', total)
  return (
    <section className="result">
      <p className="trophy">🏆</p>
      <h2>{lang.ui.wellDone}</h2>
      <p className="stars" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < score ? 'on' : 'off'}>⭐</span>
        ))}
      </p>
      <p className="score">{line}</p>
      <div className="result-buttons">
        <button className="btn" onClick={onAgain}>🔁 {lang.ui.playAgain}</button>
        <button className="btn alt" onClick={onExit}>🔤 {lang.ui.backToAlphabet}</button>
      </div>
    </section>
  )
}
