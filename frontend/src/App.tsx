import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Navbar } from './components/shared/Navbar'
import { ChatWidget } from './components/shared/ChatWidget'
import { QueryProvider } from './providers/QueryProvider'
import { Home } from './pages/Home'
import { DiseaseDetection } from './pages/DiseaseDetection'
import { TreatmentRecommendation } from './pages/TreatmentRecommendation'
import { CropAdvisory } from './pages/CropAdvisory'
import { WeatherAdvisory } from './pages/WeatherAdvisory'
import { MarketIntelligence } from './pages/MarketIntelligence'
import { AIAssistant } from './pages/AIAssistant'

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/disease"   element={<DiseaseDetection />} />
            <Route path="/treatment" element={<TreatmentRecommendation />} />
            <Route path="/crop"      element={<CropAdvisory />} />
            <Route path="/weather"   element={<WeatherAdvisory />} />
            <Route path="/market"    element={<MarketIntelligence />} />
            <Route path="/assistant" element={<AIAssistant />} />
          </Routes>
        </AnimatePresence>
        <ChatWidget />
      </BrowserRouter>
    </QueryProvider>
  )
}

export default App
