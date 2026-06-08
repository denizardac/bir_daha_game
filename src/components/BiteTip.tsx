import type { ReactNode } from 'react';

type Tone = 'neutral' | 'gold' | 'cyan' | 'purple';

interface Props {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function BiteTip({ children, tone = 'neutral', className = '' }: Props) {
  return <p className={`bite-tip bite-tip--${tone} ${className}`.trim()}>{children}</p>;
}

interface ListProps {
  tips: string[];
  tone?: Tone;
}

export function BiteTipList({ tips, tone = 'neutral' }: ListProps) {
  if (!tips.length) return null;
  return (
    <ul className="bite-tip-list">
      {tips.map((tip) => (
        <li key={tip} className={`bite-tip bite-tip--${tone}`}>
          {tip}
        </li>
      ))}
    </ul>
  );
}
