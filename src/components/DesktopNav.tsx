import { Home, MessageCircle, BookOpen, User, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { NavTab } from './BottomNav';

interface DesktopNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const navItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function DesktopNav({ activeTab, onTabChange }: DesktopNavProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-20 lg:w-64 bg-card border-r border-border flex-col z-50">
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-border">
        <h1 className="text-xl lg:text-2xl font-bold text-primary hidden lg:block">
          Moyo
        </h1>
        <div className="lg:hidden flex justify-center">
          <span className="text-2xl font-bold text-primary">M</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 mx-auto lg:mx-0" />
              <span className="hidden lg:block font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-center lg:justify-start gap-3"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-5 h-5" />
              <span className="hidden lg:block">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              <span className="hidden lg:block">Dark Mode</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
