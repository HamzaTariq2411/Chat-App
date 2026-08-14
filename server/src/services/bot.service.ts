export const generateBotReply = async (_chatId: string, userMessage: string): Promise<string> => {
  await new Promise((r) => setTimeout(r, 800)); 
  return `You said: "${userMessage}"`;
};