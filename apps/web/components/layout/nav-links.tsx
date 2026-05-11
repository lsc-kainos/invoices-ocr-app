'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavItem = {
  key: string;
  label: string;
  href: string;
  enabled: boolean;
  admin?: boolean;
};

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden gap-6 lg:flex" aria-label="Primary">
      {items.map((item) =>
        item.enabled ? (
          <Link
            key={item.key}
            href={item.href}
            aria-current={pathname === item.href ? 'page' : undefined}
            className={cn(
              'relative text-sm font-medium transition-colors',
              pathname === item.href
                ? 'text-foreground'
                : item.admin
                  ? 'text-primary/80 hover:text-primary'
                  : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="flex items-center gap-1.5">
              {item.admin ? <ShieldCheck size={14} /> : null}
              {item.label}
            </span>
            {pathname === item.href && (
              <span className="bg-primary absolute -bottom-[17px] left-0 h-px w-full" />
            )}
          </Link>
        ) : (
          <span
            key={item.key}
            aria-disabled="true"
            className="text-muted-foreground pointer-events-none text-sm opacity-40 select-none"
          >
            {item.label}
          </span>
        ),
      )}
    </nav>
  );
}
