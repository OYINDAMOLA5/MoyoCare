import { MessageCircle, Wind, Sparkles, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface HomeDashboardProps {
  onNavigateToChat: () => void;
  onOpenBreathing: () => void;
  isPeriodMode: boolean;
  onTogglePeriodMode: (checked: boolean) => void;
}

const wisdomTips = [
  { title: 'Exam Prep', text: 'Break study into small chunks, sis', icon: '📚' },
  { title: 'Safety Tip', text: 'Always let someone know where you are', icon: '🛡️' },
  { title: 'Self Love', text: 'You are enough, exactly as you are', icon: '💜' },
  { title: 'Rest Well', text: 'Sleep na medicine, make you rest well', icon: '😴' },
  { title: 'Stay Hydrated', text: 'Water na life, drink am well', icon: '💧' },
];

export default function HomeDashboard({
  onNavigateToChat,
  onOpenBreathing,
  isPeriodMode,
  onTogglePeriodMode,
}: HomeDashboardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      {/* Header */}
      <header 
        className={`sticky top-0 z-10 transition-colors duration-300 ${
          isPeriodMode 
            ? 'bg-gradient-to-r from-accent/30 to-accent/20' 
            : 'bg-card'
        } border-b border-border shadow-sm`}
      >
        <div className="max-w-4xl mx-auto p-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {getGreeting()}, Sis 👋
            </h1>
            <p className="text-sm text-muted-foreground">How are you feeling today?</p>
          </div>
        </div>

        {/* Cycle Context Toggle */}
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <Card className={`p-4 transition-all duration-300 ${
            isPeriodMode ? 'bg-accent/20 border-accent/40' : ''
          }`}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="cycle-toggle" className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${isPeriodMode ? 'text-accent' : 'text-muted-foreground'}`} />
                  Cycle Context
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isPeriodMode ? 'Menstrual Phase Active' : 'Follicular Phase'}
                </p>
              </div>
              <Switch
                id="cycle-toggle"
                checked={isPeriodMode}
                onCheckedChange={onTogglePeriodMode}
              />
            </div>
          </Card>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <Card 
              className="p-4 md:p-6 cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-primary to-primary/80 text-white active:scale-95"
              onClick={onNavigateToChat}
            >
              <MessageCircle className="w-8 h-8 md:w-10 md:h-10 mb-2 md:mb-3" />
              <h3 className="font-bold text-base md:text-lg">Chat with Moyo</h3>
              <p className="text-xs md:text-sm text-white/90 mt-1">I'm here to listen</p>
            </Card>

            <Card 
              className="p-4 md:p-6 cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-secondary to-secondary/80 text-white active:scale-95"
              onClick={onOpenBreathing}
            >
              <Wind className="w-8 h-8 md:w-10 md:h-10 mb-2 md:mb-3" />
              <h3 className="font-bold text-base md:text-lg">Quick Breathe</h3>
              <p className="text-xs md:text-sm text-white/90 mt-1">Calm your mind</p>
            </Card>
          </div>
        </section>

        {/* Daily Wisdom */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Daily Wisdom</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {wisdomTips.map((tip, index) => (
              <Card 
                key={index}
                className="flex-shrink-0 w-56 md:w-64 p-4 cursor-pointer hover:shadow-lg transition-all active:scale-95"
              >
                <div className="text-3xl mb-2">{tip.icon}</div>
                <h3 className="font-semibold text-foreground mb-1">{tip.title}</h3>
                <p className="text-sm text-muted-foreground">{tip.text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Info Banner */}
        <Card className="p-4 bg-muted/50 border-border">
          <p className="text-sm text-muted-foreground text-center">
            <strong>MoyoCare-Her:</strong> Your safe space for mental and menstrual wellness. 
            I'm here for you, sis. 💜
          </p>
        </Card>
      </main>
    </div>
  );
}
