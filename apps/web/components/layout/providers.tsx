'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={150}>
        {children}
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </NextThemesProvider>
  );
}
