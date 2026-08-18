import type { Message } from '@/types';
import { format } from 'date-fns';
import clsx from 'clsx';
import { Bot } from 'lucide-react';

export const MessageBubble = ({ message, isOwn }: { message: Message; isOwn: boolean }) => {
  const isBot = message.senderType === 'BOT';

  return (
    <div className={clsx('flex gap-2 mb-3', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <div className={clsx(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 self-end',
          isBot ? 'bg-linear-to-br from-violet-600 to-indigo-600' : 'bg-neutral-700'
        )}>
          {isBot ? <Bot className="w-3.5 h-3.5 text-white" /> : message.sender.name[0]}
        </div>
      )}
      <div className={clsx('max-w-[65%]')}>
        <div
          className={clsx(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            isOwn
              ? 'bg-indigo-600 text-white rounded-br-md'
              : isBot
              ? 'bg-linear-to-br from-violet-950 to-indigo-950 border border-indigo-800/50 text-neutral-100 rounded-bl-md'
              : 'bg-neutral-800 text-neutral-100 rounded-bl-md'
          )}
        >
          {message.content}
        </div>
        <p className={clsx('text-[11px] text-neutral-500 mt-1', isOwn ? 'text-right' : 'text-left')}>
          {format(new Date(message.createdAt), 'HH:mm')}
        </p>
      </div>
    </div>
  );
};