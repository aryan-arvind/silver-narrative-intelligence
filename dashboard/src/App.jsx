import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ExplainPanel } from './components/ExplainPanel';
import { OverviewView } from './views/OverviewView';
import { WarRoomView } from './views/WarRoomView';
import { NarrativesView } from './views/NarrativesView';
import { TimelineView } from './views/TimelineView';
import { SignalsView } from './views/SignalsView';
import { NoiseView } from './views/NoiseView';
import { useNarratives } from './hooks/useNarratives';
import './index.css';

function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const [demoMode, setDemoMode] = useState(true);
  const [selectedNarrative, setSelectedNarrative] = useState(null);
  const [explainPanelOpen, setExplainPanelOpen] = useState(false);

  const {
    narratives,
    metadata,
    loading,
    error,
    lastUpdated,
    refresh
  } = useNarratives(demoMode);

  const handleNarrativeClick = (narrative) => {
    setSelectedNarrative(narrative);
    setExplainPanelOpen(true);
  };

  const closeExplainPanel = () => {
    setExplainPanelOpen(false);
    setTimeout(() => setSelectedNarrative(null), 300);
  };

  const renderView = () => {
    const props = {
      narratives,
      metadata,
      onNarrativeClick: handleNarrativeClick,
    };

    switch (activeSection) {
      case 'overview':
        return <OverviewView {...props} />;
      case 'warroom':
        return <WarRoomView {...props} />;
      case 'narratives':
        return <NarrativesView {...props} />;
      case 'timeline':
        return <TimelineView {...props} />;
      case 'signals':
        return <SignalsView {...props} />;
      case 'noise':
        return <NoiseView {...props} />;
      default:
        return <OverviewView {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex">
      {/* Sidebar - Fixed Left */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content Area - Takes remaining space */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <TopBar
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          loading={loading}
          demoMode={demoMode}
          onDemoModeToggle={() => setDemoMode(!demoMode)}
          metadata={metadata}
        />

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          {/* Loading State */}
          {loading && narratives.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                <span className="text-gray-400">Loading intelligence...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
            >
              Failed to load data: {error}. Using demo data.
            </motion.div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {narratives.length > 0 && renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Explain Panel */}
      <ExplainPanel
        narrative={selectedNarrative}
        isOpen={explainPanelOpen}
        onClose={closeExplainPanel}
      />

      {/* Background Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

export default App;
