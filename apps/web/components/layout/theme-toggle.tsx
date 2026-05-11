'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CYCLE: Record<string, string> = { light: 'dark', dark: 'system', system: 'light' };
const ICONS: Record<string, React.ElementType> = { light: Sun, dark: Moon, system: Monitor };

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const t = useTranslations('topbar');
  // resolvedTheme is undefined during SSR — render placeholder to avoid hydration mismatch
  if (!resolvedTheme) return <div className="size-9" />;

  const current = resolvedTheme ?? 'dark';
  const Icon = ICONS[current] ?? Moon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setTheme(CYCLE[current] ?? 'dark')}
            aria-label={t('theme_toggle')}
            className="hover:bg-secondary/40 text-muted-foreground hover:text-foreground inline-flex size-9 items-center justify-center rounded-full transition-all"
          >
            <Icon size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{t('theme_toggle')}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
