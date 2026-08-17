import { env } from '@/config/env';
import prisma from '@/config/db';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT =
  'You are PennBot, a friendly and helpful AI assistant inside a chat app. Keep replies concise (2-4 sentences unless asked for more detail), conversational, and warm.';

const getHistory = async (chatId: string): Promise<ChatMessage[]> => {
  const recentMessages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { sender: { select: { isBot: true } } },
  });

  return recentMessages.reverse().map((m) => ({
    role: m.sender.isBot ? 'assistant' : 'user',
    content: m.content,
  }));
};

const callOllama = async (messages: ChatMessage[]): Promise<string> => {
  const response = await fetch(`${env.OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: env.OLLAMA_MODEL, messages, stream: false }),
  });

  if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
  const data = await response.json();
  return data.message?.content?.trim() ?? '';
};

const callGroq = async (messages: ChatMessage[]): Promise<string> => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model: env.GROQ_MODEL, messages, temperature: 0.7 }),
  });

  if (!response.ok) throw new Error(`Groq error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
};

export const generateBotReply = async (chatId: string, _latestUserMessage: string): Promise<string> => {
  try {
    const history = await getHistory(chatId);
    const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];

    const reply = env.BOT_PROVIDER === 'groq' ? await callGroq(messages) : await callOllama(messages);

    return reply || "Sorry, I couldn't come up with a reply just now.";
  } catch (err) {
    console.error('❌ Bot reply generation failed:', err);
    return env.BOT_PROVIDER === 'groq'
      ? "I'm having trouble connecting to my AI service right now. Try again in a moment!"
      : "I'm having trouble thinking right now — make sure Ollama is running locally!";
  }
};