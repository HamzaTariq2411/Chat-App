// client/src/types/index.ts
export interface User {
  id: string;
  name: string;
  email?: string;
  avatar: string | null;
  isBot: boolean;
  isOnline: boolean;
  lastSeen?: string;
}

export interface ChatMember {
  id: string;
  userId: string;
  isAdmin: boolean;
  user: User;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderType: 'USER' | 'BOT';
  content: string;
  createdAt: string;
  sender: User;
}

export interface Chat {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  name: string | null;
  members: ChatMember[];
  messages: Message[];
  updatedAt: string;
}

export interface AuthResponse {
  user: User & { email: string };
  token: string;
}