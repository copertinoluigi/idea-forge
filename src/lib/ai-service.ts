import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export type AIProvider = 'google-flash' | 'google-pro' | 'openai-4' | 'openai-4o' | 'anthropic-sonnet';

export interface AIConfig {
  value: AIProvider;
  label: string;
  model: string;
  provider: 'google' | 'openai' | 'anthropic';
}

export const AI_PROVIDERS: AIConfig[] = [
  // FIX: Usiamo nomi modello standardizzati per l'SDK
  { value: 'google-flash', label: 'Gemini 1.5 Flash', model: 'gemini-1.5-flash', provider: 'google' },
  { value: 'google-pro', label: 'Gemini 1.5 Pro', model: 'gemini-1.5-pro', provider: 'google' },
  { value: 'openai-4o', label: 'GPT-4o', model: 'gpt-4o', provider: 'openai' },
  { value: 'openai-4', label: 'GPT-4 Turbo', model: 'gpt-4-turbo', provider: 'openai' },
  { value: 'anthropic-sonnet', label: 'Claude 3.5 Sonnet', model: 'claude-3-5-sonnet-20241022', provider: 'anthropic' },
];

interface SummarizeParams {
  messages: Array<{ user: string; content: string }>;
  previousSummaries?: string[];
  provider: string;
  apiKey: string;
}

export async function summarizeConversation({
  messages,
  previousSummaries = [],
  provider,
  apiKey,
}: SummarizeParams): Promise<string> {
  const conversationText = messages.map((m) => `${m.user}: ${m.content}`).join('\n');
  const contextLayers = previousSummaries.length > 0 
    ? `\n\nCONTESTO PRECEDENTE:\n${previousSummaries.join('\n---\n')}`
    : '';

  const userPrompt = `Analizza questa conversazione.${contextLayers}\n\nNUOVI MESSAGGI:\n${conversationText}`;

  const config = AI_PROVIDERS.find(p => p.value === provider) || AI_PROVIDERS[0];
  
  let model;
  try {
    switch (config.provider) {
      case 'google':
        // FIX: configurazione esplicita per evitare v1beta mismatch
        model = createGoogleGenerativeAI({ apiKey })(config.model);
        break;
      case 'openai':
        model = createOpenAI({ apiKey })(config.model);
        break;
      case 'anthropic':
        model = createAnthropic({ apiKey })(config.model);
        break;
      default:
        throw new Error(`Provider non supportato`);
    }

    const { text } = await generateText({
      model,
      system: "Sei un esperto Startup Coach. Rispondi in modo conciso e chirurgico.",
      prompt: userPrompt,
      temperature: 0.7,
    });
    return text;
  } catch (error: any) {
    console.error("AI Service Error:", error);
    throw new Error(`Generazione fallita: ${error.message}`);
  }
}
