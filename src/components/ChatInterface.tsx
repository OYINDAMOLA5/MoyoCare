import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { analyzeSentiment } from '@/utils/sentimentAnalysis';
import { classifyIntent } from '@/utils/intentClassification';
import { generateResponse, CyclePhase, ContextData } from '@/utils/contextAwareness';
import { Brain, Heart, Send, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string[];
  sentiment?: string;
  intent?: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isPeriodMode, setIsPeriodMode] = useState(false);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase>('follicular');
  const [currentThinking, setCurrentThinking] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Analyze sentiment
    const sentiment = analyzeSentiment(input);
    
    // Classify intent
    const intent = classifyIntent(input);
    
    // Context data
    const context: ContextData = {
      isPeriodMode,
      cyclePhase
    };

    // Generate response
    const result = generateResponse({
      sentiment,
      intent: intent.primary,
      context,
      thinking: []
    });

    setCurrentThinking(result.thinking);
    
    // Simulate processing thinking steps
    await new Promise(resolve => setTimeout(resolve, 1200));

    const assistantMessage: Message = {
      role: 'assistant',
      content: result.response,
      thinking: result.thinking,
      sentiment: sentiment.level,
      intent: intent.primary
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsThinking(false);
    setCurrentThinking([]);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[hsl(25,75%,65%)] bg-clip-text text-transparent">
              CycleWise AI
            </h1>
          </div>
          <p className="text-muted-foreground">
            Your empathetic AI companion for menstrual health & wellness
          </p>
        </div>

        {/* Context Controls */}
        <Card className="p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="period-mode" className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Period Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable for cycle-specific support
              </p>
            </div>
            <Switch
              id="period-mode"
              checked={isPeriodMode}
              onCheckedChange={setIsPeriodMode}
            />
          </div>

          {isPeriodMode && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-sm font-medium">Cycle Phase</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(['menstrual', 'follicular', 'ovulation', 'luteal'] as CyclePhase[]).map(phase => (
                  <Button
                    key={phase}
                    variant={cyclePhase === phase ? 'warm' : 'outline'}
                    size="sm"
                    onClick={() => setCyclePhase(phase)}
                    className="capitalize"
                  >
                    {phase}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Chat Messages */}
        <Card className="min-h-[400px] max-h-[500px] overflow-y-auto p-6 space-y-4 shadow-lg">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <Brain className="w-16 h-16 text-primary opacity-50" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-muted-foreground">
                  How are you feeling today?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Share your thoughts, concerns, or symptoms. I'm here to help.
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 space-y-2 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-[hsl(25,75%,65%)] text-white'
                    : 'bg-card border border-border'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {message.role === 'assistant' && message.thinking && (
                  <div className="pt-2 mt-2 border-t border-border/50 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <Brain className="w-3 h-3" />
                      Thinking Process:
                    </div>
                    {message.thinking.map((thought, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {thought}
                      </p>
                    ))}
                  </div>
                )}

                {message.sentiment && message.intent && (
                  <div className="flex gap-2 pt-2">
                    <Badge variant="secondary" className="text-xs">
                      {message.sentiment}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {message.intent}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-4 space-y-2 bg-gradient-to-r from-accent/20 to-accent/10 border-accent/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                  <Brain className="w-4 h-4 animate-pulse" />
                  Analyzing your message...
                </div>
                {currentThinking.map((thought, i) => (
                  <p key={i} className="text-xs text-muted-foreground animate-pulse">
                    {thought}
                  </p>
                ))}
              </Card>
            </div>
          )}
        </Card>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share how you're feeling..."
            className="min-h-[100px] resize-none rounded-xl border-border focus:border-primary transition-colors"
            disabled={isThinking}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="warm"
              size="lg"
              disabled={isThinking || !input.trim()}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Send Message
            </Button>
          </div>
        </form>

        {/* Info Footer */}
        <Card className="p-4 bg-muted/50 border-border">
          <p className="text-xs text-muted-foreground text-center">
            <strong>AI Demo:</strong> This showcases sentiment analysis, intent classification, and context-aware responses.
            For actual crises, please contact professional helplines.
          </p>
        </Card>
      </div>
    </div>
  );
}
