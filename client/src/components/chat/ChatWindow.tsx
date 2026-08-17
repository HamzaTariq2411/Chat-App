'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchChatMessages } from '@/lib/chat';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useSocket } from '@/hooks/useSocket';
import { getChatDisplayInfo, getInitials } from '@/lib/chatHelpers';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Send, Bot, MessageCircle } from 'lucide-react';

export const ChatWindow = () => {
    const user = useAuthStore((s) => s.user);
    const { activeChat, messages, setMessages, typingUsers } = useChatStore();
    const { joinChat, leaveChat, sendMessage, startTyping, stopTyping } = useSocket();

    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);

    const { data } = useQuery({
        queryKey: ['messages', activeChat?.id],
        queryFn: () => fetchChatMessages(activeChat!.id),
        enabled: !!activeChat,
    });

    useEffect(() => {
        if (data) setMessages(data);
    }, [data]);

    useEffect(() => {
        if (!activeChat) return;
        joinChat(activeChat.id);
        return () => {
            leaveChat(activeChat.id);
        };
    }, [activeChat?.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers]);

    if (!activeChat || !user) {
        return (
            <div className="flex-1 flex items-center justify-center text-neutral-600">
                <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>Select a chat to start messaging</p>
                </div>
            </div>
        );
    }

    const info = getChatDisplayInfo(activeChat, user.id);
    const otherMember = activeChat.members.find((m) => m.userId !== user.id);
    const isTyping = otherMember ? typingUsers.has(otherMember.userId) || (info.isBot && typingUsers.has('bot')) : false;

    const handleSend = async () => {
        const content = input.trim();
        if (!content) return;
        setInput('');
        stopTyping(activeChat.id);
        try {
            await sendMessage(activeChat.id, content);
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const handleInputChange = (value: string) => {
        setInput(value);
        startTyping(activeChat.id);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => stopTyping(activeChat.id), 1500);
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="h-16 border-b border-neutral-800 flex items-center gap-3 px-5">
                <div className="relative">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white ${info.isBot ? 'bg-gradient-to-br from-violet-600 to-indigo-600' : 'bg-neutral-700'}`}>
                        {info.isBot ? <Bot className="w-4 h-4" /> : getInitials(info.name)}
                    </div>
                    {info.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-neutral-950" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-white">{info.name}</p>
                    <p className="text-xs text-neutral-500">
                        {info.isBot ? 'Always active' : info.isOnline ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user.id} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-neutral-800 flex items-center gap-2">
                <input
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center shrink-0"
                >
                    <Send className="w-4 h-4 text-white" />
                </button>
            </div>
        </div>
    );
};