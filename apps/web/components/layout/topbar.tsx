import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Session } from 'next-auth';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from './logo';
import { UserMenu } from './user-menu';

type NavItem = {
  key: string;
  label: string;
  href: string;
  enabled: boolean;
};

export function Topbar({ user }: { user: NonNullable<Session['user']> }) {
  const t = useTranslations('topbar');
  const navItems: NavItem[] = [
    { key: 'home', label: t('nav.home'), href: '/', enabled: true },
    { key: 'list', label: t('nav.list'), href: '#', enabled: false },
    { key: 'chat', label: t('nav.chat'), href: '/chat', enabled: true },
  ];

  return (
    <header className="border-border bg-background flex h-[52px] flex-shrink-0 items-center gap-6 border-b px-6">
      <Logo />

      {/* Desktop: nav inline */}
      <nav className="hidden gap-1 lg:flex" aria-label="Primary">
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

      {/* Mobile: hamburger com mesmos itens em dropdown */}
      <MobileNav items={navItems} label={t('nav.menu_label')} />

      <UserMenu user={user} />
    </header>
  );
}

function MobileNav({ items, label }: { items: NavItem[]; label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="hover:bg-secondary/40 inline-flex size-7 items-center justify-center rounded-md transition-colors lg:hidden"
        >
          <Menu size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {items.map((item) =>
          item.enabled ? (
            <DropdownMenuItem key={item.key} asChild>
              <Link href={item.href}>{item.label}</Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={item.key} disabled>
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
