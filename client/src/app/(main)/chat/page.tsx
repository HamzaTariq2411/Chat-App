'use client';

import { Sidebar } from '@/components/chat/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useSocket } from '@/hooks/useSocket';

export default function ChatPage() {
  useSocket(); // establishes the socket connection for this session

  return (
    <>
      <Sidebar />
      <ChatWindow />
    </>
  );
}