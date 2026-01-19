import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export type AIProvider = 'google' | 'openai' | 'anthropic';

const SYSTEM_PROMPT = `You are an Expert Startup Coach with deep experience in product development, market analysis, and go-to-market strategies.

Your role is to analyze startup conversations and provide actionable insights in three key areas:

1. CRITICAL ANALYSIS: Evaluate the idea's strengths, challenges, and provide concrete recommendations
2. MARKET RESEARCH: Assess target audience, market size, competitive landscape, and go-to-market strategy
3. ROADMAP: Create a detailed 0-to-launch roadmap with specific phases and actionable steps

Be direct, data-informed, and focus on practical execution. Challenge assumptions constructively and highlight potential risks early.`;

interface SummarizeParams {
  messages: Array<{
    user: string;
    content: string;
  }>;
  provider: AIProvider;
  apiKey: string;
}

export async function summarizeConversation({
  messages,
  provider,
  apiKey,
}: SummarizeParams): Promise<string> {
  const conversationText = messages
    .map((m) => `${m.user}: ${m.content}`)
    .join('\n');

  const userPrompt = `Analyze the following startup brainstorming conversation and provide insights:

${conversationText}

Please structure your response with these exact sections:
## Critical Analysis
## Market Research
## Roadmap

Be specific, actionable, and focus on helping this team succeed.`;

  let model;

  switch (provider) {
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey });
      model = google('gemini-1.5-flash');
      break;
    }

    case 'openai': {
      const openaiProvider = createOpenAI({ apiKey });
      model = openaiProvider('gpt-4-turbo');
      break;
    }

    case 'anthropic': {
      const anthropicProvider = createAnthropic({ apiKey });
      model = anthropicProvider('claude-3-5-sonnet-20241022');
      break;
    }

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }

  try {
    const { text } = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
    });

    return text;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`AI generation failed: ${error.message}`);
    }
    throw new Error('AI generation failed with unknown error');
  }
}

export const AI_PROVIDERS = [
  { value: 'google', label: 'Google Gemini', model: 'Gemini 1.5 Flash' },
  { value: 'openai', label: 'OpenAI', model: 'GPT-4 Turbo' },
  { value: 'anthropic', label: 'Anthropic', model: 'Claude 3.5 Sonnet' },
] as const;
