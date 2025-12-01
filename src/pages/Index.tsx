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

const SPLASH_SHOWN_KEY = 'moyo_splash_shown';

export default function Index() {
  // Check if splash was already shown in this session
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem(SPLASH_SHOWN_KEY);
  });
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPeriodMode, setIsPeriodMode] = useState(false);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase>('follicular');
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [existingDisplayName, setExistingDisplayName] = useState<string | undefined>();
  
  // Chat state
  const [showChatHistory, setShowChatHistory] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_SHOWN_KEY, 'true');
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
        .select('onboarded, display_name')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking onboarding:', error);
        setNeedsOnboarding(false);
        return;
      }

      // If no profile exists or not onboarded, show onboarding
      if (!data || !data.onboarded) {
        setNeedsOnboarding(true);
        // If profile exists but not onboarded, pre-fill name
        if (data?.display_name) {
          setExistingDisplayName(data.display_name);
        }
      } else {
        setNeedsOnboarding(false);
      }
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
        } else {
          setCheckingOnboarding(false);
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
      } else {
        setCheckingOnboarding(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-2xl text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Show onboarding for new users (after loading is complete)
  if (needsOnboarding) {
    return (
      <Onboarding
        userId={user.id}
        existingName={existingDisplayName}
        onComplete={() => setNeedsOnboarding(false)}
      />
    );
  }

  // Show splash screen only once per session
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
