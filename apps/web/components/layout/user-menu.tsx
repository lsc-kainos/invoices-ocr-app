'use client';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserMenu({
  user,
}: {
  user: { name?: string | null; email: string; image?: string | null };
}) {
  const t = useTranslations('topbar.menu');
  const tBar = useTranslations('topbar');
  const { theme, setTheme } = useTheme();
  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={tBar('user_menu_label')} className="rounded-full">
          <Avatar className="border-border size-7 cursor-pointer border">
            {user.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="bg-secondary text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm font-medium">{user.name ?? user.email}</span>
          <span className="text-muted-foreground text-xs">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{t('theme')}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme('light')} aria-checked={theme === 'light'}>
              {t('theme_light')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} aria-checked={theme === 'dark'}>
              {t('theme_dark')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} aria-checked={theme === 'system'}>
              {t('theme_system')}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
