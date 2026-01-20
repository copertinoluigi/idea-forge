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

async function getDynamicGeminiModel(apiKey: string, type: string): Promise<string> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (!data.models) return "gemini-1.5-flash";
    const bestModel = data.models.find((m: any) => 
      m.name.includes("gemini") && 
      m.supportedGenerationMethods.includes("generateContent") &&
      m.name.toLowerCase().includes(type.includes('pro') ? 'pro' : 'flash')
    );
    return bestModel ? bestModel.name.replace("models/", "") : "gemini-1.5-flash";
  } catch (e) {
    return "gemini-1.5-flash";
  }
}

// 1. CHAT COLLOQUIALE (Per la Console Privata)
export async function chatWithAI({ messages, provider, apiKey }: { messages: any[], provider: string, apiKey: string }) {
  const config = AI_PROVIDERS.find(p => p.value === provider) || AI_PROVIDERS[0];
  let model;

  if (config.provider === 'google') {
    const dynamicName = await getDynamicGeminiModel(apiKey, config.model);
    model = createGoogleGenerativeAI({ apiKey })(dynamicName);
  } else if (config.provider === 'openai') {
    model = createOpenAI({ apiKey })(config.model);
  } else {
    model = createAnthropic({ apiKey })(config.model);
  }

  const { text } = await generateText({
    model,
    system: "Sei un assistente AI versatile. Rispondi in modo naturale e colloquiale. Puoi aiutare con il codice, rispondere a domande generali o semplicemente chiacchierare. Non usare prompt da startup coach qui.",
    prompt: messages[messages.length - 1].content,
    temperature: 0.8,
  });
  return text;
}

// 2. ANALISI SUMMARIZE (Per le Stanze di Gruppo)
export async function summarizeConversation({ messages, previousSummaries = [], provider, apiKey }: any) {
  const config = AI_PROVIDERS.find(p => p.value === provider) || AI_PROVIDERS[0];
  let model;

  if (config.provider === 'google') {
    const dynamicName = await getDynamicGeminiModel(apiKey, config.model);
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
    system: "Sei un esperto Startup Coach. Il tuo compito è analizzare la chat e distillare insights critici, roadmap e analisi di mercato. Sii molto professionale e tecnico.",
    prompt: `Analizza questa conversazione.${contextLayers}\n\nNUOVI MESSAGGI:\n${conversationText}`,
    temperature: 0.7,
  });
  return text;
}
