import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import SplashScreen from '../components/SplashScreen';
import HomeDashboard from '../components/HomeDashboard';
import ChatInterface from '../components/ChatInterface';
import ChatHistory from '../components/ChatHistory';
import BreathingTool from '../components/BreathingTool';
import BottomNav, { NavTab } from '../components/BottomNav';
import Journal from '../components/Journal';
import Profile from '../components/Profile';
import Onboarding from '../components/Onboarding';
import Auth from './Auth';
import DesktopNav from '../components/DesktopNav';
import { CyclePhase } from '@/utils/contextAwareness';

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPeriodMode, setIsPeriodMode] = useState(false);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase>('follicular');
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  
  // Chat state
  const [showChatHistory, setShowChatHistory] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleNavigateToChat = () => {
    setShowChatHistory(true);
    setSelectedConversationId(null);
    setActiveTab('chat');
  };

  const handleBackToHome = () => {
    setActiveTab('home');
    setShowChatHistory(true);
    setSelectedConversationId(null);
  };

  const handleSelectConversation = (conversationId: string | null) => {
    setSelectedConversationId(conversationId);
    setShowChatHistory(false);
  };

  const handleBackToChatHistory = () => {
    setShowChatHistory(true);
    setSelectedConversationId(null);
  };

  const handleConversationCreated = (id: string) => {
    setSelectedConversationId(id);
  };

  const handleTogglePeriodMode = (checked: boolean) => {
    setIsPeriodMode(checked);
    if (checked && cyclePhase === 'follicular') {
      setCyclePhase('menstrual');
    }
  };

  const checkOnboardingStatus = async (userId: string) => {
    setCheckingOnboarding(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking onboarding:', error);
        setNeedsOnboarding(false);
        return;
      }

      // If no profile exists or not onboarded, show onboarding
      setNeedsOnboarding(!data || !data.onboarded);
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setNeedsOnboarding(false);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  // Reset chat state when tab changes away from chat
  useEffect(() => {
    if (activeTab !== 'chat') {
      setShowChatHistory(true);
      setSelectedConversationId(null);
    }
  }, [activeTab]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check onboarding status after auth state changes
        if (session?.user) {
          setTimeout(() => {
            checkOnboardingStatus(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkOnboardingStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-2xl text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Show onboarding for new users
  if (needsOnboarding && !checkingOnboarding) {
    return (
      <Onboarding
        userId={user.id}
        onComplete={() => setNeedsOnboarding(false)}
      />
    );
  }

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeDashboard
            onNavigateToChat={handleNavigateToChat}
            onOpenBreathing={() => setIsBreathingOpen(true)}
            isPeriodMode={isPeriodMode}
            onTogglePeriodMode={handleTogglePeriodMode}
          />
        );
      case 'chat':
        if (showChatHistory) {
          return (
            <ChatHistory
              onSelectConversation={handleSelectConversation}
              onBack={handleBackToHome}
            />
          );
        }
        return (
          <ChatInterface
            onBack={handleBackToChatHistory}
            isPeriodMode={isPeriodMode}
            cyclePhase={cyclePhase}
            conversationId={selectedConversationId}
            onConversationCreated={handleConversationCreated}
          />
        );
      case 'journal':
        return <Journal />;
      case 'profile':
        return <Profile />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Desktop Navigation */}
      <DesktopNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content - offset for desktop nav */}
      <div className="md:ml-20 lg:ml-64 pb-16 md:pb-0">
        {renderContent()}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <BreathingTool
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
      />
    </div>
  );
}
