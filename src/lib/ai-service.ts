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
  { value: 'openai-4o', label: 'GPT-4o (Bilanciato)', model: 'gpt-4o', provider: 'openai' },
  { value: 'openai-4', label: 'GPT-4 Turbo', model: 'gpt-4-turbo', provider: 'openai' },
  { value: 'anthropic-sonnet', label: 'Claude 3.5 Sonnet', model: 'claude-3-5-sonnet-20241022', provider: 'anthropic' },
];

/**
 * Funzione di Discovery Dinamica per i modelli Google
 */
async function getDynamicGeminiModel(apiKey: string, type: 'flash' | 'pro'): Promise<string> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (!data.models) return type === 'flash' ? "gemini-1.5-flash" : "gemini-1.5-pro";

    // Cerchiamo il modello che:
    // 1. Contiene 'gemini'
    // 2. Supporta 'generateContent'
    // 3. Corrisponde al tipo scelto (flash o pro)
    const bestModel = data.models.find((m: any) => 
      m.name.includes("gemini") && 
      m.supportedGenerationMethods.includes("generateContent") &&
      m.name.toLowerCase().includes(type)
    );

    // Rimuoviamo il prefisso 'models/' se presente
    return bestModel ? bestModel.name.replace("models/", "") : (type === 'flash' ? "gemini-1.5-flash" : "gemini-1.5-pro");
  } catch (e) {
    console.warn("Discovery Gemini fallita, uso fallback standard.");
    return type === 'flash' ? "gemini-1.5-flash" : "gemini-1.5-pro";
  }
}

interface SummarizeParams {
  messages: Array<{ user: string; content: string }>;
  previousSummaries?: string[];
  provider: string; // Il valore dal DB (es: 'google-flash')
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
    if (config.provider === 'google') {
      // Risoluzione dinamica del nome modello Gemini
      const dynamicModelName = await getDynamicGeminiModel(apiKey, config.model as 'flash' | 'pro');
      console.log(`Using Dynamic Gemini Model: ${dynamicModelName}`);
      
      const google = createGoogleGenerativeAI({ apiKey });
      model = google(dynamicModelName);
    } 
    else if (config.provider === 'openai') {
      const openai = createOpenAI({ apiKey });
      model = openai(config.model);
    } 
    else if (config.provider === 'anthropic') {
      const anthropic = createAnthropic({ apiKey });
      model = anthropic(config.model);
    } 
    else {
      throw new Error(`Provider non supportato: ${config.provider}`);
    }

    const { text } = await generateText({
      model,
      system: "Sei un esperto Startup Coach. Analizza la chat e restituisci insights critici e roadmap. Sii coinciso.",
      prompt: userPrompt,
      temperature: 0.7,
    });

    return text;
  } catch (error: any) {
    console.error("AI Service Error:", error);
    throw new Error(`Generazione fallita: ${error.message}`);
  }
}
