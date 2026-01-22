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

// Helper per costruire il contenuto multimodale (Testo + Immagini)
function buildMultimodalContent(text: string, attachments: any[] = []) {
  const parts: any[] = [];
  
  if (text) {
    parts.push({ type: 'text', text });
  }

  if (attachments && attachments.length > 0) {
    attachments.forEach((att) => {
      // Supportiamo immagini tramite URL pubblico (Supabase Storage è pubblico)
      if (att.type?.startsWith('image/')) {
        parts.push({
          type: 'image',
          image: new URL(att.url),
        });
      } else {
        // Se non è un'immagine, aggiungiamo una nota testuale all'AI
        parts.push({ type: 'text', text: `[Allegato file: ${att.name}]` });
      }
    });
  }

  return parts;
}

// 1. CHAT COLLOQUIALE (Supporta Vision)
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

  const lastMessage = messages[messages.length - 1];
  
  // Costruiamo il contenuto multimodale per l'ultimo messaggio ricevuto
  const multimodalContent = buildMultimodalContent(lastMessage.content, lastMessage.attachments);

  const { text } = await generateText({
    model,
    system: "Sei un assistente AI versatile. Se ti vengono inviate immagini, analizzale con cura per rispondere alle richieste. Rispondi in modo naturale e colloquiale. Non usare prompt da startup coach qui.",
    content: multimodalContent,
    temperature: 0.2,
  });
  return text;
}

// 2. ANALISI SUMMARIZE (Supporta Vision Context)
export async function summarizeConversation({ 
  messages, 
  previousSummaries = [], 
  provider, 
  apiKey,
  customInstructions 
}: any) {
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

  // Prepariamo i blocchi di conversazione includendo descrizioni di eventuali immagini
  const promptParts: any[] = [
    { type: 'text', text: `${customInstructions || "Analizza questa conversazione."}\n\n` }
  ];

  if (previousSummaries.length > 0) {
    promptParts.push({ type: 'text', text: `CONTESTO PRECEDENTE:\n${previousSummaries.join('\n---\n')}\n\n` });
  }

  promptParts.push({ type: 'text', text: "NUOVI MESSAGGI DA ELABORARE:\n" });

  // Iteriamo sui messaggi per includere testo ed eventuali immagini nel riassunto
  messages.forEach((m: any) => {
    promptParts.push({ type: 'text', text: `${m.user}: ${m.content}\n` });
    
    if (m.attachments && m.attachments.length > 0) {
      m.attachments.forEach((att: any) => {
        if (att.type?.startsWith('image/')) {
          promptParts.push({ type: 'image', image: new URL(att.url) });
        }
      });
    }
  });

  const { text } = await generateText({
    model,
    system: "Sei un esperto Startup Coach & Business Analyst. Il tuo compito è analizzare testo e immagini inviate per distillare insights, roadmap e asset strutturati. Se vedi screenshot di UI o loghi, descrivili e integrali nell'analisi.",
    content: promptParts,
    temperature: 0.0,
  });
  
  return text;
}
