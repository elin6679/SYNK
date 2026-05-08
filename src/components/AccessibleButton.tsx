import React from 'react';
import { motion } from 'motion/react';
import { speechService } from '../lib/speech';
import { hapticService } from '../lib/haptics';

interface AccessibleButtonProps {
  onClick: () => void;
  onDoubleTap?: () => void;
  label: string;
  hint?: string;
  className?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  id?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  onClick,
  onDoubleTap,
  label,
  hint,
  className = '',
  icon,
  variant = 'primary',
  id
}) => {
  const [clickCount, setClickCount] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    hapticService.tap();
    
    // Voice feedback on first tap
    speechService.speak(`${label}${hint ? `. ${hint}` : ''}`);

    setClickCount(prev => prev + 1);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (clickCount === 0) {
        // Single tap behavior
        onClick();
      } else if (clickCount >= 1 && onDoubleTap) {
        // Double tap behavior
        onDoubleTap();
      } else {
        onClick();
      }
      setClickCount(0);
    }, 300);
  };

  const variants = {
    primary: 'bg-synk-navy text-white hover:bg-opacity-90',
    secondary: 'bg-synk-blue text-synk-navy hover:brightness-95 shadow-md',
    ghost: 'border-2 border-synk-navy/20 text-synk-navy bg-white/50 backdrop-blur-sm'
  };

  return (
    <motion.button
      id={id}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
      className={`
        relative w-full py-8 px-6 rounded-3xl flex flex-col items-center justify-center gap-4
        text-2xl font-display font-bold shadow-lg accessible-button
        ${variants[variant]}
        ${className}
      `}
      aria-label={label}
    >
      {icon && <div className="text-4xl">{icon}</div>}
      <span className="text-center leading-tight">{label}</span>
      {hint && <span className="text-sm font-normal opacity-70">{hint}</span>}
    </motion.button>
  );
};
