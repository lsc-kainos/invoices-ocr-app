import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Session } from 'next-auth';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { UserMenu } from './user-menu';

export function Topbar({ user }: { user: NonNullable<Session['user']> }) {
  const t = useTranslations('topbar');
  const navItems = [
    { key: 'home', label: t('nav.home'), href: '/' as const, enabled: true },
    { key: 'list', label: t('nav.list'), href: '#' as const, enabled: false },
    { key: 'chat', label: t('nav.chat'), href: '#' as const, enabled: false },
  ];

  return (
    <header className="border-border bg-background flex h-[52px] flex-shrink-0 items-center gap-6 border-b px-6">
      <Logo />

      <nav className="flex gap-1" aria-label="Primary">
        {navItems.map((item) =>
          item.enabled ? (
            <Link
              key={item.key}
              href={item.href}
              className="text-foreground bg-secondary/40 rounded-md px-2.5 py-1.5 text-sm font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span
              key={item.key}
              aria-disabled="true"
              className={cn(
                'text-muted-foreground rounded-md px-2.5 py-1.5 text-sm',
                'pointer-events-none opacity-40 select-none',
              )}
            >
              {item.label}
            </span>
          ),
        )}
      </nav>

      <div className="flex-1" />

      <UserMenu user={user} />
    </header>
  );
}
