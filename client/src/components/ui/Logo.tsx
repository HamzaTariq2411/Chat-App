import { MessageCircle } from 'lucide-react';

export const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const dims = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-12 h-12' }[size];
  const iconSize = { sm: 'w-3.5 h-3.5', md: 'w-4.5 h-4.5', lg: 'w-6 h-6' }[size];
  const textSize = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' }[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${dims} rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-950/50`}>
        <MessageCircle className={`${iconSize} text-white`} strokeWidth={2.5} />
      </div>
      <span className={`${textSize} font-semibold text-white tracking-tight`}>PennChat</span>
    </div>
  );
};