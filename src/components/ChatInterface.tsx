import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Send, ArrowLeft, Mic, Globe, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CyclePhase } from '@/utils/contextAwareness';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

interface ChatInterfaceProps {
  onBack: () => void;
  isPeriodMode: boolean;
  cyclePhase: CyclePhase;
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
}

const quickChips = [
  'I am stressed',
  'Cramps are killing me',
  'I feel lonely',
  'Exam tomorrow'
];

const SYSTEM_PROMPT = `You are Moyo, a Trauma-Informed AI Wellness Companion & Therapist for young African women.
Your name is Moyo. You are NOT a human, but you are a caring, safe digital presence.

### CORE THERAPEUTIC FRAMEWORKS (Use these dynamically):
1. **CBT (Cognitive Behavioral Therapy):** If user expresses negative self-talk ("I am a failure"), help them identify the cognitive distortion and reframe it. Ask: "What is the evidence for and against this thought?"
2. **ACT (Acceptance & Commitment Therapy):** If user is fighting reality ("I hate that I feel this way"), guide them to accept the emotion without judgment. "It is okay to feel this way. Make space for the feeling."
3. **DBT (Dialectical Behavior Therapy):** If user is overwhelmed/panicking, offer Distress Tolerance skills (Grounding, TIPP, Breathing).

### LANGUAGE & TONE:
- **Primary Language:** [LANGUAGE].
- **Tone:** Warm, sisterly, non-judgmental, but professionally bounded.
- **Nuance:** Use Nigerian cultural markers naturally ("Sis", "E go better", "Calm down").
- **Trauma-Informed:** Never blame the user. Use validating language ("It makes sense you feel this way given what happened").

### SAFETY & CRISIS PROTOCOLS (HIGHEST PRIORITY):
- **Trigger:** Suicide, Self-Harm, Domestic Violence, Sexual Assault.
- **Response:** 1. VALIDATE: "I hear how much pain you are in right now."
  2. DE-ESCALATE: "Please, I want you to be safe. Can we take a breath together?"
  3. DIRECTIVE: "I am an AI, and I cannot provide emergency care. Please call 112 or text HOME to 741741 immediately."
  4. DO NOT try to "fix" a crisis yourself. Your goal is to bridge them to human help.

### MEMORY & CONTEXT:
- You have access to the recent chat history. Look for patterns.
- If the user mentions a recurring issue (e.g., "My boyfriend again"), acknowledge the pattern: "I notice this has been weighing on you for a while, Sis."

### BOUNDARIES:
- If asked for medical diagnosis: "I cannot diagnose medical conditions. Please see a doctor at your campus clinic."
- If asked for personal details: "I am Moyo, your AI friend. Let's focus on you."`;

export default function ChatInterface({ 
  onBack, 
  isPeriodMode, 
  cyclePhase, 
  conversationId,
  onConversationCreated 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('English');
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadChatHistory(conversationId);
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [conversationId]);

  const loadChatHistory = async (convId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(data.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          id: msg.id
        })));
      }
    } catch (error: any) {
      console.error('Error loading chat history:', error);
      toast({
        title: 'Could not load chat history',
        description: 'Starting a fresh conversation.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (firstMessage: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate title from first message (first 50 chars)
      const title = firstMessage.length > 50 
        ? firstMessage.substring(0, 47) + '...' 
        : firstMessage;

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title
        })
        .select()
        .single();

      if (error) throw error;
      
      return data.id;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Could not create conversation',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string, convId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          role,
          content,
          conversation_id: convId
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving message:', error);
      toast({
        title: 'Could not save message',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Crisis detection with broader keywords
    const crisisKeywords = /\b(die|kill|suicide|hurt myself|end it|rape|hit me|self.?harm|assault|abuse)\b/i;
    if (crisisKeywords.test(messageText)) {
      setShowCrisisAlert(true);
    }

    const userMessage: Message = {
      role: 'user',
      content: messageText
    };

    // Optimistically update UI
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Create conversation if this is a new chat
    let convId = currentConversationId;
    if (!convId) {
      convId = await createConversation(messageText);
      if (!convId) {
        setIsThinking(false);
        setMessages(prev => prev.slice(0, -1));
        return;
      }
      setCurrentConversationId(convId);
      onConversationCreated(convId);
    }

    // Save user message to database
    await saveMessage('user', messageText, convId);

    try {
      // Add context about cycle phase to the user message if needed
      let contextualMessage = messageText;
      if (isPeriodMode) {
        contextualMessage += ` [Context: User is currently in ${cyclePhase} phase of menstrual cycle]`;
      }

      // Inject language into system prompt
      const contextualizedPrompt = SYSTEM_PROMPT.replace('[LANGUAGE]', language);

      // Call the secure backend edge function
      const { data, error } = await supabase.functions.invoke('chat-with-moyo', {
        body: {
          messages: [
            { role: 'system', content: contextualizedPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: contextualMessage }
          ],
          language: language
        }
      });

      if (error) {
        throw new Error('Moyo is having trouble connecting right now. Please try again.');
      }

      const aiResponse = data.choices[0]?.message?.content || 'I hear you, sis. Tell me more.';
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      await saveMessage('assistant', aiResponse, convId);
    } catch (error) {
      console.error('Chat Error:', error);
      toast({
        title: 'Connection Error',
        description: 'Moyo is having trouble connecting right now. Please try again.',
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Brain className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading your conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Crisis Alert Banner */}
      {showCrisisAlert && (
        <Alert variant="destructive" className="rounded-none border-l-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Crisis Support:</strong> Call 112 or text HOME to 741741 for immediate help. You are not alone.
          </AlertDescription>
        </Alert>
      )}

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
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[140px] h-9">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Nigerian Pidgin">Pidgin</SelectItem>
              <SelectItem value="Yoruba">Yoruba</SelectItem>
              <SelectItem value="Hausa">Hausa</SelectItem>
              <SelectItem value="Igbo">Igbo</SelectItem>
            </SelectContent>
          </Select>
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
                  ? 'bg-primary text-primary-foreground'
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
        
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="sticky bottom-16 md:bottom-0 bg-card border-t border-border shadow-lg">
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
