import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 22 }: LogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className="text-background bg-foreground relative grid place-items-center rounded-md font-semibold tracking-tight"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.55,
          letterSpacing: '-0.04em',
        }}
        aria-hidden
      >
        i
        <span
          className="absolute top-[3px] right-[3px] size-1 rounded-full"
          style={{ background: 'var(--ring)' }}
        />
      </span>
      <span className="text-sm font-medium tracking-tight">Invoices</span>
    </div>
  );
}
