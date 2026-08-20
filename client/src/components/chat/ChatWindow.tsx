'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchChatMessages } from '@/lib/chat';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useSocket } from '@/hooks/useSocket';
import { getChatDisplayInfo, getInitials } from '@/lib/chatHelpers';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Send, Bot, MessageCircle } from 'lucide-react';
import type { Message } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';

const formatDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
};

export const ChatWindow = () => {
    const user = useAuthStore((s) => s.user);
    const {
        activeChat,
        messages,
        setMessages,
        typingUsers,
        addOptimisticMessage,
        reconcileMessage,
        markMessageFailed,
    } = useChatStore();
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
        return () => { leaveChat(activeChat.id); };
    }, [activeChat?.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers]);

    // group consecutive messages from the same sender + insert date separators
    const groupedItems = useMemo(() => {
        const items: Array<{ type: 'date'; label: string } | { type: 'message'; message: Message; showAvatar: boolean }> = [];
        let lastDateLabel = '';
        let lastSenderId = '';

        messages.forEach((msg, i) => {
            const dateLabel = formatDateLabel(new Date(msg.createdAt));
            if (dateLabel !== lastDateLabel) {
                items.push({ type: 'date', label: dateLabel });
                lastDateLabel = dateLabel;
                lastSenderId = '';
            }
            const nextMsg = messages[i + 1];
            const showAvatar = !nextMsg || nextMsg.senderId !== msg.senderId;
            items.push({ type: 'message', message: msg, showAvatar });
            lastSenderId = msg.senderId;
        });

        return items;
    }, [messages]);

    if (!activeChat || !user) {
        return (
            <div className="flex-1 flex items-center justify-center text-neutral-600">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-7 h-7 opacity-50" />
                    </div>
                    <p className="text-sm">Select a chat to start messaging</p>
                </div>
            </div>
        );
    }

    const info = getChatDisplayInfo(activeChat, user.id);
    const otherMember = activeChat.members.find((m) => m.userId !== user.id);
    const isTyping = otherMember ? typingUsers.has(otherMember.userId) || (info.isBot && typingUsers.has('bot')) : false;

    const handleRetry = async (failedMessage: Message) => {
        const { removeMessage } = useChatStore.getState();
        removeMessage(failedMessage.id);

        const tempId = `temp-${Date.now()}`;
        addOptimisticMessage({ ...failedMessage, id: tempId, failed: false });

        try {
            const realMessage = (await sendMessage(failedMessage.chatId, failedMessage.content)) as Message;
            reconcileMessage(tempId, realMessage);
        } catch (err) {
            markMessageFailed(tempId);
        }
    };

    const handleSend = async () => {
        const content = input.trim();
        if (!content || !user || !activeChat) return;
        setInput('');
        stopTyping(activeChat.id);

        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            chatId: activeChat.id,
            senderId: user.id,
            senderType: 'USER',
            content,
            createdAt: new Date().toISOString(),
            sender: { ...user, isBot: false, isOnline: true },
        };

        addOptimisticMessage(optimisticMessage);

        try {
            const realMessage = (await sendMessage(activeChat.id, content)) as Message;
            reconcileMessage(tempId, realMessage);
        } catch (err) {
            console.error('Failed to send message', err);
            markMessageFailed(tempId);
        }
    };

    const handleInputChange = (value: string) => {
        setInput(value);
        startTyping(activeChat.id);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => stopTyping(activeChat.id), 1500);
    };

    return (
        <div className="flex-1 flex flex-col h-full min-w-0">
            {/* Header */}
            <div className="h-16 border-b border-neutral-800/80 flex items-center gap-3 px-6 bg-neutral-950/40 backdrop-blur-sm shrink-0">
                <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white ${info.isBot ? 'bg-linear-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-950/40' : 'bg-neutral-800'}`}>
                        {info.isBot ? <Bot className="w-4.5 h-4.5" /> : getInitials(info.name)}
                    </div>
                    {info.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-neutral-950" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-white">{info.name}</p>
                    <p className="text-xs text-neutral-500">
                        {isTyping ? (
                            <span className="text-indigo-400 italic">typing...</span>
                        ) : info.isBot ? (
                            'Always active'
                        ) : info.isOnline ? (
                            'Online'
                        ) : (
                            'Offline'
                        )}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
                {groupedItems.map((item, i) =>
                    item.type === 'date' ? (
                        <div key={`date-${i}`} className="flex items-center justify-center my-5">
                            <span className="text-[11px] font-medium text-neutral-500 bg-neutral-900/80 border border-neutral-800/80 px-3 py-1 rounded-full">
                                {item.label}
                            </span>
                        </div>
                    ) : (
                        <MessageBubble
                            key={`${item.message.id}-${i}`}
                            message={item.message}
                            isOwn={item.message.senderId === user.id}
                            showAvatar={item.showAvatar}
                            onRetry={handleRetry}
                        />
                    )
                )}
                {isTyping && <TypingIndicator />}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-neutral-800/80 flex items-center gap-2 bg-neutral-950/40">
                <input
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-neutral-900/80 border border-neutral-800 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="w-10 h-10 rounded-full bg-linear-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-40 disabled:scale-95 flex items-center justify-center shrink-0 transition-all shadow-lg shadow-indigo-950/40"
                >
                    <Send className="w-4 h-4 text-white" />
                </button>
            </div>
        </div>
    );
};