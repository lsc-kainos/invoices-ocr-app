import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Session } from 'next-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from './logo';
import { UserMenu } from './user-menu';
import { NavLinks } from './nav-links';
import { ThemeToggle } from './theme-toggle';
import type { NavItem } from './nav-links';

export function Topbar({ user }: { user: NonNullable<Session['user']> }) {
  const t = useTranslations('topbar');
  const navItems: NavItem[] = [
    { key: 'home', label: t('nav.home'), href: '/', enabled: true },
    { key: 'list', label: t('nav.list'), href: '/documents', enabled: true },
    { key: 'chat', label: t('nav.chat'), href: '/chat', enabled: true },
    ...(user.role === 'ADMIN'
      ? [
          {
            key: 'admin',
            label: t('nav.admin'),
            href: '/admin',
            enabled: true,
            admin: true,
          } satisfies NavItem,
        ]
      : []),
  ];

  return (
    <header className="border-border/40 bg-background/90 fixed inset-x-0 top-0 z-50 flex h-14 flex-shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md sm:gap-4 sm:px-6 lg:gap-6">
      <Logo size={24} />
      <div className="bg-border/50 hidden h-6 w-px sm:block" />

      <NavLinks items={navItems} />

      <div className="flex-1" />

      <ThemeToggle />

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
