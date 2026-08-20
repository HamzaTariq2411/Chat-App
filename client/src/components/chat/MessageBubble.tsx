import type { Message } from '@/types';
import { format } from 'date-fns';
import clsx from 'clsx';
import { Bot, RotateCw } from 'lucide-react';

export const MessageBubble = ({
  message,
  isOwn,
  showAvatar = true,
  onRetry,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onRetry?: (message: Message) => void;
}) => {
  const isBot = message.senderType === 'BOT';
  const isPending = message.id.startsWith('temp-') && !message.failed;

  return (
    <div className={clsx('flex gap-2', isOwn ? 'justify-end' : 'justify-start', showAvatar ? 'mb-3' : 'mb-1')}>
      {!isOwn && (
        <div className="w-7 shrink-0 self-end">
          {showAvatar && (
            <div
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium',
                isBot ? 'bg-linear-to-br from-violet-600 to-indigo-600' : 'bg-neutral-800 text-neutral-300'
              )}
            >
              {isBot ? <Bot className="w-3.5 h-3.5 text-white" /> : message.sender.name[0]}
            </div>
          )}
        </div>
      )}
      <div className="max-w-[65%]">
        <div className="flex items-end gap-1.5">
          {message.failed && onRetry && (
            <button
              onClick={() => onRetry(message)}
              className="text-red-400 hover:text-red-300 shrink-0 mb-1.5"
              title="Retry sending"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}
          <div
            className={clsx(
              'px-4 py-2.5 text-sm leading-relaxed transition-opacity',
              isPending && 'opacity-70',
              message.failed && 'ring-1 ring-red-500/50',
              isOwn
                ? 'bg-linear-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl rounded-br-md shadow-lg shadow-indigo-950/30'
                : isBot
                ? 'bg-neutral-900 border border-indigo-900/40 text-neutral-100 rounded-2xl rounded-bl-md'
                : 'bg-neutral-900 text-neutral-100 rounded-2xl rounded-bl-md'
            )}
          >
            {message.content}
          </div>
        </div>
        {showAvatar && (
          <div className={clsx('flex items-center gap-1.5 mt-1 px-1', isOwn ? 'justify-end' : 'justify-start')}>
            <p className="text-[10px] text-neutral-600">{format(new Date(message.createdAt), 'HH:mm')}</p>
            {isPending && <span className="text-[10px] text-neutral-600">Sending...</span>}
            {message.failed && <span className="text-[10px] text-red-400">Failed — tap to retry</span>}
          </div>
        )}
      </div>
    </div>
  );
};