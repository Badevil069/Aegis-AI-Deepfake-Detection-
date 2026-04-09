import { AnimatePresence } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import DetectPage from './pages/DetectPage';
import LivePage from './pages/LivePage';
import ProcessingPage from './pages/ProcessingPage';
import ResultsPage from './pages/ResultsPage';
import UseCasesPage from './pages/UseCasesPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';

const chromeHiddenRoutes = ['/processing'];

export default function App() {
  const location = useLocation();
  const hideChrome = chromeHiddenRoutes.includes(location.pathname);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-app-bg text-slate-100">
      <div className="app-stars" />
      <div className="app-gradient-orb app-gradient-orb-left" />
      <div className="app-gradient-orb app-gradient-orb-right" />

      <div className="relative z-10">
        {!hideChrome && <Navbar />}

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/detect" element={<DetectPage />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/processing" element={<ProcessingPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/use-cases" element={<UseCasesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>

        {!hideChrome && <Footer />}
      </div>
    </div>
  );
}
