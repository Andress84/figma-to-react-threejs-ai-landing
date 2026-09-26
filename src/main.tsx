import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/poppins/latin-400.css'
import '@fontsource/poppins/latin-600.css'
import 'lenis/dist/lenis.css'

import App from './App'
import { PerformanceMonitor } from './components/performance/PerformanceMonitor'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PerformanceMonitor />
        <App />
    </StrictMode>,
)
