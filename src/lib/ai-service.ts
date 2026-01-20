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
  { value: 'google-flash', label: 'Gemini 1.5 Flash', model: 'flash', provider: 'google' },
  { value: 'google-pro', label: 'Gemini 1.5 Pro', model: 'pro', provider: 'google' },
  { value: 'openai-4o', label: 'GPT-4o', model: 'gpt-4o', provider: 'openai' },
  { value: 'openai-4', label: 'GPT-4 Turbo', model: 'gpt-4-turbo', provider: 'openai' },
  { value: 'anthropic-sonnet', label: 'Claude 3.5 Sonnet', model: 'claude-3-5-sonnet-20241022', provider: 'anthropic' },
];

async function getDynamicGeminiModel(apiKey: string, type: 'flash' | 'pro'): Promise<string> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (!data.models) return type === 'flash' ? "gemini-1.5-flash" : "gemini-1.5-pro";
    const bestModel = data.models.find((m: any) => 
      m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent") && m.name.toLowerCase().includes(type)
    );
    return bestModel ? bestModel.name.replace("models/", "") : (type === 'flash' ? "gemini-1.5-flash" : "gemini-1.5-pro");
  } catch (e) { return type === 'flash' ? "gemini-1.5-flash" : "gemini-1.5-pro"; }
}

// 1. FUNZIONE PER CHAT PRIVATA (INTERAZIONE CONTINUA)
export async function chatWithAI({ messages, provider, apiKey }: { messages: any[], provider: string, apiKey: string }) {
  const config = AI_PROVIDERS.find(p => p.value === provider) || AI_PROVIDERS[0];
  let model;

  if (config.provider === 'google') {
    const dynamicName = await getDynamicGeminiModel(apiKey, config.model as 'flash' | 'pro');
    model = createGoogleGenerativeAI({ apiKey })(dynamicName);
  } else if (config.provider === 'openai') {
    model = createOpenAI({ apiKey })(config.model);
  } else {
    model = createAnthropic({ apiKey })(config.model);
  }

  // Prendiamo gli ultimi 10 messaggi per dare memoria alla chat
  const chatContext = messages.slice(-10).map(m => `${m.role === 'user' ? 'Utente' : 'Assistente'}: ${m.content}`).join('\n');

  const { text } = await generateText({
    model,
    system: "Sei un assistente AI esperto e amichevole. Puoi scrivere codice, dare consigli e chiacchierare. Rispondi in modo diretto.",
    prompt: `Ecco la cronologia recente:\n${chatContext}\n\nRispondi all'ultimo messaggio dell'utente.`,
    temperature: 0.8,
  });
  return text;
}

// 2. FUNZIONE PER SUMMARIZE (DORMIENTE NELLE STANZE, SI ATTIVA SOLO SU COMANDO)
export async function summarizeConversation({ messages, previousSummaries = [], provider, apiKey }: any) {
  const config = AI_PROVIDERS.find(p => p.value === provider) || AI_PROVIDERS[0];
  let model;

  if (config.provider === 'google') {
    const dynamicName = await getDynamicGeminiModel(apiKey, config.model as 'flash' | 'pro');
    model = createGoogleGenerativeAI({ apiKey })(dynamicName);
  } else if (config.provider === 'openai') {
    model = createOpenAI({ apiKey })(config.model);
  } else {
    model = createAnthropic({ apiKey })(config.model);
  }

  const conversationText = messages.map((m: any) => `${m.user}: ${m.content}`).join('\n');
  const contextLayers = previousSummaries.length > 0 ? `\n\nCONTESTO PRECEDENTE:\n${previousSummaries.join('\n---\n')}` : '';

  const { text } = await generateText({
    model,
    system: "Sei un esperto Startup Coach. Analizza la discussione e produci un'analisi critica e una roadmap strategica.",
    prompt: `Analizza questa sessione di brainstorming.${contextLayers}\n\nNUOVI MESSAGGI:\n${conversationText}`,
    temperature: 0.7,
  });
  return text;
}
