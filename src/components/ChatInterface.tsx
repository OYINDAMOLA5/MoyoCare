import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { analyzeSentiment } from '@/utils/sentimentAnalysis';
import { classifyIntent } from '@/utils/intentClassification';
import { generateResponse, CyclePhase, ContextData } from '@/utils/contextAwareness';
import { Brain, Send, ArrowLeft, Mic } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string[];
  sentiment?: string;
  intent?: string;
}

interface ChatInterfaceProps {
  onBack: () => void;
  isPeriodMode: boolean;
  cyclePhase: CyclePhase;
}

const quickChips = [
  'I am stressed',
  'Cramps are killing me',
  'I feel lonely',
  'Exam tomorrow'
];

export default function ChatInterface({ onBack, isPeriodMode, cyclePhase }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [currentThinking, setCurrentThinking] = useState<string[]>([]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Analyze sentiment
    const sentiment = analyzeSentiment(messageText);
    
    // Classify intent
    const intent = classifyIntent(messageText);
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSendMessage(input);
  };

  const handleChipClick = async (chipText: string) => {
    setInput(chipText);
    await handleSendMessage(chipText);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto p-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Chat with Moyo</h1>
            <p className="text-xs text-muted-foreground">I'm here to listen, sis</p>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <Brain className="w-16 h-16 text-primary opacity-50" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Wetin dey worry you today?
              </h3>
              <p className="text-sm text-muted-foreground">
                Talk to me, sis. I dey here to listen.
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
              className={`max-w-[85%] rounded-3xl p-4 space-y-2 ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              
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
            <div className="max-w-[85%] rounded-3xl p-4 space-y-2 bg-accent/10 border border-accent/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Brain className="w-4 h-4 animate-pulse" />
                Moyo is thinking...
              </div>
              {currentThinking.map((thought, i) => (
                <p key={i} className="text-xs text-muted-foreground animate-pulse">
                  {thought}
                </p>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="sticky bottom-0 bg-card border-t border-border shadow-lg">
        <div className="max-w-4xl mx-auto p-4 space-y-3">
          {/* Quick Chips */}
          {messages.length === 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {quickChips.map((chip, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleChipClick(chip)}
                  disabled={isThinking}
                  className="flex-shrink-0 rounded-full"
                >
                  {chip}
                </Button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-h-[50px] max-h-[120px] resize-none rounded-3xl"
              disabled={isThinking}
              rows={1}
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="flex-shrink-0"
              disabled={isThinking}
            >
              <Mic className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={isThinking || !input.trim()}
              className="flex-shrink-0 bg-primary hover:bg-primary/90 rounded-full"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </footer>
    </div>
  );
}
