export const TypingIndicator = () => (
  <div className="flex gap-1 items-center px-4 py-3 bg-neutral-900 rounded-2xl rounded-bl-md w-fit mb-3 ml-9">
    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
  </div>
);