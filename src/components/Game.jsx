import { useEffect, useMemo, useState } from 'react'
import GameRound from './GameRound.jsx'
import GameResult from './GameResult.jsx'
import { buildRounds } from '../lib/game.js'
import { createLogger } from '../lib/logger.js'

const log = createLogger('game')

const ROUNDS = 10

export default function Game({ lang, onExit }) {
  const letters = Object.keys(lang.words)
  const [session, setSession] = useState(0) // changes on "play again"
  const rounds = useMemo(() => buildRounds(letters, { rounds: ROUNDS, choices: 3 }), [lang, session])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)

  useEffect(() => {
    log.info('Game started', { rounds: rounds.length, letters: letters.length })
  }, [rounds])

  function finishRound(firstTry) {
    if (firstTry) setScore((s) => s + 1)
    if (index + 1 === rounds.length) {
      log.info('Game finished', { score: score + (firstTry ? 1 : 0), total: rounds.length })
    }
    setIndex((i) => i + 1)
  }

  function playAgain() {
    setSession((s) => s + 1)
    setIndex(0)
    setScore(0)
  }

  if (index >= rounds.length) {
    return <GameResult lang={lang} score={score} total={rounds.length} onAgain={playAgain} onExit={onExit} />
  }

  return (
    <main className="game">
      <p className="progress">{index + 1} / {rounds.length}</p>
      <GameRound key={`${session}-${index}`} round={rounds[index]} lang={lang} onDone={finishRound} />
    </main>
  )
}
