import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 22 }: LogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span
        className="relative grid place-items-center rounded-md font-semibold tracking-tight"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.55,
          letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, var(--foreground) 0%, var(--muted-foreground) 100%)',
          border: '1px solid oklch(0.3618 0.0101 106.8928 / 0.4)',
        }}
        aria-hidden
      >
        <span className="font-serif italic text-background">i</span>
        <span
          className="absolute top-[3px] right-[3px] size-1 animate-pulse rounded-full"
          style={{ background: 'var(--ring)', boxShadow: '0 0 6px var(--ring)' }}
        />
      </span>
      <span className="text-sm font-medium tracking-tight sm:text-base">Invoices</span>
    </div>
  );
}
