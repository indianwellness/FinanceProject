import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CreditOSProvider, useCreditOS } from './context/CreditOSContext';
import AppHeader from './components/AppHeader';
import Footer from './components/Footer';
import LandingScreen from './screens/LandingScreen';
import ProfileScreen from './screens/ProfileScreen';
import UploadScreen from './screens/UploadScreen';
import ProcessingScreen from './screens/ProcessingScreen';
import DashboardScreen from './screens/DashboardScreen';
import DetailsScreen from './screens/DetailsScreen';
import RecommendationsScreen from './screens/RecommendationsScreen';
import { CheckCircle2 } from 'lucide-react';

// Post-onboarding layout with sticky institutional header and footer
function PostOnboardingLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 selection:bg-blue-100">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

// Global Toast container listening to context
function ToastContainer() {
  const { toastMessage } = useCreditOS();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-[#0F2F57] text-white px-4 py-3 rounded-lg shadow-xl border border-blue-900 text-xs flex items-center gap-2.5 transition-all duration-200">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="font-medium">{toastMessage}</span>
    </div>
  );
}

export default function App() {
  return (
    <CreditOSProvider>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          {/* Public & Guided Onboarding Routes */}
          <Route path="/" element={<LandingScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/upload" element={<UploadScreen />} />
          <Route path="/processing" element={<ProcessingScreen />} />

          {/* Underwriting & Analysis Routes (with AppHeader & Footer) */}
          <Route
            path="/dashboard"
            element={
              <PostOnboardingLayout>
                <DashboardScreen />
              </PostOnboardingLayout>
            }
          />
          <Route
            path="/details"
            element={
              <PostOnboardingLayout>
                <DetailsScreen />
              </PostOnboardingLayout>
            }
          />
          <Route
            path="/recommendations"
            element={
              <PostOnboardingLayout>
                <RecommendationsScreen />
              </PostOnboardingLayout>
            }
          />

          {/* Fallback to Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CreditOSProvider>
  );
}
