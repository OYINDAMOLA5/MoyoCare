import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Brain, Shield, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingProps {
  userId: string;
  existingName?: string;
  onComplete: () => void;
}

const slides = [
  {
    icon: Heart,
    title: 'Welcome to Moyo',
    description: 'Your safe space for mental and menstrual wellness. I\'m here to support you, sis.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Brain,
    title: 'Talk to Moyo',
    description: 'Share your thoughts, worries, or just chat. I\'m trained to listen and support you with care.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    icon: Shield,
    title: 'Safe & Private',
    description: 'Your conversations are private. I\'m here to help, not judge. Your wellness is my priority.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
];

const languages = [
  { value: 'English', label: 'English' },
  { value: 'Nigerian Pidgin', label: 'Nigerian Pidgin' },
  { value: 'Yoruba', label: 'Yoruba' },
  { value: 'Hausa', label: 'Hausa' },
  { value: 'Igbo', label: 'Igbo' },
];

export default function Onboarding({ userId, existingName, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(existingName || '');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Pre-fill name if provided
  useEffect(() => {
    if (existingName) {
      setName(existingName);
    }
  }, [existingName]);

  const isLastSlide = step === slides.length;
  const isSetupStep = step === slides.length;

  const handleNext = () => {
    if (step < slides.length) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    if (!name.trim()) {
      toast({
        title: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Use upsert to handle both new profiles and updates
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          display_name: name.trim(),
          preferred_language: language,
          onboarded: true,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      onComplete();
    } catch (error: any) {
      toast({
        title: 'Error saving profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isSetupStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Let's get to know you</h1>
            <p className="text-muted-foreground">Just a few details to personalize your experience</p>
          </div>

          <div className="space-y-6 bg-card p-6 rounded-2xl border border-border">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">What should I call you?</label>
              <Input
                placeholder="Your name or nickname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Preferred language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleComplete}
              disabled={loading}
              className="w-full h-12 text-lg"
            >
              {loading ? 'Setting up...' : 'Start Using Moyo'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentSlide = slides[step];
  const Icon = currentSlide.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <Button variant="ghost" onClick={() => setStep(slides.length)}>
          Skip
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className={`w-24 h-24 rounded-full ${currentSlide.bg} flex items-center justify-center mb-8`}>
          <Icon className={`w-12 h-12 ${currentSlide.color}`} />
        </div>
        
        <h2 className="text-3xl font-bold text-foreground mb-4">{currentSlide.title}</h2>
        <p className="text-lg text-muted-foreground max-w-sm">{currentSlide.description}</p>
      </div>

      {/* Progress & Navigation */}
      <div className="p-8 space-y-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <Button onClick={handleNext} className="w-full h-12 text-lg">
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
