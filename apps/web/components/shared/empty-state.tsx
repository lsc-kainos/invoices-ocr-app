import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-4 py-16 text-center', className)}
    >
      {Icon && (
        <div className="bg-muted/60 border-border/40 mb-4 flex h-12 w-12 items-center justify-center rounded-full border">
          <Icon className="text-muted-foreground h-5 w-5" />
        </div>
      )}
      <h2 className="text-foreground text-sm font-medium">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-xs text-[12px] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
