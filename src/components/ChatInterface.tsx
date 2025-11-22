import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Send, ArrowLeft, Mic, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GROQ_API_KEY_STORAGE } from './SettingsDialog';
import { CyclePhase } from '@/utils/contextAwareness';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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

const SYSTEM_PROMPT = `You are Moyo, a warm, compassionate, and professional AI Therapist for young Nigerian female students.

YOUR GOAL:
Provide Cognitive Behavioral Therapy (CBT) and emotional support directly in the chat. Do not refer the user to a doctor unless they are in immediate danger. Help them process their feelings NOW.

YOUR PERSONA:
- Tone: Like a wise, calm older sister or auntie. Warm, safe, non-judgmental.
- Language: English mixed with light Nigerian Pidgin nuance (use "Sis", "We", "Small small", "Wahala").
- Context Awareness: You understand Nigerian university stress (lecturers, strikes, family pressure).

RULES:
1. IF user mentions menstrual pain/cramps: Ask about their cycle phase and suggest specific physical comfort (heat, water) + emotional validation.
2. IF user is anxious (exams): Use CBT "Reframing". Ask them to challenge the negative thought.
3. IF user is suicidal: Show deep empathy, de-escalate, and gently urge them to stay safe, but DO NOT shut down the conversation. Stay with them.
4. LENGTH: Keep responses short (2-3 sentences max). This is a chat, not an email.`;

export default function ChatInterface({ onBack, isPeriodMode, cyclePhase }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Check for API key
    const apiKey = localStorage.getItem(GROQ_API_KEY_STORAGE);
    if (!apiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please add your Groq API key in Settings',
        variant: 'destructive',
      });
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      // Add context about cycle phase to the user message if needed
      let contextualMessage = messageText;
      if (isPeriodMode) {
        contextualMessage += ` [Context: User is currently in ${cyclePhase} phase of menstrual cycle]`;
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: contextualMessage }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to get response from AI');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0]?.message?.content || 'I hear you, sis. Tell me more.',
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Groq API Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to connect to AI',
        variant: 'destructive',
      });
      
      // Remove the user message if API call failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsThinking(false);
    }
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
              className={`max-w-[85%] rounded-3xl p-4 ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-3xl p-4 bg-accent/10 border border-accent/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Brain className="w-4 h-4 animate-pulse" />
                Moyo is thinking...
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 && !localStorage.getItem(GROQ_API_KEY_STORAGE) && (
          <Card className="p-4 bg-accent/20 border-accent/40">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">API Key Required</p>
                <p className="text-xs text-muted-foreground">
                  To start chatting with Moyo, please add your Groq API key in Settings (click the gear icon on the home screen).
                </p>
              </div>
            </div>
          </Card>
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
