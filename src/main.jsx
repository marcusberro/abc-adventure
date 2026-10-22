import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import data from './data/alphabet.json'
import { createLogger, installGlobalHandlers } from './lib/logger.js'
import { validateData } from './lib/validateData.js'
import './styles/app.css'

installGlobalHandlers()
const log = createLogger('app')
log.info('App starting', { mode: import.meta.env.MODE, userAgent: navigator.userAgent })
validateData(data)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
