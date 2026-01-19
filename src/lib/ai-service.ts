import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export type AIProvider = 'google' | 'openai' | 'anthropic';

const SYSTEM_PROMPT = `Sei un esperto Startup Coach e Product Manager. Il tuo compito è analizzare frammenti di conversazione e, se forniti, riassunti precedenti, per distillare l'evoluzione di un'idea.
Struttura sempre la risposta in:
## Analisi Critica
## Ricerca di Mercato
## Roadmap 0-to-launch`;

interface SummarizeParams {
  messages: Array<{ user: string; content: string }>;
  previousSummaries?: string[]; // I "layer" precedenti
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
    ? `\n\nCONTESTO PRECEDENTE (Riassunti consolidati):\n${previousSummaries.join('\n---\n')}`
    : '';

  const userPrompt = `Analizza questa parte di conversazione.${contextLayers}\n\nNUOVI MESSAGGI:\n${conversationText}\n\nAggiorna l'analisi basandoti su tutto il contesto fornito.`;

  let model;
  switch (provider) {
    case 'google':
      model = createGoogleGenerativeAI({ apiKey })('gemini-1.5-flash');
      break;
    case 'openai':
      model = createOpenAI({ apiKey })('gpt-4-turbo');
      break;
    case 'anthropic':
      model = createAnthropic({ apiKey })('claude-3-5-sonnet-20241022');
      break;
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
