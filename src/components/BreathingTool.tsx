import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreathingToolProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathingPhase = 'inhale' | 'hold' | 'exhale';

export default function BreathingTool({ isOpen, onClose }: BreathingToolProps) {
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setPhase('inhale');
      setCycle(0);
      return;
    }

    const phaseTimings = {
      inhale: 4000,
      hold: 2000,
      exhale: 4000,
    };

    const interval = setInterval(() => {
      setPhase((current) => {
        if (current === 'inhale') return 'hold';
        if (current === 'hold') return 'exhale';
        setCycle((c) => c + 1);
        return 'inhale';
      });
    }, phase === 'hold' ? phaseTimings.hold : phaseTimings.inhale);

    return () => clearInterval(interval);
  }, [isOpen, phase]);

  if (!isOpen) return null;

  const phaseText = {
    inhale: 'Breathe In',
    hold: 'Hold',
    exhale: 'Breathe Out',
  };

  const phaseSubtext = {
    inhale: 'Simi... Fill your lungs',
    hold: 'Mu... Hold gently',
    exhale: 'Fẹ... Let it go',
  };

  const circleScale = {
    inhale: 'scale-150',
    hold: 'scale-150',
    exhale: 'scale-100',
  };

  const phaseColors = {
    inhale: 'from-primary to-secondary',
    hold: 'from-secondary to-accent',
    exhale: 'from-accent to-primary',
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10 safe-area-inset-top">
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground bg-card/50 backdrop-blur-sm rounded-full w-12 h-12"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-safe">
        {/* Breathing Circle */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-8">
          {/* Outer glow */}
          <div
            className={`absolute w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br ${phaseColors[phase]} opacity-30 blur-3xl transition-transform duration-[4000ms] ease-in-out ${circleScale[phase]}`}
          />
          {/* Main circle */}
          <div
            className={`absolute w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br ${phaseColors[phase]} shadow-2xl transition-transform duration-[4000ms] ease-in-out ${circleScale[phase]}`}
          />
          {/* Inner glow */}
          <div
            className={`absolute w-20 h-20 md:w-24 md:h-24 rounded-full bg-background/30 transition-transform duration-[4000ms] ease-in-out ${circleScale[phase]}`}
          />
        </div>

        {/* Instruction Text */}
        <div className="text-center space-y-3 mb-8">
          <p className="text-4xl md:text-5xl font-bold text-foreground">
            {phaseText[phase]}
          </p>
          <p className="text-lg md:text-xl text-muted-foreground">
            {phaseSubtext[phase]}
          </p>
          <div className="flex items-center justify-center gap-2 pt-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= cycle ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Cycle {cycle + 1} of 5
          </p>
        </div>

        {/* Tips */}
        <div className="max-w-md text-center space-y-3 px-4">
          <p className="text-base text-muted-foreground">
            Focus on your breath. Let go of any tension. You're safe here, sis.
          </p>
          <p className="text-sm text-muted-foreground/70">
            Tap anywhere to close when you're ready
          </p>
        </div>
      </div>

      {/* Touch overlay to close */}
      <div 
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
}
