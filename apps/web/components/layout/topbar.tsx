import Link from 'next/link';
import { Menu, ShieldCheck } from 'lucide-react';
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
  admin?: boolean;
};

export function Topbar({ user }: { user: NonNullable<Session['user']> }) {
  const t = useTranslations('topbar');
  const navItems: NavItem[] = [
    { key: 'home', label: t('nav.home'), href: '/', enabled: true },
    { key: 'list', label: t('nav.list'), href: '/documents', enabled: true },
    { key: 'chat', label: t('nav.chat'), href: '/chat', enabled: true },
    ...(user.role === 'ADMIN'
      ? [
          {
            key: 'benchmark',
            label: t('nav.benchmark'),
            href: '/admin/benchmark',
            enabled: true,
            admin: true,
          },
        ]
      : []),
  ];

  return (
    <header className="border-border/40 bg-background/80 sticky top-0 z-50 flex h-14 flex-shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md sm:gap-4 sm:px-6 lg:gap-6">
      <Logo size={24} />
      <div className="bg-border/50 hidden h-6 w-px sm:block" />

      {/* Desktop: nav inline with underline style */}
      <nav className="hidden gap-6 lg:flex" aria-label="Primary">
        {navItems.map((item) =>
          item.enabled ? (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'text-muted-foreground hover:text-foreground relative text-sm font-medium transition-colors',
                item.admin && 'text-primary/80 hover:text-primary',
              )}
            >
              <span className="flex items-center gap-1.5">
                {item.admin ? <ShieldCheck size={14} /> : null}
                {item.label}
              </span>
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

      <div className="flex-1" />

      {/* Mobile/tablet: hamburger with dropdown */}
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
          className="hover:bg-secondary/40 inline-flex size-9 items-center justify-center rounded-md transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
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
