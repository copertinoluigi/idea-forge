import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export type AIProviderValue = 'google-flash' | 'google-pro' | 'openai-4' | 'openai-4o' | 'anthropic-sonnet';

export const AI_PROVIDERS = [
  { value: 'google-flash', label: 'Gemini 1.5 Flash (Veloce)', model: 'gemini-1.5-flash', provider: 'google' },
  { value: 'google-pro', label: 'Gemini 1.5 Pro (Intelligente)', model: 'gemini-1.5-pro', provider: 'google' },
  { value: 'openai-4o', label: 'GPT-4o (Bilanciato)', model: 'gpt-4o', provider: 'openai' },
  { value: 'openai-4', label: 'GPT-4 Turbo (Preciso)', model: 'gpt-4-turbo', provider: 'openai' },
  { value: 'anthropic-sonnet', label: 'Claude 3.5 Sonnet', model: 'claude-3-5-sonnet-20241022', provider: 'anthropic' },
] as const;

const SYSTEM_PROMPT = `Sei un esperto Startup Coach e Product Manager. Il tuo compito è analizzare frammenti di conversazione e riassunti precedenti per distillare l'evoluzione di un'idea.
Struttura la risposta in:
## Analisi Critica
## Ricerca di Mercato
## Roadmap 0-to-launch`;

interface SummarizeParams {
  messages: Array<{ user: string; content: string }>;
  previousSummaries?: string[];
  provider: string; // Il valore salvato nel DB (es: 'google-flash')
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

  // Troviamo il modello corretto in base al valore salvato nel DB
  const config = AI_PROVIDERS.find(p => p.value === provider) || AI_PROVIDERS[0];
  
  let model;
  switch (config.provider) {
    case 'google':
      model = createGoogleGenerativeAI({ apiKey })(config.model);
      break;
    case 'openai':
      model = createOpenAI({ apiKey })(config.model);
      break;
    case 'anthropic':
      model = createAnthropic({ apiKey })(config.model);
      break;
    default:
      throw new Error(`Provider non supportato: ${config.provider}`);
  }

  try {
    const { text } = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
    });
    return text;
  } catch (error: any) {
    throw new Error(`Generazione fallita: ${error.message}`);
  }
}
