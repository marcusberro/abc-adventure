import { useEffect, useState } from 'react'
import data from './data/alphabet.json'
import LanguagePicker from './components/LanguagePicker.jsx'
import LetterGrid from './components/LetterGrid.jsx'
import LetterPanel from './components/LetterPanel.jsx'
import Game from './components/Game.jsx'
import { speak } from './lib/speak.js'
import { createLogger } from './lib/logger.js'

const log = createLogger('app')

const languages = data.languages
const languageKeys = Object.keys(languages)

export default function App() {
  const [langKey, setLangKey] = useState(languageKeys[0])
  const [letter, setLetter] = useState(null)
  const [mode, setMode] = useState('learn') // 'learn' or 'play'

  const lang = languages[langKey]
  const letters = Object.keys(lang.words)
  const playing = mode === 'play'

  useEffect(() => {
    document.title = lang.ui.title
    document.documentElement.lang = langKey
  }, [lang, langKey])

  function openLetter(next) {
    log.debug('Letter opened', { letter: next, language: langKey })
    setLetter(next)
    speak(next, lang.speech)
  }

  function changeLanguage(key) {
    log.info('Language changed', { from: langKey, to: key })
    setLangKey(key)
    setLetter(null)
  }

  return (
    <>
      <header>
        <h1>
          {lang.ui.title.split(' ').map((word, i) => (
            <span key={i}>{word} </span>
          ))}
        </h1>
        {!playing && <p className="sub">{lang.ui.tap}</p>}
        <LanguagePicker languages={languages} current={langKey} onChange={changeLanguage} />
        <button className="btn mode" onClick={() => {
            const next = playing ? 'learn' : 'play'
            log.info('Mode changed', { mode: next })
            setMode(next)
          }}>
          {playing ? `🔤 ${lang.ui.learn}` : `🎮 ${lang.ui.play}`}
        </button>
      </header>

      {playing ? (
        <Game key={langKey} lang={lang} onExit={() => setMode('learn')} />
      ) : (
        <>
          <LetterGrid letters={letters} onSelect={openLetter} />
          {letter && (
            <LetterPanel
              lang={lang}
              letters={letters}
              letter={letter}
              onSelect={openLetter}
              onClose={() => setLetter(null)}
            />
          )}
        </>
      )}
    </>
  )
}
