import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Navbar } from './components/shared/Navbar'
import { ChatWidget } from './components/shared/ChatWidget'
import { QueryProvider } from './providers/QueryProvider'
import { AuthProvider } from './context/AuthContext.tsx'
import { AuthModal } from './components/AuthModal'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Home } from './pages/Home'
import { LoginPage } from './pages/LoginPage'
import { DiseaseDetection } from './pages/DiseaseDetection'
import { TreatmentRecommendation } from './pages/TreatmentRecommendation'
import { CropAdvisory } from './pages/CropAdvisory'
import { WeatherAdvisory } from './pages/WeatherAdvisory'
import { MarketIntelligence } from './pages/MarketIntelligence'
import { AIAssistant } from './pages/AIAssistant'
import { GovernmentAdvisory } from './pages/GovernmentAdvisory'
import { EquipmentSharing } from './pages/EquipmentSharing'

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AuthModal />
        <BrowserRouter>
          <Routes>
            {/* Login page: full screen, no navbar */}
            <Route path="/login" element={<LoginPage />} />

            {/* All other pages: with Navbar */}
            <Route path="/*" element={
              <>
                <Navbar />
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route
                      path="/disease"
                      element={
                        <ProtectedRoute>
                          <DiseaseDetection />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/treatment"
                      element={
                        <ProtectedRoute>
                          <TreatmentRecommendation />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crop"
                      element={
                        <ProtectedRoute>
                          <CropAdvisory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/weather"
                      element={
                        <ProtectedRoute>
                          <WeatherAdvisory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/market"
                      element={
                        <ProtectedRoute>
                          <MarketIntelligence />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assistant"
                      element={
                        <ProtectedRoute>
                          <AIAssistant />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/government"
                      element={
                        <ProtectedRoute>
                          <GovernmentAdvisory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/equipment-sharing"
                      element={
                        <ProtectedRoute>
                          <EquipmentSharing />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/equipment"
                      element={
                        <ProtectedRoute>
                          <EquipmentSharing />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </AnimatePresence>
                <ChatWidget />
              </>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  )
}

export default App
