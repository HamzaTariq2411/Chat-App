import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'ghost';
}

export const Button = ({ isLoading, variant = 'primary', className, children, disabled, ...props }: ButtonProps) => {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-indigo-600 hover:bg-indigo-500 text-white',
        variant === 'ghost' && 'bg-transparent hover:bg-neutral-800 text-neutral-300',
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};