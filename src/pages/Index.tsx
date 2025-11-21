import { useState } from 'react';
import SplashScreen from '../components/SplashScreen';
import HomeDashboard from '../components/HomeDashboard';
import ChatInterface from '../components/ChatInterface';
import BreathingTool from '../components/BreathingTool';
import { CyclePhase } from '@/utils/contextAwareness';

type View = 'splash' | 'home' | 'chat';

export default function Index() {
  const [currentView, setCurrentView] = useState<View>('splash');
  const [isPeriodMode, setIsPeriodMode] = useState(false);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase>('follicular');
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);

  const handleSplashComplete = () => {
    setCurrentView('home');
  };

  const handleNavigateToChat = () => {
    setCurrentView('chat');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  const handleTogglePeriodMode = (checked: boolean) => {
    setIsPeriodMode(checked);
    if (checked && cyclePhase === 'follicular') {
      setCyclePhase('menstrual');
    }
  };

  return (
    <>
      {currentView === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      
      {currentView === 'home' && (
        <HomeDashboard
          onNavigateToChat={handleNavigateToChat}
          onOpenBreathing={() => setIsBreathingOpen(true)}
          isPeriodMode={isPeriodMode}
          onTogglePeriodMode={handleTogglePeriodMode}
        />
      )}
      
      {currentView === 'chat' && (
        <ChatInterface
          onBack={handleBackToHome}
          isPeriodMode={isPeriodMode}
          cyclePhase={cyclePhase}
        />
      )}

      <BreathingTool
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
      />
    </>
  );
}
