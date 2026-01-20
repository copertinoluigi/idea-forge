import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export type AIProvider = 'google' | 'openai' | 'anthropic';

export const AI_PROVIDERS = [
  { value: 'google-flash', label: 'Gemini 1.5 Flash', model: 'gemini-1.5-flash', provider: 'google' },
  { value: 'google-pro', label: 'Gemini 1.5 Pro', model: 'gemini-1.5-pro', provider: 'google' },
  { value: 'openai-4', label: 'GPT-4 Turbo', model: 'gpt-4-turbo', provider: 'openai' },
  { value: 'openai-4o', label: 'GPT-4o', model: 'gpt-4o', provider: 'openai' },
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
  provider: AIProvider;
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

  let model;
  switch (provider) {
    case 'google': model = createGoogleGenerativeAI({ apiKey })('gemini-1.5-flash'); break;
    case 'openai': model = createOpenAI({ apiKey })('gpt-4-turbo'); break;
    case 'anthropic': model = createAnthropic({ apiKey })('claude-3-5-sonnet-20241022'); break;
    default: throw new Error(`Provider non supportato: ${provider}`);
  }

  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.7,
  });

  return text;
}
