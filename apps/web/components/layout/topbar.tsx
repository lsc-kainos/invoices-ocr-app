import Link from 'next/link';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Session } from 'next-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
    <header className="border-border bg-background flex h-[52px] flex-shrink-0 items-center gap-2 border-b px-6">
      <Logo />

      <div className="ml-3.5 flex items-center gap-1.5 rounded-md px-2 py-1 opacity-60">
        <span className="text-muted-foreground text-sm">/</span>
        <Avatar className="size-[18px]">
          <AvatarFallback className="bg-secondary text-[9px]">
            {t('workspace').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{t('workspace')}</span>
        <ChevronDown className="text-muted-foreground ml-0.5" size={11} />
      </div>

      <Separator orientation="vertical" className="mx-1.5 h-[18px]" />

      <nav className="flex gap-0" aria-label="Primary">
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

      <div className="relative w-[260px]">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          disabled
          readOnly
          placeholder={t('search_placeholder')}
          className="bg-secondary/40 h-9 cursor-not-allowed pr-12 pl-8 text-sm"
        />
        <kbd className="border-border text-muted-foreground bg-background/60 absolute top-1/2 right-2 hidden h-5 -translate-y-1/2 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] sm:inline-flex">
          ⌘K
        </kbd>
      </div>

      <UserMenu user={user} />
    </header>
  );
}
