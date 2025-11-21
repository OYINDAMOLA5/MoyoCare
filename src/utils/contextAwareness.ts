// Context Awareness Engine
import { Intent } from './intentClassification';
import { SentimentResult } from './sentimentAnalysis';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface ContextData {
  isPeriodMode: boolean;
  cyclePhase: CyclePhase;
}

export interface ResponseContext {
  sentiment: SentimentResult;
  intent: Intent;
  context: ContextData;
  thinking: string[];
}

const phaseDescriptions: Record<CyclePhase, string> = {
  menstrual: 'Menstrual Phase (Days 1-5)',
  follicular: 'Follicular Phase (Days 6-13)',
  ovulation: 'Ovulation Phase (Days 14-16)',
  luteal: 'Luteal Phase (Days 17-28)'
};

export function generateResponse(responseContext: ResponseContext): {
  response: string;
  thinking: string[];
  resources?: string[];
} {
  const { sentiment, intent, context } = responseContext;
  const thinking: string[] = [];
  
  // Thinking process visualization
  thinking.push(`Analyzing sentiment: ${sentiment.level.toUpperCase()}`);
  thinking.push(`Intent classified as: ${intent}`);
  thinking.push(`Context: ${phaseDescriptions[context.cyclePhase]}`);
  thinking.push(`Period Mode: ${context.isPeriodMode ? 'Active' : 'Inactive'}`);
  
  // CRISIS MODE - Safety protocols
  if (intent === 'CRISIS' || sentiment.level === 'high-distress') {
    thinking.push('⚠️ CRISIS PROTOCOL ACTIVATED');
    return {
      response: `I'm really concerned about you. Please reach out for immediate help:\n\n🆘 **Crisis Resources:**\n• National Suicide Prevention Lifeline: 988\n• Crisis Text Line: Text HOME to 741741\n• International: findahelpline.com\n\nYou matter, and there are people who want to help. Please don't face this alone. 💜`,
      thinking,
      resources: [
        'National Suicide Prevention Lifeline: 988',
        'Crisis Text Line: 741741',
        'findahelpline.com'
      ]
    };
  }
  
  // PHYSICAL INTENT with Context Awareness
  if (intent === 'PHYSICAL') {
    thinking.push('Generating context-aware physical wellness advice...');
    
    if (context.isPeriodMode) {
      return {
        response: `I hear you - period symptoms can be really tough. Since you're in your ${phaseDescriptions[context.cyclePhase]}, here are some targeted suggestions:\n\n🌡️ **For Cramps & Pain:**\n• Apply a heating pad to your lower abdomen\n• Try gentle yoga or stretching\n• Stay hydrated with warm herbal tea\n\n💊 **Consider:**\n• Ibuprofen (if safe for you)\n• Magnesium supplements\n• Rest when your body needs it\n\n${context.cyclePhase === 'menstrual' ? 'This is the hardest phase - be extra gentle with yourself. 💛' : 'Your body is working hard - prioritize rest and comfort. ✨'}`,
        thinking
      };
    } else {
      return {
        response: `I understand you're not feeling well. Let me help with some general wellness tips:\n\n💧 **Self-Care Basics:**\n• Drink plenty of water\n• Ensure you're getting 7-9 hours of sleep\n• Take breaks throughout the day\n\n🌿 **Natural Relief:**\n• Deep breathing exercises\n• Gentle stretching\n• Fresh air and light movement\n\nIf symptoms persist, please consider consulting a healthcare provider. Take care! 🌸`,
        thinking
      };
    }
  }
  
  // ACADEMIC INTENT with Empathy
  if (intent === 'ACADEMIC') {
    thinking.push('Providing academic support with cycle awareness...');
    
    const academicResponse = `Academic stress is real, and ${context.isPeriodMode ? 'dealing with it during your period makes it even harder' : 'you deserve support through this'}.\n\n📚 **Stress Management:**\n• Break tasks into smaller chunks\n• Use the Pomodoro technique (25 min focus, 5 min break)\n• Practice self-compassion\n\n${context.cyclePhase === 'luteal' ? '⚠️ Note: You\'re in the Luteal Phase - many people find concentration harder now. Be extra kind to yourself!' : ''}\n\n🧠 **Study Tips:**\n• Study in short, focused bursts\n• Prioritize the most important topics\n• Remember: One exam doesn't define you\n\nYou've got this! 💪`;
    
    return {
      response: academicResponse,
      thinking
    };
  }
  
  // EMOTIONAL SUPPORT
  if (intent === 'EMOTIONAL' || sentiment.level === 'empathy') {
    thinking.push('Activating empathy mode...');
    
    return {
      response: `I'm here for you. ${context.isPeriodMode ? 'Emotional ups and downs during your cycle are completely valid.' : 'Your feelings are valid.'}\n\n💜 **What might help:**\n• Talk to someone you trust\n• Journal your thoughts\n• Do something that brings you joy\n• Remember: feelings are temporary\n\n${context.cyclePhase === 'luteal' ? '🌙 You\'re in the Luteal Phase - hormonal changes can intensify emotions. This is biological, not weakness.' : ''}\n\nBe gentle with yourself today. 🌸`,
      thinking
    };
  }
  
  // POSITIVE / GENERAL
  thinking.push('Generating supportive response...');
  return {
    response: `${sentiment.level === 'positive' ? 'I\'m so glad to hear you\'re doing well! 😊' : 'I\'m here to support you.'}\n\nHow can I help you today? I can provide:\n• Period symptom management\n• Academic stress support\n• Emotional wellness tips\n• Cycle-aware self-care advice\n\nFeel free to share what's on your mind. 💛`,
    thinking
  };
}
